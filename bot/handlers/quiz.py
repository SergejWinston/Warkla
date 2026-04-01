"""Quiz flow handlers."""
import os
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
import requests
import json

from bot.keyboards import (
    subjects_keyboard,
    themes_keyboard,
    question_options_keyboard,
    main_menu_keyboard
)

router = Router()

API_BASE = os.getenv("FLASK_API_BASE", "http://localhost:5000/api")


class QuizStates(StatesGroup):
    """Quiz FSM states."""
    choosing_subject = State()
    choosing_theme = State()
    answering_question = State()
    viewing_results = State()


@router.callback_query(F.data.startswith("subject_"))
async def select_subject(callback: CallbackQuery, state: FSMContext):
    """Handle subject selection."""
    subject_id = int(callback.data.split("_")[1])

    try:
        response = requests.get(
            f"{API_BASE}/subjects/{subject_id}/themes",
            timeout=5
        )
        if response.status_code == 200:
            themes = response.json()

            if not themes:
                await callback.message.edit_text("В этом предмете пока нет тем.")
                return

            await state.update_data(subject_id=subject_id)
            await state.set_state(QuizStates.choosing_theme)

            await callback.message.edit_text(
                "Выбери тему:",
                reply_markup=themes_keyboard(themes)
            )
        else:
            await callback.answer("Ошибка при загрузке тем", show_alert=True)
    except Exception as e:
        await callback.answer(f"Ошибка: {str(e)}", show_alert=True)


@router.callback_query(F.data.startswith("theme_"))
async def select_theme(callback: CallbackQuery, state: FSMContext):
    """Handle theme selection and get first question."""
    theme_id = int(callback.data.split("_")[1])
    state_data = await state.get_data()
    subject_id = state_data.get("subject_id")

    try:
        response = requests.get(
            f"{API_BASE}/questions",
            params={"subject": subject_id, "theme": theme_id},
            timeout=5
        )
        if response.status_code == 200:
            question = response.json()

            await state.update_data(
                current_question=question,
                theme_id=theme_id
            )
            await state.set_state(QuizStates.answering_question)

            # Format question
            text = f"❓ {question['text']}\n\n"

            if question["type"] == "choice" and question.get("options"):
                options = question["options"]
                if isinstance(options, str):
                    options = json.loads(options)

                for i, opt in enumerate(options, 1):
                    text += f"{i}. {opt}\n"

                await callback.message.edit_text(
                    text,
                    reply_markup=question_options_keyboard(options)
                )
            else:
                # For text/number questions, ask user to type answer
                await callback.message.edit_text(
                    text + "Напиши свой ответ:"
                )

        else:
            await callback.answer("Вопросов не найдено", show_alert=True)
    except Exception as e:
        await callback.answer(f"Ошибка: {str(e)}", show_alert=True)


@router.callback_query(F.data.startswith("answer_"))
async def submit_choice_answer(callback: CallbackQuery, state: FSMContext):
    """Handle multiple choice answer submission."""
    answer_idx = int(callback.data.split("_")[1])
    state_data = await state.get_data()
    question = state_data.get("current_question")

    if not question:
        await callback.answer("Ошибка: вопрос не найден", show_alert=True)
        return

    options = question.get("options", [])
    if isinstance(options, str):
        options = json.loads(options)

    if answer_idx >= len(options):
        await callback.answer("Недопустимый ответ", show_alert=True)
        return

    user_answer = options[answer_idx]

    # Submit answer to API
    try:
        response = requests.post(
            f"{API_BASE}/answers",
            json={
                "question_id": question["id"],
                "user_answer": user_answer
            },
            timeout=5
        )

        if response.status_code == 201:
            result = response.json()
            is_correct = result.get("is_correct", False)
            explanation = result.get("explanation", "")

            status = "✅ Верно!" if is_correct else "❌ Неверно!"
            text = f"{status}\n\n"

            if result.get("correct_answer"):
                text += f"Правильный ответ: {result['correct_answer']}\n\n"

            if explanation:
                text += f"📚 Объяснение:\n{explanation}\n\n"

            text += "⏭️ Загрузить следующий вопрос?"

            await callback.message.edit_text(text)
            await state.set_state(None)

        else:
            await callback.answer("Ошибка при отправке ответа", show_alert=True)
    except Exception as e:
        await callback.answer(f"Ошибка: {str(e)}", show_alert=True)


@router.callback_query(F.data == "skip_question")
async def skip_question(callback: CallbackQuery, state: FSMContext):
    """Skip current question."""
    await callback.message.edit_text("Вопрос пропущен. Загружаю следующий...")
    # Logic to load next question would go here
    await callback.answer("Вопрос пропущен")


@router.callback_query(F.data == "back_to_menu")
async def back_to_menu(callback: CallbackQuery, state: FSMContext):
    """Return to main menu."""
    await state.clear()
    await callback.message.delete()
    await callback.message.answer(
        "Возвращаюсь в меню...",
        reply_markup=main_menu_keyboard()
    )


@router.callback_query(F.data == "back_to_subjects")
async def back_to_subjects(callback: CallbackQuery, state: FSMContext):
    """Return to subject selection."""
    state_data = await state.get_data()
    subjects = state_data.get("subjects", [])

    await state.set_state(QuizStates.choosing_subject)
    await callback.message.edit_text(
        "Выбери предмет:",
        reply_markup=subjects_keyboard(subjects)
    )


@router.message(QuizStates.answering_question)
async def handle_text_answer(message: Message, state: FSMContext):
    """Handle text/number answer input."""
    state_data = await state.get_data()
    question = state_data.get("current_question")

    if not question:
        await message.answer("Ошибка: вопрос не найден")
        return

    user_answer = message.text.strip()

    try:
        response = requests.post(
            f"{API_BASE}/answers",
            json={
                "question_id": question["id"],
                "user_answer": user_answer
            },
            timeout=5
        )

        if response.status_code == 201:
            result = response.json()
            is_correct = result.get("is_correct", False)
            explanation = result.get("explanation", "")

            status = "✅ Верно!" if is_correct else "❌ Неверно!"
            text = f"{status}\n\n"

            if result.get("correct_answer"):
                text += f"Правильный ответ: {result['correct_answer']}\n\n"

            if explanation:
                text += f"📚 Объяснение:\n{explanation}\n\n"

            text += "Загрузить следующий вопрос?"

            await message.answer(text, reply_markup=main_menu_keyboard())
            await state.set_state(None)

        else:
            await message.answer("Ошибка при отправке ответа")
    except Exception as e:
        await message.answer(f"Ошибка: {str(e)}")
