from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime
from pathlib import Path

from flask import Blueprint, Response, current_app, jsonify, request, send_file
from flask_jwt_extended import decode_token, get_jwt_identity, jwt_required
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models import Transaction, User
from app.services.achievements import evaluate_achievements_for_user
from app.services.analytics import budget_warning_payload, warning_legacy_text


transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIMES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
CATEGORY_ALIASES = {
    "food": "food",
    "еда": "food",
    "transport": "transport",
    "транспорт": "transport",
    "entertainment": "entertainment",
    "развлечения": "entertainment",
    "study": "study",
    "учеба": "study",
    "учёба": "study",
    "communication": "communication",
    "связь": "communication",
    "health": "health",
    "здоровье": "health",
    "housing": "housing",
    "жилье": "housing",
    "жильё": "housing",
    "other": "other",
    "прочее": "other",
}
CANONICAL_EXPENSE_CATEGORIES = {
    "food",
    "transport",
    "entertainment",
    "study",
    "communication",
    "health",
    "housing",
    "other",
}
SUPPORTED_CURRENCIES = {"RUB", "USD"}
SUPPORTED_EXPORT_FORMATS = {"csv", "pdf"}


def _current_user() -> User | None:
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return None
    return User.query.get(user_id)


def _current_user_from_query_token() -> User | None:
    raw_token = (request.args.get("access_token") or "").strip()
    if not raw_token:
        return None

    try:
        payload = decode_token(raw_token)
        user_id = int(payload.get("sub"))
    except Exception:
        return None

    return User.query.get(user_id)


def _parse_date(raw: str | None):
    if not raw:
        return None
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        return None


def _normalize_category(raw: str | None) -> str | None:
    normalized = (raw or "").strip().lower()
    if not normalized:
        return None
    return CATEGORY_ALIASES.get(normalized)


def _resolve_image_extension(file, safe_name: str) -> str | None:
    extension = Path(safe_name).suffix.lower()
    if extension in ALLOWED_EXTENSIONS:
        return extension

    mime = (file.mimetype or "").strip().lower()
    return ALLOWED_MIMES.get(mime)


def _filtered_transactions_query(user_id: int):
    date_from = _parse_date(request.args.get("date_from"))
    date_to = _parse_date(request.args.get("date_to"))
    category = request.args.get("category")
    tx_type = request.args.get("type")

    query = Transaction.query.filter_by(user_id=user_id)

    if date_from:
        query = query.filter(Transaction.tx_date >= date_from)
    if date_to:
        query = query.filter(Transaction.tx_date <= date_to)
    if category:
        normalized_category = _normalize_category(category)
        query = query.filter(Transaction.category == (normalized_category or category))
    if tx_type in {"income", "expense"}:
        query = query.filter(Transaction.tx_type == tx_type)

    return query.order_by(Transaction.tx_date.desc(), Transaction.id.desc())


def _build_export_filename(export_format: str) -> str:
    stamp = datetime.utcnow().strftime("%Y%m%d")
    return f"transactions_report_{stamp}.{export_format}"


def _build_csv_export_bytes(items: list[Transaction]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "type", "amount", "currency", "category", "source", "note", "date"])
    for tx in items:
        writer.writerow([
            tx.id,
            tx.tx_type,
            float(tx.amount),
            tx.currency,
            tx.category or "",
            tx.source or "",
            tx.note or "",
            tx.tx_date.isoformat(),
        ])

    # BOM improves compatibility with spreadsheet apps for Cyrillic text.
    return ("\ufeff" + buffer.getvalue()).encode("utf-8")


def _build_pdf_export_bytes(items: list[Transaction], period_from: str, period_to: str) -> bytes:
    output = io.BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4)
    width, height = A4

    y = height - 40
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, y, "Transactions Report")
    y -= 20

    pdf.setFont("Helvetica", 9)
    pdf.drawString(40, y, f"Period: {period_from} .. {period_to}")
    y -= 14
    pdf.drawString(40, y, f"Records: {len(items)}")
    y -= 18

    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(40, y, "Date")
    pdf.drawString(105, y, "Type")
    pdf.drawString(150, y, "Amount")
    pdf.drawString(210, y, "Currency")
    pdf.drawString(270, y, "Category")
    pdf.drawString(350, y, "Source")
    pdf.drawString(430, y, "Note")
    y -= 12

    pdf.setFont("Helvetica", 8)
    for tx in items:
        if y < 40:
            pdf.showPage()
            y = height - 40
            pdf.setFont("Helvetica", 8)

        note = (tx.note or "")[:42]
        source = (tx.source or "")[:18]
        category = (tx.category or "")[:14]

        pdf.drawString(40, y, tx.tx_date.isoformat())
        pdf.drawString(105, y, tx.tx_type)
        pdf.drawRightString(205, y, f"{float(tx.amount):.2f}")
        pdf.drawString(210, y, tx.currency or "RUB")
        pdf.drawString(270, y, category)
        pdf.drawString(350, y, source)
        pdf.drawString(430, y, note)
        y -= 12

    pdf.save()
    return output.getvalue()


