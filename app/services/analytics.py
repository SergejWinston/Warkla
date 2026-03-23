from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta
from decimal import Decimal
from math import sqrt

from sqlalchemy import func

from app.models import Transaction


WARNING_PRIORITY = {
    "danger": 4,
    "warning": 3,
    "info": 2,
    "success": 1,
}

LEGACY_WARNING_TEXT = {
    "warning_budget_depleted": "Budget is depleted. Any new expense worsens your outlook.",
    "warning_daily_limit_exceeded": "Today's spending exceeded your safe limit.",
    "warning_negative_forecast": "Forecast is negative. Consider reducing daily expenses.",
    "warning_no_expenses_today": "No expenses logged today yet.",
    "warning_budget_stable": "Budget looks stable for now.",
}


def _clamp_day(day: int, year: int, month: int) -> int:
    return min(max(1, day), monthrange(year, month)[1])


def calculate_days_to_stipend(stipend_day: int, today: date | None = None) -> int:
    today = today or date.today()

    target_day = _clamp_day(stipend_day, today.year, today.month)
    target = date(today.year, today.month, target_day)

    if target >= today:
        return (target - today).days

    next_month = today.month + 1
    next_year = today.year
    if next_month == 13:
        next_month = 1
        next_year += 1

    target_day_next = _clamp_day(stipend_day, next_year, next_month)
    next_target = date(next_year, next_month, target_day_next)
    return (next_target - today).days


def _sum_for_range(user_id: int, tx_type: str, start: date, end: date) -> Decimal:
    value = (
        Transaction.query.with_entities(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == tx_type)
        .filter(Transaction.tx_date >= start)
        .filter(Transaction.tx_date <= end)
        .scalar()
    )
    return Decimal(value or 0)


def calculate_balance(user_id: int) -> Decimal:
    total_income = _sum_for_range(user_id, "income", date(1970, 1, 1), date(2999, 1, 1))
    total_expense = _sum_for_range(user_id, "expense", date(1970, 1, 1), date(2999, 1, 1))
    return total_income - total_expense


def calculate_today_limit(user_id: int, stipend_day: int, today: date | None = None) -> Decimal:
    today = today or date.today()
    days_left = max(1, calculate_days_to_stipend(stipend_day, today))
    balance = calculate_balance(user_id)
    return balance / Decimal(days_left)


def month_end_forecast(user_id: int, today: date | None = None) -> Decimal:
    today = today or date.today()
    month_start = today.replace(day=1)
    days_in_month = monthrange(today.year, today.month)[1]
    month_end = today.replace(day=days_in_month)

    income_so_far = _sum_for_range(user_id, "income", month_start, today)
    expense_so_far = _sum_for_range(user_id, "expense", month_start, today)

    elapsed_days = max(1, (today - month_start).days + 1)
    remaining_days = (month_end - today).days

    avg_daily_income = income_so_far / Decimal(elapsed_days)
    avg_daily_expense = expense_so_far / Decimal(elapsed_days)

    expected_income = avg_daily_income * Decimal(remaining_days)
    expected_expense = avg_daily_expense * Decimal(remaining_days)

    current_balance = calculate_balance(user_id)
    return current_balance + expected_income - expected_expense


def categories_breakdown(user_id: int, date_from: date, date_to: date) -> list[dict]:
    rows = (
        Transaction.query.with_entities(
            Transaction.category,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        )
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .filter(Transaction.tx_date >= date_from)
        .filter(Transaction.tx_date <= date_to)
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )

    return [
        {
            "category": category or "Без категории",
            "amount": float(total),
        }
        for category, total in rows
    ]


