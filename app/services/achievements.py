from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import Achievement, Transaction, User, UserAchievement


DEFAULT_ACHIEVEMENTS = [
    {
        "key": "operations_1",
        "title": "Первый шаг",
        "description": "Добавь первую операцию.",
        "metric": "transactions_count",
        "threshold": 1,
    },
    {
        "key": "operations_5",
        "title": "Разгон",
        "description": "Сделай 5 операций.",
        "metric": "transactions_count",
        "threshold": 5,
    },
    {
        "key": "operations_10",
        "title": "Начало пути",
        "description": "Сделал 10 операций и взял финансы под контроль.",
        "metric": "transactions_count",
        "threshold": 10,
    },
    {
        "key": "operations_50",
        "title": "Финансовый ритм",
        "description": "Сделал 50 операций. Учет денег стал привычкой.",
        "metric": "transactions_count",
        "threshold": 50,
    },
    {
        "key": "operations_100",
        "title": "Мастер учета",
        "description": "Сделай 100 операций. Ты уже профи.",
        "metric": "transactions_count",
        "threshold": 100,
    },
    {
        "key": "active_days_3",
        "title": "Три дня в ритме",
        "description": "Веди учет минимум 3 разных дня.",
        "metric": "active_days_count",
        "threshold": 3,
    },
    {
        "key": "active_days_7",
        "title": "Неделя дисциплины",
        "description": "Вел учет расходов минимум 7 разных дней.",
        "metric": "active_days_count",
        "threshold": 7,
    },
    {
        "key": "active_days_30",
        "title": "Месяц контроля",
        "description": "Будь активен в учете 30 разных дней.",
        "metric": "active_days_count",
        "threshold": 30,
    },
    {
        "key": "expense_operations_10",
        "title": "Расходы под микроскопом",
        "description": "Сделай 10 расходных операций.",
        "metric": "expenses_count",
        "threshold": 10,
    },
    {
        "key": "income_operations_5",
        "title": "Доходный поток",
        "description": "Добавь 5 доходных операций.",
        "metric": "incomes_count",
        "threshold": 5,
    },
    {
        "key": "categories_5",
        "title": "Баланс категорий",
        "description": "Используй 5 разных категорий расходов.",
        "metric": "categories_count",
        "threshold": 5,
    },
    {
        "key": "total_expense_500",
        "title": "Крупные траты",
        "description": "Накопи 500 суммарных расходов.",
        "metric": "total_expense_amount",
        "threshold": 500,
    },
    {
        "key": "single_expense_100",
        "title": "Серьезная покупка",
        "description": "Сделай одну расходную операцию на 100 или больше.",
        "metric": "max_single_expense",
        "threshold": 100,
    },
    {
        "key": "thrifty_7_days",
        "title": "Экономный",
        "description": "Проведи 7 дней подряд без превышения дневного лимита.",
        "metric": "streak_no_limit_exceed_days",
        "threshold": 7,
    },
    {
        "key": "survived_to_stipend",
        "title": "Дожил до стипендии",
        "description": "В день стипендии сохрани баланс не ниже нуля.",
        "metric": "stipend_day_non_negative_balance_count",
        "threshold": 1,
    },
    {
        "key": "discount_master_10",
        "title": "Мастер скидок",
        "description": "Сделай 10 расходных покупок со скидкой.",
        "metric": "discount_expenses_count",
        "threshold": 10,
    },
]


def seed_achievements() -> None:
    for item in DEFAULT_ACHIEVEMENTS:
        try:
            with db.session.begin_nested():
                db.session.add(Achievement(**item))
                db.session.flush()
        except IntegrityError:
            # Skip duplicates if another process/session inserted the same key.
            continue
    db.session.commit()


def _transactions_count(user_id: int) -> int:
    return (
        db.session.query(func.count(Transaction.id))
        .filter(Transaction.user_id == user_id)
        .scalar()
        or 0
    )


def _active_days_count(user_id: int) -> int:
    return (
        db.session.query(func.count(func.distinct(Transaction.tx_date)))
        .filter(Transaction.user_id == user_id)
        .scalar()
        or 0
    )


def _expenses_count(user_id: int) -> int:
    return (
        db.session.query(func.count(Transaction.id))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .scalar()
        or 0
    )


def _incomes_count(user_id: int) -> int:
    return (
        db.session.query(func.count(Transaction.id))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "income")
        .scalar()
        or 0
    )


def _categories_count(user_id: int) -> int:
    return (
        db.session.query(func.count(func.distinct(Transaction.category)))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .filter(Transaction.category.isnot(None))
        .scalar()
        or 0
    )


def _total_expense_amount(user_id: int) -> float:
    value = (
        db.session.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .scalar()
    )
    return float(value or 0)


