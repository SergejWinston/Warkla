from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.models import User
from app.services.achievements import achievements_with_progress, evaluate_achievements_for_user


achievements_bp = Blueprint("achievements", __name__, url_prefix="/api/achievements")


def _current_user() -> User | None:
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


@achievements_bp.get("")
@jwt_required()
def list_achievements():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    evaluate_achievements_for_user(user.id)

    return jsonify({"items": achievements_with_progress(user.id)})
