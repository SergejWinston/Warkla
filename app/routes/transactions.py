from __future__ import annotations

import uuid
from datetime import datetime
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Transaction, User
from app.services.achievements import evaluate_achievements_for_user
from app.services.analytics import budget_warning_payload, warning_legacy_text


transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _current_user() -> User | None:
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def _parse_date(raw: str | None):
    if not raw:
        return None
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        return None


@transactions_bp.post("")
@jwt_required()
def create_transaction():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}

    tx_type = (data.get("type") or "").strip().lower()
    amount = data.get("amount")
    category = (data.get("category") or "").strip() or None
    source = (data.get("source") or "").strip() or None
    note = (data.get("note") or "").strip() or None
    tx_date = _parse_date(data.get("date"))

    if tx_type not in {"income", "expense"}:
        return jsonify({"error": "type must be income or expense"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be a positive number"}), 400

    if tx_type == "expense" and not category:
        return jsonify({"error": "category is required for expense"}), 400

    if tx_type == "income" and not source:
        source = "Не указан"

    transaction = Transaction(
        user_id=user.id,
        tx_type=tx_type,
        amount=amount,
        category=category,
        source=source,
        note=note,
        tx_date=tx_date or datetime.utcnow().date(),
    )
    db.session.add(transaction)
    db.session.commit()

    unlocked = evaluate_achievements_for_user(user.id)
    warning_payload = budget_warning_payload(user.id, user.stipend_day)

    return (
        jsonify(
            {
                "transaction": transaction.as_dict(),
                "new_achievements": [a.title for a in unlocked],
                "warning": warning_legacy_text(warning_payload["key"]),
                "warning_status": warning_payload["status"],
                "warning_key": warning_payload["key"],
                "warning_meta": warning_payload["meta"],
            }
        ),
        201,
    )


@transactions_bp.get("")
@jwt_required()
def list_transactions():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)

    date_from = _parse_date(request.args.get("date_from"))
    date_to = _parse_date(request.args.get("date_to"))
    category = request.args.get("category")
    tx_type = request.args.get("type")

    query = Transaction.query.filter_by(user_id=user.id)

    if date_from:
        query = query.filter(Transaction.tx_date >= date_from)
    if date_to:
        query = query.filter(Transaction.tx_date <= date_to)
    if category:
        query = query.filter(Transaction.category == category)
    if tx_type in {"income", "expense"}:
        query = query.filter(Transaction.tx_type == tx_type)

    pagination = query.order_by(Transaction.tx_date.desc(), Transaction.id.desc()).paginate(
        page=page,
        per_page=per_page,
        error_out=False,
    )

    return jsonify(
        {
            "items": [item.as_dict() for item in pagination.items],
            "page": pagination.page,
            "pages": pagination.pages,
            "total": pagination.total,
        }
    )


@transactions_bp.get("/<int:transaction_id>")
@jwt_required()
def get_transaction(transaction_id: int):
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    tx = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    if not tx:
        return jsonify({"error": "Transaction not found"}), 404

    details = tx.as_dict()
    details["receipt_attached"] = bool(tx.receipt_path)

    return jsonify(details)


@transactions_bp.delete("/<int:transaction_id>")
@jwt_required()
def delete_transaction(transaction_id: int):
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    tx = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    if not tx:
        return jsonify({"error": "Transaction not found"}), 404

    if tx.receipt_path:
        path = Path(current_app.config["UPLOAD_FOLDER"]) / tx.receipt_path
        if path.exists() and path.is_file():
            path.unlink()

    db.session.delete(tx)
    db.session.commit()

    return jsonify({"message": "Transaction deleted"})


@transactions_bp.post("/<int:transaction_id>/receipt")
@jwt_required()
def upload_receipt(transaction_id: int):
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    tx = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    if not tx:
        return jsonify({"error": "Transaction not found"}), 404

    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"error": "file is required"}), 400

    safe_name = secure_filename(file.filename)
    extension = Path(safe_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Only jpg, jpeg, png, webp files are allowed"}), 400

    user_dir = Path(current_app.config["UPLOAD_FOLDER"]) / f"user_{user.id}"
    user_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{extension}"
    target = user_dir / stored_name
    file.save(target)

    tx.receipt_path = str(Path(f"user_{user.id}") / stored_name)
    db.session.commit()

    return jsonify({"message": "Receipt uploaded", "receipt_path": tx.receipt_path})


@transactions_bp.get("/<int:transaction_id>/receipt")
@jwt_required()
def get_receipt(transaction_id: int):
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    tx = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    if not tx or not tx.receipt_path:
        return jsonify({"error": "Receipt not found"}), 404

    path = Path(current_app.config["UPLOAD_FOLDER"]) / tx.receipt_path
    if not path.exists() or not path.is_file():
        return jsonify({"error": "Receipt not found"}), 404

    return send_file(path)