def _max_single_expense(user_id: int) -> float:
    value = (
        db.session.query(func.coalesce(func.max(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .scalar()
    )
    return float(value or 0)


def _discount_expenses_count(user_id: int) -> int:
    return (
        db.session.query(func.count(Transaction.id))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .filter(Transaction.is_discount.is_(True))
        .scalar()
        or 0
    )


def _historical_balance_map(user_id: int) -> dict[date, float]:
    income_rows = (
        db.session.query(Transaction.tx_date, func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "income")
        .group_by(Transaction.tx_date)
        .order_by(Transaction.tx_date.asc())
        .all()
    )
    expense_rows = (
        db.session.query(Transaction.tx_date, func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .group_by(Transaction.tx_date)
        .order_by(Transaction.tx_date.asc())
        .all()
    )

    income_map = {tx_date: float(total or 0) for tx_date, total in income_rows}
    expense_map = {tx_date: float(total or 0) for tx_date, total in expense_rows}

    all_dates = sorted(set(income_map.keys()) | set(expense_map.keys()))
    running_balance = 0.0
    balance_map: dict[date, float] = {}
    for tx_date in all_dates:
        running_balance += income_map.get(tx_date, 0.0)
        running_balance -= expense_map.get(tx_date, 0.0)
        balance_map[tx_date] = running_balance

    return balance_map


def _days_to_stipend(stipend_day: int, on_date: date) -> int:
    clamped_day = min(max(1, stipend_day), monthrange(on_date.year, on_date.month)[1])
    target = date(on_date.year, on_date.month, clamped_day)
    if target >= on_date:
        return (target - on_date).days

    next_month = on_date.month + 1
    next_year = on_date.year
    if next_month == 13:
        next_month = 1
        next_year += 1

    next_clamped_day = min(max(1, stipend_day), monthrange(next_year, next_month)[1])
    next_target = date(next_year, next_month, next_clamped_day)
    return (next_target - on_date).days


def _streak_no_limit_exceed_days(user_id: int) -> int:
    user = User.query.get(user_id)
    if not user:
        return 0

    expense_rows = (
        db.session.query(Transaction.tx_date, func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .group_by(Transaction.tx_date)
        .order_by(Transaction.tx_date.asc())
        .all()
    )
    if not expense_rows:
        return 0

    balance_map = _historical_balance_map(user_id)
    expense_map = {tx_date: float(total or 0) for tx_date, total in expense_rows}
    expense_dates = sorted(expense_map.keys())

    best_streak = 0
    current_streak = 0
    prev_date: date | None = None

    for tx_date in expense_dates:
        if prev_date is None or (tx_date - prev_date) != timedelta(days=1):
            current_streak = 0

        balance_at_day = balance_map.get(tx_date, 0.0)
        days_left = max(1, _days_to_stipend(user.stipend_day, tx_date))
        today_limit = balance_at_day / float(days_left)
        today_expense = expense_map.get(tx_date, 0.0)

        if today_limit > 0 and today_expense <= today_limit:
            current_streak += 1
            best_streak = max(best_streak, current_streak)
        else:
            current_streak = 0

        prev_date = tx_date

    return best_streak


def _stipend_day_non_negative_balance_count(user_id: int) -> int:
    user = User.query.get(user_id)
    if not user:
        return 0

    today = date.today()
    stipend_date_day = min(max(1, user.stipend_day), monthrange(today.year, today.month)[1])
    if today.day != stipend_date_day:
        return 0

    total_income = (
        db.session.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "income")
        .scalar()
    )
    total_expense = (
        db.session.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .filter(Transaction.tx_type == "expense")
        .scalar()
    )

    balance = float(total_income or 0) - float(total_expense or 0)
    return 1 if balance >= 0 else 0


def _metric_values(user_id: int) -> dict[str, float]:
    return {
        "transactions_count": float(_transactions_count(user_id)),
        "active_days_count": float(_active_days_count(user_id)),
        "expenses_count": float(_expenses_count(user_id)),
        "incomes_count": float(_incomes_count(user_id)),
        "categories_count": float(_categories_count(user_id)),
        "total_expense_amount": _total_expense_amount(user_id),
        "max_single_expense": _max_single_expense(user_id),
        "discount_expenses_count": float(_discount_expenses_count(user_id)),
        "streak_no_limit_exceed_days": float(_streak_no_limit_exceed_days(user_id)),
        "stipend_day_non_negative_balance_count": float(_stipend_day_non_negative_balance_count(user_id)),
    }


def evaluate_achievements_for_user(user_id: int) -> list[Achievement]:
    unlocked = []

    values = _metric_values(user_id)

    existing = {
        row.achievement_id
        for row in UserAchievement.query.filter_by(user_id=user_id).all()
    }

    for achievement in Achievement.query.all():
        if achievement.id in existing:
            continue

        metric_value = values.get(achievement.metric, 0)

        if metric_value >= achievement.threshold:
            link = UserAchievement(user_id=user_id, achievement_id=achievement.id)
            db.session.add(link)
            unlocked.append(achievement)

    if unlocked:
        db.session.commit()

    return unlocked


def achievements_with_progress(user_id: int) -> list[dict]:
    values = _metric_values(user_id)

    unlocked_rows = UserAchievement.query.filter_by(user_id=user_id).all()
    unlocked_map = {row.achievement_id: row for row in unlocked_rows}

    items = []
    for achievement in Achievement.query.order_by(Achievement.id.asc()).all():
        current = values.get(achievement.metric, 0)
        threshold = float(achievement.threshold)
        progress_percent = 0 if threshold <= 0 else min(100, int((current / threshold) * 100))
        link = unlocked_map.get(achievement.id)

        display_current = int(current) if float(current).is_integer() else round(current, 2)
        display_threshold = int(threshold) if float(threshold).is_integer() else round(threshold, 2)

        items.append(
            {
                "key": achievement.key,
                "title": achievement.title,
                "description": achievement.description,
                "metric": achievement.metric,
                "threshold": display_threshold,
                "progress_value": display_current,
                "progress_percent": progress_percent,
                "unlocked": bool(link),
                "unlocked_at": link.unlocked_at.isoformat() if link else None,
            }
        )

    return items
