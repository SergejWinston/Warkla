from __future__ import annotations

import base64
import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import User, UserProfile


profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
SUPPORTED_CURRENCIES = {"RUB", "USD"}


def _current_user() -> User | None:
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def _get_or_create_profile(user_id: int) -> UserProfile:
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if profile:
        return profile

    profile = UserProfile(user_id=user_id)
    db.session.add(profile)
    db.session.commit()
    return profile


def _normalize_currency(raw: str | None) -> str | None:
    normalized = (raw or "").strip().upper()
    if not normalized:
        return None
    return normalized


def _avatar_data_url(avatar_path: str | None) -> str | None:
    if not avatar_path:
        return None

    full_path = Path(current_app.config["UPLOAD_FOLDER"]) / avatar_path
    if not full_path.exists() or not full_path.is_file():
        return None

    mime_type = mimetypes.guess_type(full_path.name)[0] or "image/png"
    with full_path.open("rb") as fp:
        encoded = base64.b64encode(fp.read()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


@profile_bp.get("")
@jwt_required()
def get_profile():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = _get_or_create_profile(user.id)
    return jsonify(
        {
            "username": user.username,
            "email": user.email,
            "stipend_day": user.stipend_day,
            "preferred_currency": profile.preferred_currency or "RUB",
            "avatar_data_url": _avatar_data_url(profile.avatar_path),
        }
    )


@profile_bp.patch("")
@jwt_required()
def update_profile():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}

    username = data.get("username")
    stipend_day = data.get("stipend_day")
    preferred_currency = _normalize_currency(data.get("preferred_currency")) if "preferred_currency" in data else None

    if isinstance(username, str):
        username = username.strip()
        if not username:
            return jsonify({"error": "username cannot be empty"}), 400
        exists = User.query.filter(User.username == username, User.id != user.id).first()
        if exists:
            return jsonify({"error": "Username is already taken"}), 409
        user.username = username

    if stipend_day is not None:
        try:
            stipend_day_int = int(stipend_day)
        except (TypeError, ValueError):
            return jsonify({"error": "stipend_day must be an integer from 1 to 31"}), 400
        if stipend_day_int < 1 or stipend_day_int > 31:
            return jsonify({"error": "stipend_day must be an integer from 1 to 31"}), 400
        user.stipend_day = stipend_day_int

    profile = _get_or_create_profile(user.id)

    if preferred_currency is not None:
        if preferred_currency not in SUPPORTED_CURRENCIES:
            return jsonify({"error": "preferred_currency must be one of: RUB, USD"}), 400
        profile.preferred_currency = preferred_currency

    profile.updated_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify(
        {
            "message": "Profile updated",
            "profile": {
                "username": user.username,
                "email": user.email,
                "stipend_day": user.stipend_day,
                "preferred_currency": profile.preferred_currency or "RUB",
                "avatar_data_url": _avatar_data_url(profile.avatar_path),
            },
        }
    )


@profile_bp.post("/avatar")
@jwt_required()
def upload_avatar():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error": "file is required"}), 400

    safe_name = secure_filename(file.filename)
    extension = Path(safe_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Only jpg, jpeg, png, webp files are allowed"}), 400

    profile = _get_or_create_profile(user.id)

    avatar_dir = Path(current_app.config["UPLOAD_FOLDER"]) / "avatars" / f"user_{user.id}"
    avatar_dir.mkdir(parents=True, exist_ok=True)

    if profile.avatar_path:
        old_path = Path(current_app.config["UPLOAD_FOLDER"]) / profile.avatar_path
        if old_path.exists() and old_path.is_file():
            old_path.unlink()

    stored_name = f"{uuid.uuid4().hex}{extension}"
    target = avatar_dir / stored_name
    file.save(target)

    profile.avatar_path = str(Path("avatars") / f"user_{user.id}" / stored_name)
    profile.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify(
        {
            "message": "Avatar uploaded",
            "avatar_data_url": _avatar_data_url(profile.avatar_path),
        }
    )
