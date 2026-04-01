"""Service for loading questions from external sources (NeoFamily API, etc.)."""
import requests
from typing import Optional, List, Dict, Any
from flask import current_app

from app.extensions import db
from app.models import Subject, Theme, Question
from app.services.cache import cache


class NeoFamilyQuestionLoader:
    """Loader for questions from NeoFamily API."""

    BASE_URL = "https://backend.neofamily.ru/api"

    SUBJECT_MAPPING = {
        "russkiy-yazyk": {"name": "Русский язык", "id": 1},
        "matematika": {"name": "Математика", "id": 2},
        "informatika": {"name": "Информатика", "id": 3},
        "obshchestvoznanie": {"name": "Обществознание", "id": 4},
    }

    @staticmethod
    def fetch_questions(subject_slug: str, page: int = 1, per_page: int = 50) -> Optional[List[Dict]]:
        """Fetch questions from NeoFamily API with caching."""
        # Try to get from cache
        cache_key = f"questions:neofamily:{subject_slug}:{page}:{per_page}"
        cached = cache.get(cache_key)
        if cached is not None:
            current_app.logger.info(f"Cache hit for {cache_key}")
            return cached

        try:
            url = f"{NeoFamilyQuestionLoader.BASE_URL}/task"
            params = {
                "sort[id]": "asc",
                "subject": subject_slug,
                "page": page,
                "perPage": per_page,
                "except_solved": 0,
                "is_informal": 0,
                "is_hidden": 0,
                "exclude_all_variant_ids": 0,
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            if data.get("success") and data.get("data"):
                result = data["data"]
                # Cache for 24 hours
                cache.set(cache_key, result, ttl=86400)
                return result
        except Exception as e:
            current_app.logger.error(f"Error fetching questions from NeoFamily: {e}")
        return None

    @staticmethod
    def parse_question(raw_question: Dict[str, Any], subject_id: int, subject_slug: str) -> Optional[Dict]:
        """Parse question from NeoFamily API response."""
        try:
            # Extract theme info
            themes = raw_question.get("themes", [])
            theme_id = None
            theme_name = None
            section_name = None

            if themes:
                theme = themes[0]
                theme_name = theme.get("name")
                section = theme.get("section", {})
                section_name = section.get("name")

            # Determine question type
            question_type = "text"  # default
            if raw_question.get("task_answer_size", {}).get("columns") == 1:
                question_type = "choice"

            # Extract question and answer
            question_text = raw_question.get("question", "").strip()
            question_text = question_text.replace("<p>", "").replace("</p>", "").replace("<br>", "\n")

            # For now, we'll set placeholder answer
            answer = "TBD"
            explanation = raw_question.get("additional_info", "").strip()

            return {
                "text": question_text,
                "theme_name": theme_name,
                "section_name": section_name,
                "type": question_type,
                "answer": answer,
                "explanation": explanation,
                "external_id": str(raw_question.get("id")),
                "source": "neofamily",
            }
        except Exception as e:
            current_app.logger.error(f"Error parsing question: {e}")
        return None

    @staticmethod
    def load_questions_for_subject(subject_slug: str, max_pages: int = 5) -> int:
        """Load questions for a subject from NeoFamily API."""
        if subject_slug not in NeoFamilyQuestionLoader.SUBJECT_MAPPING:
            current_app.logger.error(f"Unknown subject: {subject_slug}")
            return 0

        subject_info = NeoFamilyQuestionLoader.SUBJECT_MAPPING[subject_slug]
        subject_id = subject_info["id"]
        subject_name = subject_info["name"]

        # Create or get subject
        subject = Subject.query.filter_by(slug=subject_slug).first()
        if not subject:
            subject = Subject(name=subject_name, slug=subject_slug)
            db.session.add(subject)
            db.session.commit()

        loaded_count = 0

        for page in range(1, max_pages + 1):
            raw_questions = NeoFamilyQuestionLoader.fetch_questions(subject_slug, page=page)
            if not raw_questions:
                break

            for raw_q in raw_questions:
                # Check if question already exists
                external_id = str(raw_q.get("id"))
                if Question.query.filter_by(external_id=external_id).first():
                    continue

                parsed = NeoFamilyQuestionLoader.parse_question(raw_q, subject.id, subject_slug)
                if not parsed:
                    continue

                # Create or get theme
                theme = None
                if parsed.get("theme_name"):
                    theme = Theme.query.filter_by(
                        subject_id=subject.id,
                        name=parsed["theme_name"],
                        section_name=parsed.get("section_name")
                    ).first()

                    if not theme:
                        theme = Theme(
                            subject_id=subject.id,
                            name=parsed["theme_name"],
                            section_name=parsed.get("section_name")
                        )
                        db.session.add(theme)
                        db.session.commit()

                # Create question
                question = Question(
                    text=parsed["text"],
                    subject_id=subject.id,
                    theme_id=theme.id if theme else None,
                    question_type=parsed["type"],
                    answer=parsed["answer"],
                    explanation=parsed["explanation"],
                    external_id=parsed["external_id"],
                    source=parsed["source"],
                )
                db.session.add(question)
                loaded_count += 1

            db.session.commit()

        return loaded_count


def seed_subjects():
    """Seed initial subjects."""
    for slug, info in NeoFamilyQuestionLoader.SUBJECT_MAPPING.items():
        subject = Subject.query.filter_by(slug=slug).first()
        if not subject:
            subject = Subject(name=info["name"], slug=slug)
            db.session.add(subject)
    db.session.commit()
