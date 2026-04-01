from datetime import datetime, timezone
from werkzeug.security import check_password_hash, generate_password_hash
from app.extensions import db


class User(db.Model):
    """User model for EGE preparation app."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    stipend_day = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    stats = db.relationship("UserStat", back_populates="user", cascade="all, delete-orphan")
    answers = db.relationship("UserAnswer", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
        }


class Subject(db.Model):
    """Subject model (e.g., 'Русский язык', 'Математика', 'Информатика')."""
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True, index=True)
    description = db.Column(db.String(500), nullable=True)

    # Relationships
    themes = db.relationship("Theme", back_populates="subject", cascade="all, delete-orphan")
    questions = db.relationship("Question", back_populates="subject", cascade="all, delete-orphan")
    stats = db.relationship("UserStat", back_populates="subject", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
        }


class Theme(db.Model):
    """Theme model for a subject (e.g., 'Орфография' for русский язык)."""
    __tablename__ = "themes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False, index=True)
    section_name = db.Column(db.String(255), nullable=True)  # e.g., "Орфография"

    # Relationships
    subject = db.relationship("Subject", back_populates="themes")
    questions = db.relationship("Question", back_populates="theme", cascade="all, delete-orphan")
    stats = db.relationship("UserStat", back_populates="theme", cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "subject_id": self.subject_id,
            "section_name": self.section_name,
        }


class Question(db.Model):
    """Question model for EGE practice."""
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False, index=True)
    theme_id = db.Column(db.Integer, db.ForeignKey("themes.id"), nullable=True, index=True)
    question_type = db.Column(db.String(50), nullable=False)  # 'choice', 'number', 'text', 'multiple'
    options = db.Column(db.JSON, nullable=True)  # For 'choice' type: ["A) вариант1", "B) вариант2", ...]
    answer = db.Column(db.String(500), nullable=False)  # Correct answer
    explanation = db.Column(db.Text, nullable=True)  # Explanation for correct answer
    difficulty = db.Column(db.Integer, nullable=True)  # 1-5 scale
    source = db.Column(db.String(50), nullable=False, default="neofamily")  # 'neofamily', 'internal'
    external_id = db.Column(db.String(100), nullable=True)  # ID from external API
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    subject = db.relationship("Subject", back_populates="questions")
    theme = db.relationship("Theme", back_populates="questions")
    user_answers = db.relationship("UserAnswer", back_populates="question", cascade="all, delete-orphan")

    __table_args__ = (
        db.Index("idx_subject_theme", "subject_id", "theme_id"),
    )

    def to_dict(self, include_answer: bool = False) -> dict:
        result = {
            "id": self.id,
            "text": self.text,
            "subject_id": self.subject_id,
            "theme_id": self.theme_id,
            "type": self.question_type,
            "options": self.options,
            "difficulty": self.difficulty,
        }
        if include_answer:
            result["answer"] = self.answer
            result["explanation"] = self.explanation
        return result


class UserStat(db.Model):
    """User statistics per subject and theme."""
    __tablename__ = "user_stats"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False, index=True)
    theme_id = db.Column(db.Integer, db.ForeignKey("themes.id"), nullable=True, index=True)
    total_answers = db.Column(db.Integer, nullable=False, default=0)
    correct_answers = db.Column(db.Integer, nullable=False, default=0)
    last_updated = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship("User", back_populates="stats")
    subject = db.relationship("Subject", back_populates="stats")
    theme = db.relationship("Theme", back_populates="stats")

    __table_args__ = (
        db.UniqueConstraint("user_id", "subject_id", "theme_id", name="uq_user_subject_theme"),
    )

    def get_progress(self) -> float:
        """Get progress as percentage."""
        if self.total_answers == 0:
            return 0.0
        return (self.correct_answers / self.total_answers) * 100

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "subject_id": self.subject_id,
            "theme_id": self.theme_id,
            "total_answers": self.total_answers,
            "correct_answers": self.correct_answers,
            "progress": self.get_progress(),
            "last_updated": self.last_updated.isoformat(),
        }


class UserAnswer(db.Model):
    """User's answer to a question."""
    __tablename__ = "user_answers"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False, index=True)
    user_answer = db.Column(db.String(500), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    time_spent = db.Column(db.Integer, nullable=True)  # in seconds
    answered_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = db.relationship("User", back_populates="answers")
    question = db.relationship("Question", back_populates="user_answers")

    __table_args__ = (
        db.Index("idx_user_answered", "user_id", "answered_at"),
        db.Index("idx_question_answered", "question_id", "answered_at"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "user_answer": self.user_answer,
            "is_correct": self.is_correct,
            "time_spent": self.time_spent,
            "answered_at": self.answered_at.isoformat(),
        }
