from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Subject, Theme, UserStat

subjects_bp = Blueprint("subjects", __name__, url_prefix="/api/subjects")


@subjects_bp.get("")
def get_subjects():
    """Get all subjects."""
    subjects = Subject.query.all()
    return jsonify([s.to_dict() for s in subjects])


@subjects_bp.get("/<int:subject_id>")
def get_subject(subject_id: int):
    """Get subject by ID."""
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify(subject.to_dict())


@subjects_bp.get("/<int:subject_id>/themes")
def get_subject_themes(subject_id: int):
    """Get all themes for a subject."""
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    themes = Theme.query.filter_by(subject_id=subject_id).all()
    return jsonify([t.to_dict() for t in themes])


@subjects_bp.get("/<int:subject_id>/progress")
@jwt_required()
def get_subject_progress(subject_id: int):
    """Get user's progress in a subject."""
    user_id = get_jwt_identity()
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    # Get overall progress for this subject
    overall_stat = UserStat.query.filter_by(
        user_id=user_id,
        subject_id=subject_id,
        theme_id=None
    ).first()

    if not overall_stat:
        return jsonify({
            "subject_id": subject_id,
            "total_answers": 0,
            "correct_answers": 0,
            "progress": 0.0,
            "themes": []
        })

    # Get progress per theme
    theme_stats = UserStat.query.filter_by(
        user_id=user_id,
        subject_id=subject_id
    ).filter(UserStat.theme_id != None).all()

    return jsonify({
        "subject_id": subject_id,
        "total_answers": overall_stat.total_answers,
        "correct_answers": overall_stat.correct_answers,
        "progress": overall_stat.get_progress(),
        "themes": [
            {
                "theme_id": ts.theme_id,
                "theme_name": ts.theme.name if ts.theme else None,
                "total_answers": ts.total_answers,
                "correct_answers": ts.correct_answers,
                "progress": ts.get_progress(),
            }
            for ts in theme_stats
        ]
    })
