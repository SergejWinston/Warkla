from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Question, UserAnswer, UserStat

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

    # Check answer
    is_correct = check_answer(question, user_answer)

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
            theme_id=None
        )
        db.session.add(overall_stat)

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
                theme_id=question.theme_id
            )
            db.session.add(theme_stat)

        theme_stat.total_answers += 1
        if is_correct:
            theme_stat.correct_answers += 1

    db.session.commit()

    return jsonify({
        "is_correct": is_correct,
        "correct_answer": question.answer,
        "explanation": question.explanation,
        "user_answer": user_answer,
        "question_id": question_id
    })


@answers_bp.get("/history")
@jwt_required()
def get_answer_history():
    """Get user's answer history."""
    user_id = get_jwt_identity()
    subject_id = request.args.get("subject", type=int)
    theme_id = request.args.get("theme", type=int)
    limit = request.args.get("limit", 20, type=int)

    query = UserAnswer.query.filter_by(user_id=user_id)

    if subject_id:
        query = query.join(Question).filter(Question.subject_id == subject_id)

    if theme_id:
        query = query.join(Question).filter(Question.theme_id == theme_id)

    answers = query.order_by(UserAnswer.answered_at.desc()).limit(limit).all()

    return jsonify([a.to_dict() for a in answers])


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
