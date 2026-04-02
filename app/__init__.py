import os
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy.exc import OperationalError
from sqlalchemy import inspect, text

from app.config import config_map
from app.extensions import db, jwt, migrate


def _ensure_sqlite_schema_compatibility() -> None:
    """Apply minimal schema patches for existing SQLite databases."""
    engine = db.engine
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)

    required_columns: dict[str, dict[str, str]] = {
        "users": {"updated_at": "DATETIME"},
        "subjects": {
            "color": "VARCHAR(32)",
            "external_id": "INTEGER",
            "is_active": "BOOLEAN DEFAULT 1",
            "synced_at": "DATETIME",
        },
        "themes": {"external_id": "INTEGER"},
        "questions": {
            "updated_at": "DATETIME",
            "html_text": "TEXT",
            "solution_html": "TEXT",
            "external_id": "VARCHAR(64)",
        },
    }

    for table_name, columns in required_columns.items():
        if table_name not in inspector.get_table_names():
            continue

        existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
        for column_name, column_type in columns.items():
            if column_name in existing_columns:
                continue

            db.session.execute(
                text(
                    f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}"
                )
            )

    if "banners" not in inspector.get_table_names():
        db.session.execute(
            text(
                """
                CREATE TABLE banners (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subject_id INTEGER NOT NULL,
                    external_id INTEGER NOT NULL UNIQUE,
                    name VARCHAR(255),
                    header VARCHAR(255),
                    url VARCHAR(500),
                    display_order INTEGER,
                    duration INTEGER,
                    open_in_current_tab BOOLEAN DEFAULT 0,
                    position_name VARCHAR(128),
                    desktop_image_url VARCHAR(500),
                    mobile_image_url VARCHAR(500),
                    raw_payload TEXT,
                    created_at DATETIME,
                    updated_at DATETIME,
                    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
                )
                """
            )
        )

    db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_subject_external_id ON subjects(external_id)"))
    db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_theme_subject_external_id ON themes(subject_id, external_id)"))
    db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_question_external_id ON questions(external_id)"))

    db.session.commit()


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)

    cfg_name = config_name or os.getenv("FLASK_ENV", "development")
    app.config.from_object(config_map.get(cfg_name, config_map["development"]))

    upload_folder = Path(app.config["UPLOAD_FOLDER"])
    upload_folder.mkdir(parents=True, exist_ok=True)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.subjects import subjects_bp
    from app.routes.questions import questions_bp
    from app.routes.answers import answers_bp
    from app.routes.stats import stats_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(subjects_bp)
    app.register_blueprint(questions_bp)
    app.register_blueprint(answers_bp)
    app.register_blueprint(stats_bp)

    with app.app_context():
        db.create_all()
        _ensure_sqlite_schema_compatibility()
        from app.services import seed_subjects, start_background_sync
        seed_subjects()
        start_background_sync(app)

    # Global error handlers
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

    @app.get("/api/health")
    def health_check():
        return jsonify({"status": "ok"}), 200

    return app
