import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from sqlalchemy import inspect, text

from app.config import config_map
from app.extensions import db, jwt, migrate


def _ensure_currency_column(app: Flask) -> None:
    with app.app_context():
        columns = {col["name"] for col in inspect(db.engine).get_columns("transactions")}
        if "currency" not in columns:
            db.session.execute(text("ALTER TABLE transactions ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'RUB'"))
            db.session.commit()


def create_app(config_name: str | None = None) -> Flask:
    web_dir = Path(__file__).resolve().parent.parent / "web"
    app = Flask(__name__)

    cfg_name = config_name or os.getenv("FLASK_ENV", "development")
    app.config.from_object(config_map.get(cfg_name, config_map["development"]))

    upload_folder = Path(app.config["UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from app.routes.achievements import achievements_bp
    from app.routes.auth import auth_bp
    from app.routes.budget import budget_bp
    from app.routes.profile import profile_bp
    from app.routes.transactions import transactions_bp
    from app.services.achievements import seed_achievements

    app.register_blueprint(auth_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(achievements_bp)
    app.register_blueprint(profile_bp)

    with app.app_context():
        db.create_all()
        _ensure_currency_column(app)
        seed_achievements()

    @app.errorhandler(400)
    def bad_request(_error):
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(401)
    def unauthorized(_error):
        return jsonify({"error": "Unauthorized"}), 401

    @app.errorhandler(403)
    def forbidden(_error):
        return jsonify({"error": "Forbidden"}), 403

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(413)
    def payload_too_large(_error):
        return jsonify({"error": "File is too large"}), 413

    @app.errorhandler(500)
    def internal_error(_error):
        return jsonify({"error": "Internal server error"}), 500

    @app.get("/")
    def index():
        return send_from_directory(web_dir, "index.html")

    @app.get("/login")
    def login_page():
        return send_from_directory(web_dir, "login.html")

    @app.get("/register")
    def register_page():
        return send_from_directory(web_dir, "register.html")

    @app.get("/<path:path>")
    def static_proxy(path: str):
        target = web_dir / path
        if target.exists() and target.is_file():
            return send_from_directory(web_dir, path)
        return send_from_directory(web_dir, "index.html")

    return app
