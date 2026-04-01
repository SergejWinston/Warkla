"""Main Telegram bot module using aiogram."""
import asyncio
import logging
import os
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import BotCommand

from bot.handlers import user, quiz

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def setup_commands(bot: Bot):
    """Set up bot commands."""
    commands = [
        BotCommand(command="start", description="Начать работу с ботом"),
        BotCommand(command="help", description="Справка"),
        BotCommand(command="stats", description="Мои результаты"),
    ]
    await bot.set_my_commands(commands)


async def start_bot():
    """Start the Telegram bot with polling."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN not set in environment")

    bot = Bot(token=token)
    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    # Include routers
    dp.include_router(user.router)
    dp.include_router(quiz.router)

    # Setup commands
    await setup_commands(bot)

    logger.info("Starting Telegram bot polling...")
    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    except Exception as e:
        logger.error(f"Error in bot polling: {e}")
        raise
    finally:
        await bot.session.close()


def run_bot():
    """Run bot in a subprocess (for Flask integration)."""
    asyncio.run(start_bot())


if __name__ == "__main__":
    asyncio.run(start_bot())
