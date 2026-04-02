from typing import Optional

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Question, UserAnswer, UserStat
from app.services.question_loader import NeoFamilyQuestionLoader

answers_bp = Blueprint("answers", __name__, url_prefix="/api/answers")


def normalize_answer(answer: str) -> str:
    """Normalize answer for comparison."""
    return answer.strip().lower()


def check_answer(question: Question, user_answer: str) -> bool:
    """Check if user's answer is correct."""
    if question.question_type == "choice":
        # For choice questions, answer is like "1" or "A"
        correct = question.answer.strip().lower()
        user = normalize_answer(user_answer)
        return user == correct
    elif question.question_type == "number":
        # For number questions
        try:
            correct_num = float(question.answer)
            user_num = float(user_answer)
            # Allow small tolerance for floating point numbers
            return abs(correct_num - user_num) < 0.001
        except ValueError:
            return False
    elif question.question_type == "text":
        # For text answers - exact match after normalization
        return normalize_answer(question.answer) == normalize_answer(user_answer)
    elif question.question_type == "multiple":
        # For multiple choice - split by comma and compare sets
        correct_set = {x.strip().lower() for x in question.answer.split(",")}
        user_set = {x.strip().lower() for x in user_answer.split(",")}
        return correct_set == user_set
    else:
        return False


def check_answer_with_source(question: Question, user_answer: str) -> bool:
    """Check answer using source-specific strategy."""
    if (
        question.source == "neofamily"
        and question.external_id
        and question.answer == NeoFamilyQuestionLoader.REMOTE_CHECK_PLACEHOLDER
    ):
        remote_result = NeoFamilyQuestionLoader.check_task_answer(question.external_id, user_answer)
        if remote_result is not None:
            return remote_result

    return check_answer(question, user_answer)


def _serialize_history_item(answer: UserAnswer) -> dict:
    """Serialize history record with question metadata expected by frontend."""
    result = answer.to_dict()
    question = answer.question

    if not question:
        result["question_text"] = None
        result["question_html_text"] = None
        result["correct_answer"] = None
        result["subject_id"] = None
        result["theme_id"] = None
        return result

    result["question_text"] = question.text
    result["question_html_text"] = question.html_text
    result["subject_id"] = question.subject_id
    result["theme_id"] = question.theme_id

    if (
        question.source == "neofamily"
        and question.answer == NeoFamilyQuestionLoader.REMOTE_CHECK_PLACEHOLDER
    ):
        result["correct_answer"] = None
    else:
        result["correct_answer"] = question.answer

    return result


def _normalize_stat_values(stat: UserStat) -> None:
    """Normalize nullable counters before arithmetic updates."""
    stat.total_answers = max(0, stat.total_answers or 0)
    stat.correct_answers = max(0, stat.correct_answers or 0)
    if stat.correct_answers > stat.total_answers:
        stat.correct_answers = stat.total_answers


def _decrement_user_stat(stat: Optional[UserStat], was_correct: bool) -> None:
    """Safely decrement denormalized stat counters."""
    if not stat:
        return

    _normalize_stat_values(stat)
    if stat.total_answers == 0:
        return

    stat.total_answers -= 1
    if was_correct and stat.correct_answers > 0:
        stat.correct_answers -= 1
    if stat.correct_answers > stat.total_answers:
        stat.correct_answers = stat.total_answers

    if stat.total_answers == 0 and stat.correct_answers == 0:
        db.session.delete(stat)


