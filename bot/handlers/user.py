"""User registration and auth handlers."""
import os
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, User as TelegramUser
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import requests

from bot.keyboards import main_menu_keyboard

router = Router()

API_BASE = os.getenv("FLASK_API_BASE", "http://localhost:5000/api")


class UserStates(StatesGroup):
    """User FSM states for registration."""
    waiting_for_username = State()
    waiting_for_email = State()
    waiting_for_password = State()


@router.message(CommandStart())
async def command_start(message: Message, state: FSMContext):
    """Handle /start command."""
    telegram_id = message.from_user.id

    # Check if user already registered
    try:
        # Get user data if exists (we'll use telegram_id as username)
        await message.answer(
            f"Привет, {message.from_user.first_name}! 👋\n\n"
            "Добро пожаловать в EGE-Bot - твой помощник в подготовке к ЕГЭ!\n\n"
            "Ты готов начать? 🚀",
            reply_markup=main_menu_keyboard()
        )
        await state.set_state(None)
    except Exception as e:
        await message.answer(f"Ошибка: {str(e)}")


@router.message(F.text == "📚 Выбрать предмет")
async def choose_subject(message: Message, state: FSMContext):
    """Handle subject selection request."""
    try:
        response = requests.get(f"{API_BASE}/subjects", timeout=5)
        if response.status_code == 200:
            subjects = response.json()

            if not subjects:
                await message.answer("Извини, предметы еще не загружены на сервер.")
                return

            text = "Выбери предмет для подготовки:\n"
            # Show first 4 subjects inline
            buttons = []
            for i, subject in enumerate(subjects[:4], 1):
                buttons.append(f"{i}. {subject['name']}")
                text += f"{i}. {subject['name']}\n"

            await message.answer(text)
            await state.update_data(subjects=subjects)
        else:
            await message.answer("Ошибка при загрузке предметов. Попробуй позже.")
    except Exception as e:
        await message.answer(f"Ошибка подключения: {str(e)}")


@router.message(F.text == "📊 Мои результаты")
async def view_stats(message: Message):
    """Handle stats view request."""
    user_id = message.from_user.id

    try:
        # Get JWT token (would need to be stored in database with telegram_id)
        # For now, send placeholder
        await message.answer(
            "📊 Твоя статистика:\n\n"
            "Эта функция требует аутентификации через веб-приложение.\n"
            "Зарегистрируйся и войди на сайт для просмотра полных результатов!"
        )
    except Exception as e:
        await message.answer(f"Ошибка: {str(e)}")


@router.message(F.text == "⚙️ Профиль")
async def view_profile(message: Message):
    """Handle profile view request."""
    user_id = message.from_user.id

    await message.answer(
        f"👤 Твой профиль:\n\n"
        f"Telegram ID: {user_id}\n"
        f"Имя: {message.from_user.first_name}\n"
        f"Юзернейм: @{message.from_user.username or 'не указан'}\n\n"
        f"Для полного профиля посети веб-приложение!"
    )
