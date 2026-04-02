from typing import Dict, List, Tuple
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from werkzeug.datastructures import ImmutableMultiDict

from app.extensions import db
from app.models import Question, Subject
from app.services.question_loader import NeoFamilyQuestionLoader

questions_bp = Blueprint("questions", __name__, url_prefix="/api/questions")


def _parse_sort_params(args: ImmutableMultiDict) -> List[Tuple[str, str]]:
    """
    Parse sorting parameters from request arguments.
    
    Supports multiple formats:
    1. sort[field]=order (NeoFamily API style, multiple allowed)
    2. sort_by=field + sort_order=order (legacy style)
    
    Returns:
        List of (field, order) tuples, e.g., [('id', 'asc'), ('difficulty', 'desc')]
    """
    sort_params: List[Tuple[str, str]] = []
    
    # Parse sort[field]=order format (multiple parameters allowed)
    for key in args.keys():
        if key.startswith("sort[") and key.endswith("]"):
            field = key[5:-1]  # Extract field name from sort[field]
            order = args.get(key, "asc").lower()
            if order in ("asc", "desc"):
                sort_params.append((field, order))
    
    # Fallback to legacy sort_by + sort_order format if no sort[...] params found
    if not sort_params:
        sort_by = args.get("sort_by", "id")
        sort_order = args.get("sort_order", "asc").lower()
        if sort_order in ("asc", "desc"):
            sort_params.append((sort_by, sort_order))
    
    # Default to sorting by ID if no valid params provided
    if not sort_params:
        sort_params.append(("id", "asc"))
    
    return sort_params


@questions_bp.get("")
@jwt_required()
def get_question():
    """Get paginated questions from local task-bank cache."""
    subject_slug = request.args.get("subject_slug", type=str)
    subject_id = request.args.get("subject", type=int)
    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=15, type=int)
    theme_id = request.args.get("theme_id", default=None, type=int)
    
    # Parse sorting parameters from request
    # Supports formats: sort[field]=order, sort_by=field + sort_order=order
    sort_params = _parse_sort_params(request.args)

    if not subject_slug and subject_id:
        subject = Subject.query.get(subject_id)
        subject_slug = subject.slug if subject else None

    if not subject_slug:
        return jsonify({"error": "subject_slug is required"}), 400

    result = NeoFamilyQuestionLoader.get_local_paginated_questions(
        subject_slug=subject_slug,
        page=page,
        per_page=per_page,
        theme_id=theme_id,
        sort_params=sort_params,
    )

    if not result["data"]:
        NeoFamilyQuestionLoader.sync_questions_for_subject(subject_slug, max_pages=2, per_page=per_page)
        result = NeoFamilyQuestionLoader.get_local_paginated_questions(
            subject_slug=subject_slug,
            page=page,
            per_page=per_page,
            theme_id=theme_id,
            sort_params=sort_params,
        )

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
    """Get question solution and explanation (hydrated from NeoFamily if needed)."""
    question = Question.query.get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    if question.source == "neofamily" and question.external_id and not question.solution_html:
        solution_html = NeoFamilyQuestionLoader.fetch_solution(question.external_id)
        if solution_html:
            question.solution_html = solution_html
            db.session.commit()

    return jsonify(question.to_dict(include_answer=False))


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
