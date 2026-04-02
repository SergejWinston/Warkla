from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import Banner, Subject, Theme, UserStat
from app.services.question_loader import NeoFamilyQuestionLoader

subjects_bp = Blueprint("subjects", __name__, url_prefix="/api/subjects")


@subjects_bp.get("")
def get_subjects():
    """Get all active subjects available in task-bank."""
    subjects = Subject.query.filter_by(is_active=True).order_by(Subject.name.asc()).all()
    return jsonify([s.to_dict() for s in subjects])


@subjects_bp.get("/<int:subject_id>")
def get_subject(subject_id: int):
    """Get subject by ID."""
    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"error": "Subject not found"}), 404
    return jsonify(subject.to_dict())


@subjects_bp.get("/by-slug/<string:subject_slug>")
def get_subject_by_slug(subject_slug: str):
    """Get subject by slug."""
    subject = Subject.query.filter_by(slug=subject_slug).first()
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


@subjects_bp.get("/<string:subject_slug>/banner")
def get_subject_banner(subject_slug: str):
    """Get latest banner for a subject by slug."""
    subject = Subject.query.filter_by(slug=subject_slug).first()
    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    banner = Banner.query.filter_by(subject_id=subject.id).order_by(Banner.updated_at.desc(), Banner.id.desc()).first()
    if not banner:
        return jsonify({"data": None}), 200

    return jsonify({"data": banner.to_dict()})


@subjects_bp.post("/sync")
def sync_subjects():
    """Trigger manual NeoFamily sync cycle."""
    summary = NeoFamilyQuestionLoader.bootstrap_sync(max_pages=2, per_page=15)
    return jsonify({"status": "ok", "summary": summary})


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
