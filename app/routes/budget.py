from __future__ import annotations

from calendar import monthrange
from datetime import date, datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import User
from app.services.analytics import (
    budget_warning_payload,
    calculate_balance,
    calculate_days_to_stipend,
    calculate_today_limit,
    category_timeline,
    categories_breakdown,
    detect_anomalies,
    income_breakdown,
    month_end_forecast,
    period_comparison,
    spending_statistics,
    timeline_data,
    warning_legacy_text,
)


budget_bp = Blueprint("budget", __name__, url_prefix="/api")


def _current_user() -> User | None:
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def _parse_date(raw: str | None, fallback: date) -> date:
    if not raw:
        return fallback

    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        return fallback


def _parse_positive_int(raw: str | None, fallback: int, minimum: int, maximum: int) -> int:
    if not raw:
        return fallback

    try:
        value = int(raw)
    except (TypeError, ValueError):
        return fallback

    return max(minimum, min(maximum, value))


@budget_bp.get("/dashboard")
@jwt_required()
def dashboard():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    today = date.today()
    balance = calculate_balance(user.id)
    days_to_stipend = calculate_days_to_stipend(user.stipend_day, today)
    today_limit = calculate_today_limit(user.id, user.stipend_day, today)
    forecast = month_end_forecast(user.id, today)
    warning_payload = budget_warning_payload(user.id, user.stipend_day, today, forecast=forecast)

    return jsonify(
        {
            "current_balance": float(balance),
            "days_to_stipend": days_to_stipend,
            "today_limit": float(today_limit),
            "month_end_forecast": float(forecast),
            "forecast_status": "success" if forecast >= 0 else "danger",
            "warning_status": warning_payload["status"],
            "warning_key": warning_payload["key"],
            "warning_meta": warning_payload["meta"],
            "warning": warning_legacy_text(warning_payload["key"]),
        }
    )


@budget_bp.get("/analytics/categories")
@jwt_required()
def analytics_categories():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    today = date.today()
    month_start = today.replace(day=1)
    month_end = today.replace(day=monthrange(today.year, today.month)[1])

    date_from = _parse_date(request.args.get("date_from"), month_start)
    date_to = _parse_date(request.args.get("date_to"), month_end)

    return jsonify({"items": categories_breakdown(user.id, date_from, date_to)})


@budget_bp.get("/analytics/timeline")
@jwt_required()
def analytics_timeline():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    today = date.today()
    month_start = today.replace(day=1)

    date_from = _parse_date(request.args.get("date_from"), month_start)
    date_to = _parse_date(request.args.get("date_to"), today)

    if date_from > date_to:
        return jsonify({"error": "date_from must be <= date_to"}), 400

    return jsonify({"items": timeline_data(user.id, date_from, date_to)})


@budget_bp.get("/analytics/forecast")
@jwt_required()
def analytics_forecast():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    forecast = month_end_forecast(user.id)
    return jsonify(
        {
            "month_end_forecast": float(forecast),
            "status": "success" if forecast >= 0 else "danger",
            "hint": "If status is danger, reduce your daily expenses to your safe limit.",
        }
    )


@budget_bp.get("/analytics/sources")
@jwt_required()
def analytics_sources():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    today = date.today()
    month_start = today.replace(day=1)
    month_end = today.replace(day=monthrange(today.year, today.month)[1])

    date_from = _parse_date(request.args.get("date_from"), month_start)
    date_to = _parse_date(request.args.get("date_to"), month_end)

    if date_from > date_to:
        return jsonify({"error": "date_from must be <= date_to"}), 400

    return jsonify({"items": income_breakdown(user.id, date_from, date_to)})


@budget_bp.get("/analytics/stats")
@jwt_required()
def analytics_stats():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    today = date.today()
    month_start = today.replace(day=1)
    date_from = _parse_date(request.args.get("date_from"), month_start)
    date_to = _parse_date(request.args.get("date_to"), today)

    if date_from > date_to:
        return jsonify({"error": "date_from must be <= date_to"}), 400

    return jsonify(spending_statistics(user.id, date_from, date_to))


@budget_bp.get("/analytics/comparison")
@jwt_required()
def analytics_comparison():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    period = (request.args.get("period") or "month").strip().lower()
    if period not in {"week", "month", "quarter"}:
        return jsonify({"error": "period must be one of: week, month, quarter"}), 400

    return jsonify(period_comparison(user.id, period=period))


@budget_bp.get("/analytics/category/<string:category>/timeline")
@jwt_required()
def analytics_category_timeline(category: str):
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    today = date.today()
    month_start = today.replace(day=1)
    date_from = _parse_date(request.args.get("date_from"), month_start)
    date_to = _parse_date(request.args.get("date_to"), today)

    if date_from > date_to:
        return jsonify({"error": "date_from must be <= date_to"}), 400

    return jsonify({"items": category_timeline(user.id, category, date_from, date_to)})


@budget_bp.get("/analytics/anomalies")
@jwt_required()
def analytics_anomalies():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    lookback = _parse_positive_int(request.args.get("lookback"), fallback=90, minimum=7, maximum=365)
    return jsonify({"items": detect_anomalies(user.id, lookback_days=lookback), "lookback_days": lookback})
