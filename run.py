import sys
import os
import threading
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


def run_bot():
    """Run Telegram bot."""
    from bot.main import start_bot
    import asyncio
    asyncio.run(start_bot())


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"

    if mode == "flask":
        print("Running Flask only...")
        run_flask()
    elif mode == "bot":
        print("Running Telegram bot only...")
        run_bot()
    elif mode == "all":
        print("Running Flask and Telegram bot in parallel...")
        flask_thread = threading.Thread(target=run_flask, daemon=True)
        bot_thread = threading.Thread(target=run_bot, daemon=True)

        flask_thread.start()
        bot_thread.start()

        try:
            flask_thread.join()
            bot_thread.join()
        except KeyboardInterrupt:
            print("Shutting down...")
    else:
        print(f"Unknown mode: {mode}")
        print("Usage: python run.py [flask|bot|all]")
        sys.exit(1)