def _export_response(export_format: str, items: list[Transaction]) -> Response:
    period_from = request.args.get("date_from") or "-"
    period_to = request.args.get("date_to") or "-"

    if export_format == "pdf":
        payload = _build_pdf_export_bytes(items, period_from, period_to)
        mimetype = "application/pdf"
    else:
        payload = _build_csv_export_bytes(items)
        mimetype = "text/csv; charset=utf-8"

    response = Response(payload, mimetype=mimetype)
    response.headers["Content-Disposition"] = f'attachment; filename="{_build_export_filename(export_format)}"'
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    return response


@transactions_bp.post("")
@jwt_required()
def create_transaction():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}

    tx_type = (data.get("type") or "").strip().lower()
    amount = data.get("amount")
    currency = (data.get("currency") or "RUB").strip().upper()
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

    if currency not in SUPPORTED_CURRENCIES:
        return jsonify({"error": "currency must be one of: RUB, USD"}), 400

    if tx_type == "expense" and not category:
        return jsonify({"error": "category is required for expense"}), 400

    if tx_type == "expense":
        normalized_category = _normalize_category(category)
        if normalized_category not in CANONICAL_EXPENSE_CATEGORIES:
            return jsonify({"error": "category must be one of: food, transport, entertainment, study, communication, health, housing, other"}), 400
        category = normalized_category

    if tx_type == "income" and not source:
        source = "Не указан"

    transaction = Transaction(
        user_id=user.id,
        tx_type=tx_type,
        amount=amount,
        currency=currency,
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

    query = _filtered_transactions_query(user.id)

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


@transactions_bp.get("/export")
@jwt_required()
def export_transactions():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    export_format = (request.args.get("format") or "csv").strip().lower()
    if export_format not in SUPPORTED_EXPORT_FORMATS:
        return jsonify({"error": "format must be one of: csv, pdf"}), 400

    items = _filtered_transactions_query(user.id).all()
    return _export_response(export_format, items)


@transactions_bp.get("/export.csv")
@jwt_required()
def export_transactions_csv_legacy():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    items = _filtered_transactions_query(user.id).all()
    return _export_response("csv", items)


@transactions_bp.get("/export.pdf")
@jwt_required()
def export_transactions_pdf_legacy():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    items = _filtered_transactions_query(user.id).all()
    return _export_response("pdf", items)


@transactions_bp.get("/export/download")
def export_transactions_download():
    # Supports environments where blob-based downloads are blocked.
    user = _current_user_from_query_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    export_format = (request.args.get("format") or "csv").strip().lower()
    if export_format not in SUPPORTED_EXPORT_FORMATS:
        return jsonify({"error": "format must be one of: csv, pdf"}), 400

    items = _filtered_transactions_query(user.id).all()
    return _export_response(export_format, items)


@transactions_bp.patch("/<int:transaction_id>")
@jwt_required()
def update_transaction(transaction_id: int):
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    tx = Transaction.query.filter_by(id=transaction_id, user_id=user.id).first()
    if not tx:
        return jsonify({"error": "Transaction not found"}), 404

    data = request.get_json(silent=True) or {}

    tx_type = tx.tx_type
    if "type" in data:
        candidate_type = (data.get("type") or "").strip().lower()
        if candidate_type not in {"income", "expense"}:
            return jsonify({"error": "type must be income or expense"}), 400
        tx_type = candidate_type

    currency = tx.currency
    if "currency" in data:
        candidate_currency = (data.get("currency") or "").strip().upper()
        if candidate_currency not in SUPPORTED_CURRENCIES:
            return jsonify({"error": "currency must be one of: RUB, USD"}), 400
        currency = candidate_currency

    amount = tx.amount
    if "amount" in data:
        try:
            amount = float(data.get("amount"))
            if amount <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return jsonify({"error": "amount must be a positive number"}), 400

    tx_date = tx.tx_date
    if "date" in data:
        parsed = _parse_date(data.get("date"))
        if not parsed:
            return jsonify({"error": "date must be in format YYYY-MM-DD"}), 400
        tx_date = parsed

    source = tx.source
    if "source" in data:
        source = (data.get("source") or "").strip() or None

    note = tx.note
    if "note" in data:
        note = (data.get("note") or "").strip() or None

    category = tx.category
    if "category" in data:
        category = (data.get("category") or "").strip() or None

    if tx_type == "expense":
        normalized_category = _normalize_category(category)
        if normalized_category not in CANONICAL_EXPENSE_CATEGORIES:
            return jsonify({"error": "category must be one of: food, transport, entertainment, study, communication, health, housing, other"}), 400
        category = normalized_category
    else:
        category = None
        if not source:
            source = "Не указан"

    tx.tx_type = tx_type
    tx.amount = amount
    tx.currency = currency
    tx.category = category
    tx.source = source
    tx.note = note
    tx.tx_date = tx_date

    db.session.commit()

    unlocked = evaluate_achievements_for_user(user.id)
    warning_payload = budget_warning_payload(user.id, user.stipend_day)

    return jsonify(
        {
            "transaction": tx.as_dict(),
            "new_achievements": [a.title for a in unlocked],
            "warning": warning_legacy_text(warning_payload["key"]),
            "warning_status": warning_payload["status"],
            "warning_key": warning_payload["key"],
            "warning_meta": warning_payload["meta"],
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
    extension = _resolve_image_extension(file, safe_name)
    if not extension:
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
