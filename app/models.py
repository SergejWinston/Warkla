from datetime import datetime, timezone
from decimal import Decimal

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    stipend_day = db.Column(db.Integer, nullable=False, default=25)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    transactions = db.relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    unlocked_achievements = db.relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    profile = db.relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class Transaction(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    tx_type = db.Column(db.String(20), nullable=False, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="RUB")
    category = db.Column(db.String(64), nullable=True, index=True)
    is_discount = db.Column(db.Boolean, nullable=False, default=False)
    source = db.Column(db.String(128), nullable=True)
    note = db.Column(db.String(255), nullable=True)
    tx_date = db.Column(db.Date, nullable=False, index=True)
    receipt_path = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="transactions")

    __table_args__ = (
        db.CheckConstraint("tx_type IN ('income', 'expense')", name="check_tx_type"),
        db.CheckConstraint("amount > 0", name="check_amount_positive"),
    )

    def as_dict(self) -> dict:
        amount_value = float(self.amount) if isinstance(self.amount, Decimal) else self.amount
        return {
            "id": self.id,
            "type": self.tx_type,
            "amount": amount_value,
            "currency": self.currency,
            "category": self.category,
            "is_discount": bool(self.is_discount),
            "source": self.source,
            "note": self.note,
            "date": self.tx_date.isoformat(),
            "receipt_path": self.receipt_path,
            "created_at": self.created_at.isoformat(),
        }


class Achievement(db.Model):
    __tablename__ = "achievements"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False)
    title = db.Column(db.String(128), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    metric = db.Column(db.String(64), nullable=False)
    threshold = db.Column(db.Integer, nullable=False)

    users = db.relationship("UserAchievement", back_populates="achievement", cascade="all, delete-orphan")


class UserAchievement(db.Model):
    __tablename__ = "user_achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievements.id"), nullable=False, index=True)
    unlocked_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="unlocked_achievements")
    achievement = db.relationship("Achievement", back_populates="users")

    __table_args__ = (
        db.UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )


class UserProfile(db.Model):
    __tablename__ = "user_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True, index=True)
    avatar_path = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="profile")
