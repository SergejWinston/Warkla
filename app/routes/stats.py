from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from sqlalchemy import func
from app.extensions import db
from app.models import User, UserStat, UserAnswer

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")


@stats_bp.get("")
@jwt_required()
def get_overall_stats():
    """Get overall user statistics."""
    user_id = get_jwt_identity()

    total_answers = db.session.query(UserAnswer).filter_by(user_id=user_id).count()
    correct_answers = db.session.query(UserAnswer).filter_by(user_id=user_id, is_correct=True).count()

    accuracy = 0.0
    if total_answers > 0:
        accuracy = (correct_answers / total_answers) * 100

    # Get last 7 days activity
    from datetime import datetime, timedelta, timezone
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    daily_stats = db.session.query(
        func.date(UserAnswer.answered_at).label("date"),
        func.count(UserAnswer.id).label("total"),
        func.sum(func.cast(UserAnswer.is_correct, db.Integer)).label("correct")
    ).filter(
        UserAnswer.user_id == user_id,
        UserAnswer.answered_at >= seven_days_ago
    ).group_by(func.date(UserAnswer.answered_at)).all()

    return jsonify({
        "total_answers": total_answers,
        "correct_answers": correct_answers,
        "accuracy_percentage": round(accuracy, 2),
        "daily_activity": [
            {
                "date": str(d[0]),
                "total": d[1],
                "correct": d[2] or 0
            }
            for d in daily_stats
        ]
    })


@stats_bp.get("/subjects")
@jwt_required()
def get_subjects_stats():
    """Get statistics by subject."""
    user_id = get_jwt_identity()

    stats = UserStat.query.filter_by(
        user_id=user_id,
        theme_id=None
    ).all()

    return jsonify([s.to_dict() for s in stats])


@stats_bp.get("/subject/<int:subject_id>")
@jwt_required()
def get_subject_stats(subject_id: int):
    """Get statistics for a specific subject."""
    user_id = get_jwt_identity()

    # Overall subject stat
    overall = UserStat.query.filter_by(
        user_id=user_id,
        subject_id=subject_id,
        theme_id=None
    ).first()

    if not overall:
        return jsonify({
            "subject_id": subject_id,
            "total_answers": 0,
            "correct_answers": 0,
            "progress": 0.0,
            "themes": []
        })

    # Per-theme stats
    themes = UserStat.query.filter_by(
        user_id=user_id,
        subject_id=subject_id
    ).filter(UserStat.theme_id != None).all()

    return jsonify({
        "subject_id": subject_id,
        "total_answers": overall.total_answers,
        "correct_answers": overall.correct_answers,
        "progress": overall.get_progress(),
        "themes": [t.to_dict() for t in themes]
    })


@stats_bp.get("/theme/<int:theme_id>")
@jwt_required()
def get_theme_stats(theme_id: int):
    """Get statistics for a specific theme."""
    user_id = get_jwt_identity()

    stat = UserStat.query.filter_by(
        user_id=user_id,
        theme_id=theme_id
    ).first()

    if not stat:
        return jsonify({
            "theme_id": theme_id,
            "total_answers": 0,
            "correct_answers": 0,
            "progress": 0.0
        })

    return jsonify(stat.to_dict())


@stats_bp.get("/streak")
@jwt_required()
def get_daily_streak():
    """Get user's daily streak."""
    user_id = get_jwt_identity()

    from datetime import datetime, timezone, timedelta

    # Get user's answer dates
    answer_dates = db.session.query(
        func.date(UserAnswer.answered_at).label("date")
    ).filter(
        UserAnswer.user_id == user_id
    ).distinct().order_by(func.date(UserAnswer.answered_at).desc()).all()

    if not answer_dates:
        return jsonify({"streak": 0, "last_answer_date": None})

    streak = 0
    current_date = None

    for answer_date in answer_dates:
        date = answer_date[0]
        if current_date is None:
            # First date
            today = datetime.now(timezone.utc).date()
            if date == today or date == today - timedelta(days=1):
                streak = 1
                current_date = date
            else:
                break
        else:
            # Check if it's consecutive
            if date == current_date - timedelta(days=1):
                streak += 1
                current_date = date
            else:
                break

    last_answer_date = answer_dates[0][0] if answer_dates else None

    return jsonify({
        "streak": streak,
        "last_answer_date": str(last_answer_date) if last_answer_date else None
    })


@stats_bp.get("/leaderboard")
def get_leaderboard():
    """Get top users by accuracy."""
    limit = request.args.get("limit", 10, type=int)

    correct_sum = func.coalesce(func.sum(func.cast(UserAnswer.is_correct, db.Integer)), 0)
    total_count = func.count(UserAnswer.id)

    leaderboard = db.session.query(
        User.username.label("username"),
        total_count.label("total"),
        correct_sum.label("correct"),
    ).join(UserAnswer, UserAnswer.user_id == User.id).group_by(
        User.id, User.username
    ).order_by(
        (correct_sum * 1.0 / total_count).desc()
    ).limit(limit).all()

    return jsonify([
        {
            "username": l[0],
            "total_answers": l[1],
            "correct_answers": l[2] or 0,
            "accuracy": round(((l[2] or 0) / l[1] * 100), 2) if l[1] > 0 else 0,
        }
        for l in leaderboard
    ])
