from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from sqlalchemy import func
from app.extensions import db
from app.models import Question, Subject, Theme
from app.services.cache import cache

questions_bp = Blueprint("questions", __name__, url_prefix="/api/questions")


@questions_bp.get("")
@jwt_required()
def get_question():
    """Get a random question with optional filtering and caching."""
    user_id = get_jwt_identity()
    subject_id = request.args.get("subject", type=int)
    theme_id = request.args.get("theme", type=int)

    # Try to get from cache
    cache_key = f"question:random:{subject_id}:{theme_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return jsonify(cached)

    query = Question.query

    if subject_id:
        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({"error": "Subject not found"}), 404
        query = query.filter_by(subject_id=subject_id)

    if theme_id:
        theme = Theme.query.get(theme_id)
        if not theme:
            return jsonify({"error": "Theme not found"}), 404
        query = query.filter_by(theme_id=theme_id)

    # Get random question
    question = query.order_by(func.random()).first()

    if not question:
        return jsonify({"error": "No questions found"}), 404

    result = question.to_dict(include_answer=False)
    # Cache for 1 hour
    cache.set(cache_key, result, ttl=3600)
    return jsonify(result)


@questions_bp.get("/<int:question_id>")
@jwt_required()
def get_question_by_id(question_id: int):
    """Get question by ID (without answer)."""
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    return jsonify(question.to_dict(include_answer=False))


@questions_bp.get("/<int:question_id>/solution")
@jwt_required()
def get_question_solution(question_id: int):
    """Get question with answer and explanation."""
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    return jsonify(question.to_dict(include_answer=True))


@questions_bp.get("/count")
def get_question_count():
    """Get total count of questions."""
    total = Question.query.count()
    by_subject = db.session.query(
        Question.subject_id,
        Subject.name,
        func.count(Question.id).label("count")
    ).join(Subject).group_by(Question.subject_id, Subject.name).all()

    return jsonify({
        "total": total,
        "by_subject": [
            {
                "subject_id": s[0],
                "subject_name": s[1],
                "count": s[2]
            }
            for s in by_subject
        ]
    })