def timeline_data(user_id: int, date_from: date, date_to: date) -> list[dict]:
    incomes = (
        Transaction.query.with_entities(Transaction.tx_date, func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "income")
        .filter(Transaction.tx_date >= date_from)
        .filter(Transaction.tx_date <= date_to)
        .group_by(Transaction.tx_date)
        .all()
    )
    expenses = (
        Transaction.query.with_entities(Transaction.tx_date, func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .filter(Transaction.tx_date >= date_from)
        .filter(Transaction.tx_date <= date_to)
        .group_by(Transaction.tx_date)
        .all()
    )

    income_map = {d: Decimal(v) for d, v in incomes}
    expense_map = {d: Decimal(v) for d, v in expenses}

    cursor = date_from
    running = Decimal(0)
    data = []
    while cursor <= date_to:
        running += income_map.get(cursor, Decimal(0)) - expense_map.get(cursor, Decimal(0))
        data.append({"date": cursor.isoformat(), "balance": float(running)})
        cursor += timedelta(days=1)

    return data


def _pick_warning(items: list[dict]) -> dict:
    if not items:
        return {"status": "success", "key": "warning_budget_stable"}

    sorted_items = sorted(
        items,
        key=lambda item: WARNING_PRIORITY.get(item.get("status", "success"), 0),
        reverse=True,
    )
    return sorted_items[0]


def budget_warning_payload(
    user_id: int,
    stipend_day: int,
    today: date | None = None,
    forecast: Decimal | None = None,
) -> dict:
    today = today or date.today()
    today_expense = _sum_for_range(user_id, "expense", today, today)
    today_limit = calculate_today_limit(user_id, stipend_day, today)
    resolved_forecast = forecast if forecast is not None else month_end_forecast(user_id, today)

    candidates: list[dict] = []

    if today_limit <= 0 and today_expense > 0:
        candidates.append({"status": "danger", "key": "warning_budget_depleted"})

    if today_limit > 0 and today_expense > today_limit:
        candidates.append({"status": "warning", "key": "warning_daily_limit_exceeded"})

    if resolved_forecast < 0:
        candidates.append({"status": "warning", "key": "warning_negative_forecast"})

    if today_limit > 0 and today_expense == 0:
        candidates.append({"status": "info", "key": "warning_no_expenses_today"})

    warning = _pick_warning(candidates)
    warning["meta"] = {
        "today_expense": float(today_expense),
        "today_limit": float(today_limit),
        "forecast": float(resolved_forecast),
    }
    return warning


def warning_legacy_text(key: str) -> str:
    return LEGACY_WARNING_TEXT.get(key, LEGACY_WARNING_TEXT["warning_budget_stable"])


def expense_warning_message(user_id: int, stipend_day: int, today: date | None = None) -> str | None:
    payload = budget_warning_payload(user_id, stipend_day, today=today)
    if payload["status"] == "success":
        return None
    return warning_legacy_text(payload["key"])


def _normalize_text(value: str | None) -> str:
    return (value or "").strip()


def _safe_percent_change(current: Decimal, previous: Decimal) -> float | None:
    if previous == 0:
        return None
    return float(((current - previous) / previous) * Decimal(100))


def _day_totals(user_id: int, tx_type: str, date_from: date, date_to: date, category: str | None = None) -> list[tuple[date, Decimal]]:
    query = (
        Transaction.query.with_entities(
            Transaction.tx_date,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        )
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == tx_type)
        .filter(Transaction.tx_date >= date_from)
        .filter(Transaction.tx_date <= date_to)
    )

    normalized_category = _normalize_text(category)
    if normalized_category:
        query = query.filter(func.lower(func.coalesce(Transaction.category, "")) == normalized_category.lower())

    rows = query.group_by(Transaction.tx_date).order_by(Transaction.tx_date.asc()).all()
    return [(tx_date, Decimal(total or 0)) for tx_date, total in rows]


def _period_bounds(period: str, today: date | None = None) -> tuple[date, date, date, date, str]:
    today = today or date.today()
    normalized = (period or "month").strip().lower()

    if normalized == "week":
        current_start = today - timedelta(days=6)
        current_end = today
        prior_end = current_start - timedelta(days=1)
        prior_start = prior_end - timedelta(days=6)
        return current_start, current_end, prior_start, prior_end, "week"

    if normalized == "quarter":
        quarter = (today.month - 1) // 3 + 1
        current_start_month = (quarter - 1) * 3 + 1
        current_start = date(today.year, current_start_month, 1)
        elapsed_days = (today - current_start).days

        if quarter == 1:
            prior_start = date(today.year - 1, 10, 1)
        else:
            prior_start = date(today.year, current_start_month - 3, 1)

        prior_quarter_end_month = prior_start.month + 2
        prior_quarter_end = date(prior_start.year, prior_quarter_end_month, monthrange(prior_start.year, prior_quarter_end_month)[1])
        prior_end = min(prior_start + timedelta(days=elapsed_days), prior_quarter_end)
        return current_start, today, prior_start, prior_end, "quarter"

    # month by default
    current_start = today.replace(day=1)
    elapsed_days = (today - current_start).days

    if today.month == 1:
        prior_year = today.year - 1
        prior_month = 12
    else:
        prior_year = today.year
        prior_month = today.month - 1

    prior_start = date(prior_year, prior_month, 1)
    prior_end_month_day = monthrange(prior_year, prior_month)[1]
    prior_end = min(prior_start + timedelta(days=elapsed_days), date(prior_year, prior_month, prior_end_month_day))
    return current_start, today, prior_start, prior_end, "month"


