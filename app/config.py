import os
from datetime import timedelta
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_DAYS", "30")))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", str(BASE_DIR / "uploads"))
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 5 * 1024 * 1024))

    NEOFAMILY_API_BASE = os.getenv("NEOFAMILY_API_BASE", "https://backend.neofamily.ru/api")
    NEOFAMILY_SYNC_ENABLED = os.getenv("NEOFAMILY_SYNC_ENABLED", "true")
    NEOFAMILY_BOOTSTRAP_PAGES = int(os.getenv("NEOFAMILY_BOOTSTRAP_PAGES", "15"))
    NEOFAMILY_BOOTSTRAP_PER_PAGE = int(os.getenv("NEOFAMILY_BOOTSTRAP_PER_PAGE", "15"))
    NEOFAMILY_PERIODIC_PAGES = int(os.getenv("NEOFAMILY_PERIODIC_PAGES", "2"))
    NEOFAMILY_SYNC_INTERVAL_SECONDS = int(os.getenv("NEOFAMILY_SYNC_INTERVAL_SECONDS", str(6 * 60 * 60)))


class DevelopmentConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'warkla.db'}",
    )


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


config_map = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
}
