"""Telegram bot keyboards."""
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton


def main_menu_keyboard():
    """Main menu keyboard."""
    keyboard = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📚 Выбрать предмет")],
            [KeyboardButton(text="📊 Мои результаты")],
            [KeyboardButton(text="⚙️ Профиль")],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )
    return keyboard


def subjects_keyboard(subjects):
    """Generate subjects keyboard."""
    buttons = []
    for subject in subjects:
        buttons.append(
            [InlineKeyboardButton(text=subject["name"], callback_data=f"subject_{subject['id']}")]
        )
    buttons.append([InlineKeyboardButton(text="« Назад", callback_data="back_to_menu")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def themes_keyboard(themes):
    """Generate themes keyboard for a subject."""
    buttons = []
    for theme in themes:
        buttons.append(
            [InlineKeyboardButton(text=theme["name"], callback_data=f"theme_{theme['id']}")]
        )
    buttons.append([InlineKeyboardButton(text="« Назад", callback_data="back_to_subjects")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def question_options_keyboard(options):
    """Generate keyboard for multiple choice questions."""
    buttons = [[InlineKeyboardButton(text=opt, callback_data=f"answer_{i}")] for i, opt in enumerate(options)]
    buttons.append([InlineKeyboardButton(text="⏭️ Пропустить", callback_data="skip_question")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def stats_menu_keyboard():
    """Stats menu keyboard."""
    buttons = [
        [InlineKeyboardButton(text="📈 По предметам", callback_data="stats_subjects")],
        [InlineKeyboardButton(text="🔥 Дневной стрик", callback_data="stats_streak")],
        [InlineKeyboardButton(text="📋 Последние ответы", callback_data="stats_history")],
        [InlineKeyboardButton(text="« Назад", callback_data="back_to_menu")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