def income_breakdown(user_id: int, date_from: date, date_to: date) -> list[dict]:
    rows = (
        Transaction.query.with_entities(
            Transaction.source,
            func.coalesce(func.sum(Transaction.amount), 0).label("total"),
        )
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "income")
        .filter(Transaction.tx_date >= date_from)
        .filter(Transaction.tx_date <= date_to)
        .group_by(Transaction.source)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )

    return [
        {
            "source": source or "Не указан",
            "amount": float(total),
        }
        for source, total in rows
    ]


def spending_statistics(user_id: int, date_from: date, date_to: date) -> dict:
    days_count = max(1, (date_to - date_from).days + 1)
    total_income = _sum_for_range(user_id, "income", date_from, date_to)
    total_expense = _sum_for_range(user_id, "expense", date_from, date_to)

    tx_count = (
        Transaction.query.with_entities(func.count(Transaction.id))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_date >= date_from)
        .filter(Transaction.tx_date <= date_to)
        .scalar()
        or 0
    )

    expense_day_rows = _day_totals(user_id, "expense", date_from, date_to)
    max_daily_spend = max((amount for _, amount in expense_day_rows), default=Decimal(0))
    min_daily_spend = min((amount for _, amount in expense_day_rows), default=Decimal(0))

    return {
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "days_count": days_count,
        "transactions_count": int(tx_count),
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net": float(total_income - total_expense),
        "daily_avg_expense": float(total_expense / Decimal(days_count)),
        "daily_avg_income": float(total_income / Decimal(days_count)),
        "expense_per_transaction": float(total_expense / Decimal(max(1, tx_count))),
        "transactions_per_day": round(float(Decimal(tx_count) / Decimal(days_count)), 2),
        "max_daily_spend": float(max_daily_spend),
        "min_daily_spend": float(min_daily_spend),
    }


def period_comparison(user_id: int, period: str = "month", today: date | None = None) -> dict:
    current_start, current_end, prior_start, prior_end, normalized_period = _period_bounds(period, today=today)

    current_income = _sum_for_range(user_id, "income", current_start, current_end)
    current_expense = _sum_for_range(user_id, "expense", current_start, current_end)

    prior_income = _sum_for_range(user_id, "income", prior_start, prior_end)
    prior_expense = _sum_for_range(user_id, "expense", prior_start, prior_end)

    current_net = current_income - current_expense
    prior_net = prior_income - prior_expense

    return {
        "period": normalized_period,
        "current": {
            "date_from": current_start.isoformat(),
            "date_to": current_end.isoformat(),
            "income": float(current_income),
            "expense": float(current_expense),
            "net": float(current_net),
        },
        "prior": {
            "date_from": prior_start.isoformat(),
            "date_to": prior_end.isoformat(),
            "income": float(prior_income),
            "expense": float(prior_expense),
            "net": float(prior_net),
        },
        "change": {
            "income_pct": _safe_percent_change(current_income, prior_income),
            "expense_pct": _safe_percent_change(current_expense, prior_expense),
            "net_pct": _safe_percent_change(current_net, prior_net),
            "income_abs": float(current_income - prior_income),
            "expense_abs": float(current_expense - prior_expense),
            "net_abs": float(current_net - prior_net),
        },
    }


def category_timeline(user_id: int, category: str, date_from: date, date_to: date) -> list[dict]:
    normalized = _normalize_text(category)
    if not normalized:
        return []

    day_rows = _day_totals(user_id, "expense", date_from, date_to, category=normalized)
    day_map = {tx_date: amount for tx_date, amount in day_rows}

    cursor = date_from
    items = []
    while cursor <= date_to:
        items.append(
            {
                "date": cursor.isoformat(),
                "amount": float(day_map.get(cursor, Decimal(0))),
                "category": normalized,
            }
        )
        cursor += timedelta(days=1)
    return items


def detect_anomalies(user_id: int, lookback_days: int = 90, today: date | None = None) -> list[dict]:
    today = today or date.today()
    safe_lookback = max(7, lookback_days)
    date_from = today - timedelta(days=safe_lookback - 1)
    expense_rows = _day_totals(user_id, "expense", date_from, today)

    if not expense_rows:
        return []

    values = [float(amount) for _, amount in expense_rows]
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / len(values)
    std_dev = sqrt(variance)

    if std_dev == 0:
        return []

    threshold = mean + 2 * std_dev
    anomalies = []

    for tx_date, amount in expense_rows:
        current_value = float(amount)
        if current_value <= threshold:
            continue

        z_score = (current_value - mean) / std_dev
        anomalies.append(
            {
                "date": tx_date.isoformat(),
                "amount": current_value,
                "z_score": round(z_score, 2),
                "threshold": round(threshold, 2),
                "reason": "daily_expense_above_2sigma",
            }
        )

    anomalies.sort(key=lambda item: item["amount"], reverse=True)
    return anomalies
