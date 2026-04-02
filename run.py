import sys
import os
from app import create_app


app = create_app()


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def run_flask():
    """Run Flask application."""
    debug = _env_bool("FLASK_DEBUG", default=os.getenv("FLASK_ENV") == "development")
    app.run(host="0.0.0.0", port=5000, debug=debug)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "flask"

    if mode == "flask":
        print("Running Flask only...")
        run_flask()
    else:
        print(f"Unknown mode: {mode}")
        print("Usage: python run.py [flask]")
        sys.exit(1)