@answers_bp.post("")
@jwt_required()
def submit_answer():
    """Submit answer to a question."""
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    question_id = data.get("question_id")
    user_answer = data.get("answer", "").strip()
    time_spent = data.get("time_spent", None)

    if not question_id or not user_answer:
        return jsonify({"error": "question_id and answer are required"}), 400

    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    # Check answer (remote NeoFamily validation where applicable)
    is_correct = check_answer_with_source(question, user_answer)

    if question.source == "neofamily" and question.external_id and not question.solution_html:
        solution_html = NeoFamilyQuestionLoader.fetch_solution(question.external_id)
        if solution_html:
            question.solution_html = solution_html

    # Save user's answer
    answer_record = UserAnswer(
        user_id=user_id,
        question_id=question_id,
        user_answer=user_answer,
        is_correct=is_correct,
        time_spent=time_spent
    )
    db.session.add(answer_record)

    # Update user statistics - overall for subject
    overall_stat = UserStat.query.filter_by(
        user_id=user_id,
        subject_id=question.subject_id,
        theme_id=None
    ).first()

    if not overall_stat:
        overall_stat = UserStat(
            user_id=user_id,
            subject_id=question.subject_id,
            theme_id=None,
            total_answers=0,
            correct_answers=0,
        )
        db.session.add(overall_stat)

    # Normalize possible legacy NULL values before arithmetic updates.
    overall_stat.total_answers = overall_stat.total_answers or 0
    overall_stat.correct_answers = overall_stat.correct_answers or 0
    overall_stat.total_answers += 1
    if is_correct:
        overall_stat.correct_answers += 1

    # Update user statistics - per theme if theme exists
    if question.theme_id:
        theme_stat = UserStat.query.filter_by(
            user_id=user_id,
            subject_id=question.subject_id,
            theme_id=question.theme_id
        ).first()

        if not theme_stat:
            theme_stat = UserStat(
                user_id=user_id,
                subject_id=question.subject_id,
                theme_id=question.theme_id,
                total_answers=0,
                correct_answers=0,
            )
            db.session.add(theme_stat)

        # Normalize possible legacy NULL values before arithmetic updates.
        theme_stat.total_answers = theme_stat.total_answers or 0
        theme_stat.correct_answers = theme_stat.correct_answers or 0
        theme_stat.total_answers += 1
        if is_correct:
            theme_stat.correct_answers += 1

    db.session.commit()

    correct_answer = question.answer
    if (
        question.source == "neofamily"
        and question.answer == NeoFamilyQuestionLoader.REMOTE_CHECK_PLACEHOLDER
    ):
        correct_answer = None

    return jsonify(
        {
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "explanation": question.explanation,
            "solution_html": question.solution_html,
            "user_answer": user_answer,
            "question_id": question_id,
        }
    )


@answers_bp.get("/history")
@jwt_required()
def get_answer_history():
    """Get user's answer history."""
    user_id = get_jwt_identity()
    subject_id = request.args.get("subject", type=int)
    theme_id = request.args.get("theme", type=int)
    limit = request.args.get("limit", 20, type=int) or 20
    offset = request.args.get("offset", 0, type=int) or 0

    limit = max(1, min(limit, 100))
    offset = max(0, offset)

    query = UserAnswer.query.filter_by(user_id=user_id)

    if subject_id:
        query = query.join(Question).filter(Question.subject_id == subject_id)

    if theme_id:
        query = query.join(Question).filter(Question.theme_id == theme_id)

    answers = (
        query.order_by(UserAnswer.answered_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return jsonify([_serialize_history_item(a) for a in answers])


@answers_bp.delete("/history/<int:answer_id>")
@jwt_required()
def delete_history_answer(answer_id: int):
    """Delete one history item for current user and keep stats in sync."""
    user_id = get_jwt_identity()

    answer = UserAnswer.query.filter_by(id=answer_id, user_id=user_id).first()
    if not answer:
        return jsonify({"error": "History item not found"}), 404

    question = answer.question

    if question:
        overall_stat = UserStat.query.filter_by(
            user_id=user_id,
            subject_id=question.subject_id,
            theme_id=None,
        ).first()
        _decrement_user_stat(overall_stat, answer.is_correct)

        if question.theme_id:
            theme_stat = UserStat.query.filter_by(
                user_id=user_id,
                subject_id=question.subject_id,
                theme_id=question.theme_id,
            ).first()
            _decrement_user_stat(theme_stat, answer.is_correct)

    db.session.delete(answer)
    db.session.commit()

    return jsonify({"status": "deleted", "id": answer_id})


@answers_bp.get("/stats")
@jwt_required()
def get_answer_stats():
    """Get overall answer statistics."""
    user_id = get_jwt_identity()

    total_answers = db.session.query(UserAnswer).filter_by(user_id=user_id).count()
    correct_answers = db.session.query(UserAnswer).filter_by(user_id=user_id, is_correct=True).count()

    accuracy = 0.0
    if total_answers > 0:
        accuracy = (correct_answers / total_answers) * 100

    return jsonify({
        "total_answers": total_answers,
        "correct_answers": correct_answers,
        "accuracy_percentage": round(accuracy, 2)
    })
