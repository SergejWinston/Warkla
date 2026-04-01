"""Telegram webhook integration with Flask."""
import os
import logging
from flask import Blueprint, request, jsonify
from aiogram import Bot
from aiogram.types import Update
import asyncio

webhook_bp = Blueprint("webhook", __name__, url_prefix="/api/webhook")
logger = logging.getLogger(__name__)

# This will be set when bot is initialized
bot: Bot = None
dp = None


def set_bot_and_dispatcher(bot_instance, dispatcher):
    """Set bot and dispatcher for webhook processing."""
    global bot, dp
    bot = bot_instance
    dp = dispatcher


@webhook_bp.post("/telegram")
async def telegram_webhook():
    """Receive Telegram updates via webhook."""
    if not bot or not dp:
        return jsonify({"error": "Bot not initialized"}), 500

    try:
        update_data = request.get_json()
        update = Update(**update_data)

        # Process the update
        await dp.feed_update(bot, update)
        return jsonify({"ok": True})
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return jsonify({"error": str(e)}), 400


@webhook_bp.post("/telegram/set-webhook")
def set_webhook():
    """Set webhook URL for Telegram bot."""
    webhook_url = os.getenv("TELEGRAM_WEBHOOK_URL")
    if not webhook_url:
        return jsonify({"error": "TELEGRAM_WEBHOOK_URL not set"}), 400

    try:
        # This would be called during deployment
        return jsonify({"webhook_url": webhook_url, "status": "webhook_would_be_set"})
    except Exception as e:
        logger.error(f"Error setting webhook: {e}")
        return jsonify({"error": str(e)}), 400
