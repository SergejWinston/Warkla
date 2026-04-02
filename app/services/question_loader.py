"""Service for syncing and validating NeoFamily task-bank data."""
import os
import re
import threading
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import requests
from flask import current_app
from sqlalchemy import asc, desc

from app.extensions import db
from app.models import Banner, Question, Subject, Theme
from app.services.cache import cache


class NeoFamilyQuestionLoader:
    """Loader and sync service for NeoFamily API."""

    BASE_URL = "https://backend.neofamily.ru/api"
    DEFAULT_TIMEOUT = 12
    REMOTE_CHECK_PLACEHOLDER = "__remote_check__"
    FALLBACK_SUBJECTS = (
        {"id": 11, "name": "Russkiy yazyk", "slug": "russkiy-yazyk", "color": "#f9e489", "is_active": True},
        {"id": 1, "name": "Biologiya", "slug": "biologiya", "color": "#cbe1a1", "is_active": True},
        {"id": 2, "name": "Himiya", "slug": "himiya", "color": "#d4ddee", "is_active": True},
        {"id": 12, "name": "Obshchestvoznanie", "slug": "obshchestvoznanie", "color": "#ada2cc", "is_active": True},
    )

    @staticmethod
    def _base_url() -> str:
        return os.getenv("NEOFAMILY_API_BASE", NeoFamilyQuestionLoader.BASE_URL).rstrip("/")

    @staticmethod
    def _request(
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Perform NeoFamily API request and normalize errors."""
        url = f"{NeoFamilyQuestionLoader._base_url()}{path}"
        headers = {"Accept": "application/json"}
        if json_data is not None:
            headers["Content-Type"] = "application/json"

        try:
            response = requests.request(
                method=method,
                url=url,
                params=params,
                json=json_data,
                headers=headers,
                timeout=NeoFamilyQuestionLoader.DEFAULT_TIMEOUT,
            )
            response.raise_for_status()
            payload = response.json()
            if not payload.get("success"):
                current_app.logger.warning("NeoFamily response is unsuccessful: %s", payload)
                return None
            return payload
        except Exception as exc:  # noqa: BLE001
            current_app.logger.error("NeoFamily request failed (%s %s): %s", method, url, exc)
            return None

    @staticmethod
    def _html_to_text(html: str) -> str:
        """Convert simple HTML question text to plain text for previews/search."""
        if not html:
            return ""
        with_breaks = re.sub(r"<\s*br\s*/?>", "\n", html, flags=re.IGNORECASE)
        no_tags = re.sub(r"<[^>]+>", " ", with_breaks)
        return re.sub(r"\s+", " ", no_tags).strip()

    @staticmethod
    def fetch_subjects() -> list[Dict[str, Any]]:
        """Fetch active subjects from NeoFamily."""
        payload = NeoFamilyQuestionLoader._request(
            "GET",
            "/subject",
            params={"only": "id,name,color,slug", "is_active": 1, "paginate": 0},
        )
        if not payload:
            return list(NeoFamilyQuestionLoader.FALLBACK_SUBJECTS)
        return payload.get("data", []) or []

    @staticmethod
    def fetch_banner(subject_slug: str, page: int = 1, per_page: int = 15) -> Optional[Dict[str, Any]]:
        """Fetch task-bank banner for subject slug."""
        cache_key = f"neofamily:banner:{subject_slug}:{page}:{per_page}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        payload = NeoFamilyQuestionLoader._request(
            "GET",
            "/banners/task-bank",
            params={"subject_slug": subject_slug, "page": page, "perPage": per_page},
        )
        if not payload:
            return None

        banner = payload.get("data")
        if banner is not None:
            cache.set(cache_key, banner, ttl=3600)
        return banner

    @staticmethod
    def fetch_tasks(subject_slug: str, page: int = 1, per_page: int = 15) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        """Fetch paginated tasks for subject slug."""
        cache_key = f"neofamily:tasks:{subject_slug}:{page}:{per_page}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached.get("data", []), cached.get("pagination", {})

        payload = NeoFamilyQuestionLoader._request(
            "GET",
            "/task",
            params={
                "sort[id]": "asc",
                "only": "score,question,additional_info,subject_id,is_hidden,is_informal,free_answer,is_related,id,task_answer_size,status,is_favorite,is_briefcase,criteria,has_custom_answers",
                "page": page,
                "subject": subject_slug,
                "perPage": per_page,
                "except_solved": 0,
                "is_informal": 0,
                "is_hidden": 0,
                "exclude_all_variant_ids": 0,
            },
        )
        if not payload:
            return [], {}

        result = {
            "data": payload.get("data", []) or [],
            "pagination": payload.get("pagination", {}) or {},
        }
        cache.set(cache_key, result, ttl=3600)
        return result["data"], result["pagination"]

    @staticmethod
    def check_task_answer(external_task_id: str, answer: str) -> Optional[bool]:
        """Check user answer using NeoFamily task check endpoint."""
        normalized = answer.strip()
        cache_key = f"neofamily:check:{external_task_id}:{normalized}"
        cached = cache.get(cache_key)
        if cached is not None:
            return bool(cached)

        payload = NeoFamilyQuestionLoader._request(
            "POST",
            f"/task/check/{external_task_id}",
            json_data={"answer": answer},
        )
        if not payload:
            return None

        result = payload.get("data", {}).get("result")
        if result == "successful":
            cache.set(cache_key, True, ttl=86400)
            return True
        if result == "non_successful":
            cache.set(cache_key, False, ttl=86400)
            return False
        return None

    @staticmethod
    def fetch_solution(external_task_id: str) -> Optional[str]:
        """Fetch official task solution html from NeoFamily."""
        cache_key = f"neofamily:solution:{external_task_id}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        payload = NeoFamilyQuestionLoader._request("GET", f"/task/{external_task_id}/solution")
        if not payload:
            return None

        solution_html = payload.get("data", {}).get("solution")
        if solution_html:
            cache.set(cache_key, solution_html, ttl=86400 * 7)
        return solution_html

    @staticmethod
    def sync_subjects() -> Dict[str, Subject]:
        """Upsert NeoFamily subjects into local DB."""
        subject_payloads = NeoFamilyQuestionLoader.fetch_subjects()
        synced: Dict[str, Subject] = {}
        seen_external_ids: set[int] = set()

        existing_subjects = Subject.query.all()
        by_slug: Dict[str, Subject] = {subject.slug: subject for subject in existing_subjects if subject.slug}
        by_external_id: Dict[int, Subject] = {
            int(subject.external_id): subject
            for subject in existing_subjects
            if subject.external_id is not None
        }

        for payload in subject_payloads:
            ext_id = payload.get("id")
            if ext_id is not None:
                seen_external_ids.add(int(ext_id))

            slug = payload.get("slug")
            subject = None
            if ext_id is not None:
                subject = by_external_id.get(int(ext_id))
            if subject is None and slug:
                subject = by_slug.get(slug)

            if subject is None:
                subject = Subject(
                    name=payload.get("name", slug or "Unknown"),
                    slug=slug or f"subject-{ext_id}",
                )
                db.session.add(subject)
                by_slug[subject.slug] = subject

            subject.name = payload.get("name", subject.name)
            subject.slug = slug or subject.slug
            subject.color = payload.get("color")
            subject.external_id = int(ext_id) if ext_id is not None else subject.external_id
            subject.is_active = bool(payload.get("is_active", True))
            subject.synced_at = datetime.now(timezone.utc)

            if subject.slug:
                by_slug[subject.slug] = subject
            if subject.external_id is not None:
                by_external_id[int(subject.external_id)] = subject

            synced[subject.slug] = subject

        if seen_external_ids:
            Subject.query.filter(Subject.external_id.isnot(None), Subject.external_id.notin_(seen_external_ids)).update(
                {Subject.is_active: False},
                synchronize_session=False,
            )

        db.session.commit()
        return synced

    @staticmethod
    def _upsert_theme(subject_id: int, raw_theme: Dict[str, Any]) -> Optional[Theme]:
        if not raw_theme:
            return None

        external_id = raw_theme.get("id")
        name = raw_theme.get("name")
        section_name = (raw_theme.get("section") or {}).get("name")

        theme = None
        if external_id is not None:
            theme = Theme.query.filter_by(subject_id=subject_id, external_id=int(external_id)).first()
        if theme is None and name:
            theme = Theme.query.filter_by(subject_id=subject_id, name=name, section_name=section_name).first()

        if theme is None:
            theme = Theme(subject_id=subject_id, name=name or "Without theme", section_name=section_name)
            db.session.add(theme)

        theme.name = name or theme.name
        theme.section_name = section_name
        if external_id is not None:
            theme.external_id = int(external_id)
        return theme

    @staticmethod
    def _detect_question_type(raw_question: Dict[str, Any]) -> str:
        if raw_question.get("free_answer"):
            return "text"
        columns = (raw_question.get("task_answer_size") or {}).get("columns")
        if columns and int(columns) > 1:
            return "multiple"
        return "text"

    @staticmethod
    def sync_questions_for_subject(subject_slug: str, max_pages: int = 15, per_page: int = 15) -> int:
        """Sync paginated tasks from NeoFamily into local DB."""
        subject = Subject.query.filter_by(slug=subject_slug).first()
        if not subject:
            return 0

        inserted_or_updated = 0
        for page in range(1, max_pages + 1):
            tasks, pagination = NeoFamilyQuestionLoader.fetch_tasks(subject_slug, page=page, per_page=per_page)
            if not tasks:
                break

            for raw_task in tasks:
                external_id = str(raw_task.get("id"))
                if not external_id:
                    continue

                question = Question.query.filter_by(external_id=external_id).first()
                if question is None:
                    question = Question(
                        external_id=external_id,
                        source="neofamily",
                        answer=NeoFamilyQuestionLoader.REMOTE_CHECK_PLACEHOLDER,
                        subject_id=subject.id,
                        question_type="text",
                        text="",
                    )
                    db.session.add(question)

                raw_theme = (raw_task.get("themes") or [None])[0]
                theme = NeoFamilyQuestionLoader._upsert_theme(subject.id, raw_theme) if raw_theme else None

                html_text = (raw_task.get("question") or "").strip()
                explanation = (raw_task.get("additional_info") or "").strip() or None

                question.subject = subject
                question.theme = theme
                question.html_text = html_text
                question.text = NeoFamilyQuestionLoader._html_to_text(html_text)
                question.question_type = NeoFamilyQuestionLoader._detect_question_type(raw_task)
                question.explanation = explanation
                question.updated_at = datetime.now(timezone.utc)
                inserted_or_updated += 1

            db.session.commit()

            total_pages = pagination.get("totalPages") if isinstance(pagination, dict) else None
            if total_pages and page >= int(total_pages):
                break

        return inserted_or_updated

    @staticmethod
    def sync_banner_for_subject(subject_slug: str, page: int = 1, per_page: int = 15) -> Optional[Banner]:
        """Sync one banner payload for a subject."""
        subject = Subject.query.filter_by(slug=subject_slug).first()
        if subject is None:
            return None

        payload = NeoFamilyQuestionLoader.fetch_banner(subject_slug, page=page, per_page=per_page)
        if not payload:
            return None

        external_id = payload.get("id")
        if external_id is None:
            return None

        banner = Banner.query.filter_by(external_id=int(external_id)).first()
        if banner is None:
            banner = Banner(subject_id=subject.id, external_id=int(external_id))
            db.session.add(banner)

        desktop = None
        mobile = None
        for file_item in payload.get("files", []) or []:
            position = file_item.get("position")
            if position == "desktop":
                desktop = file_item.get("path")
            elif position == "mobile":
                mobile = file_item.get("path")

        banner.subject_id = subject.id
        banner.name = payload.get("name")
        banner.header = payload.get("header")
        banner.url = payload.get("url")
        banner.display_order = payload.get("order")
        banner.duration = payload.get("duration")
        banner.open_in_current_tab = bool(payload.get("open_in_current_tab", False))
        banner.position_name = (payload.get("position") or {}).get("position")
        banner.desktop_image_url = desktop
        banner.mobile_image_url = mobile
        banner.raw_payload = payload

        db.session.commit()
        return banner

    @staticmethod
    def bootstrap_sync(max_pages: int = 15, per_page: int = 15) -> Dict[str, int]:
        """Run a full sync cycle across active subjects."""
        synced_subjects = NeoFamilyQuestionLoader.sync_subjects()
        subjects_processed = 0
        questions_synced = 0
        banners_synced = 0

        for subject in synced_subjects.values():
            if not subject.is_active:
                continue
            subjects_processed += 1

            if NeoFamilyQuestionLoader.sync_banner_for_subject(subject.slug):
                banners_synced += 1

            questions_synced += NeoFamilyQuestionLoader.sync_questions_for_subject(
                subject.slug,
                max_pages=max_pages,
                per_page=per_page,
            )

        return {
            "subjects": subjects_processed,
            "questions": questions_synced,
            "banners": banners_synced,
        }

    @staticmethod
    def get_local_paginated_questions(
        subject_slug: str,
        page: int = 1,
        per_page: int = 15,
        theme_id: Optional[int] = None,
        sort_params: Optional[list[tuple[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated questions from local database for API responses.
        
        Args:
            subject_slug: Slug of the subject (e.g., 'russkiy-yazyk')
            page: Page number (1-indexed)
            per_page: Items per page (max 100)
            theme_id: Optional theme ID filter
            sort_params: List of (field, order) tuples, e.g., [('id', 'asc'), ('difficulty', 'desc')]
        
        Returns:
            Dictionary with 'data' and 'pagination' keys
        """
        page = max(page, 1)
        per_page = max(min(per_page, 100), 1)

        subject = Subject.query.filter_by(slug=subject_slug, is_active=True).first()
        if not subject:
            return {
                "data": [],
                "pagination": {
                    "count": 0,
                    "total": 0,
                    "perPage": per_page,
                    "currentPage": page,
                    "totalPages": 0,
                },
            }

        query = Question.query.filter_by(subject_id=subject.id)
        if theme_id is not None:
            query = query.filter_by(theme_id=theme_id)

        # Define allowed sortable columns and their mappings
        allowed_sort_columns = {
            "id": Question.id,
            "created_at": Question.created_at,
            "updated_at": Question.updated_at,
            "difficulty": Question.difficulty,
            "external_id": Question.external_id,
            "theme_id": Question.theme_id,
            "question_type": Question.question_type,
        }
        
        # Build sorting expressions from sort_params
        sort_params = sort_params or [("id", "asc")]
        sort_expressions = []
        
        for field, order in sort_params:
            sort_column = allowed_sort_columns.get(field.lower())
            if sort_column is not None:
                sort_expr = desc(sort_column) if order == "desc" else asc(sort_column)
                sort_expressions.append(sort_expr)
        
        # Always add ID as final sort key for consistency
        if not any(field.lower() == "id" for field, _ in sort_params):
            sort_expressions.append(asc(Question.id))

        total = query.count()
        items = query.order_by(*sort_expressions).offset((page - 1) * per_page).limit(per_page).all()
        total_pages = (total + per_page - 1) // per_page if total else 0

        return {
            "data": [question.to_dict(include_answer=False) for question in items],
            "pagination": {
                "count": len(items),
                "total": total,
                "perPage": per_page,
                "currentPage": page,
                "totalPages": total_pages,
            },
        }


def seed_subjects() -> None:
    """Seed fallback subjects when DB is empty."""
    if Subject.query.count() > 0:
        return

    for payload in NeoFamilyQuestionLoader.FALLBACK_SUBJECTS:
        subject = Subject(
            name=payload["name"],
            slug=payload["slug"],
            color=payload.get("color"),
            external_id=payload.get("id"),
            is_active=bool(payload.get("is_active", True)),
            synced_at=datetime.now(timezone.utc),
        )
        db.session.add(subject)
    db.session.commit()


def _sync_cycle(app, max_pages: int, per_page: int) -> None:
    with app.app_context():
        summary = NeoFamilyQuestionLoader.bootstrap_sync(max_pages=max_pages, per_page=per_page)
        app.logger.info("NeoFamily sync cycle completed: %s", summary)


def start_background_sync(app) -> None:
    """Run initial and periodic sync in background daemon threads."""
    if app.extensions.get("neofamily_sync_started"):
        return

    enabled = os.getenv("NEOFAMILY_SYNC_ENABLED", "true").lower() == "true"
    if not enabled:
        app.logger.info("NeoFamily background sync disabled by env")
        return

    app.extensions["neofamily_sync_started"] = True

    bootstrap_pages = int(os.getenv("NEOFAMILY_BOOTSTRAP_PAGES", "15"))
    bootstrap_per_page = int(os.getenv("NEOFAMILY_BOOTSTRAP_PER_PAGE", "15"))
    interval_seconds = int(os.getenv("NEOFAMILY_SYNC_INTERVAL_SECONDS", str(60 * 60 * 6)))
    periodic_pages = int(os.getenv("NEOFAMILY_PERIODIC_PAGES", "2"))

    def run_initial() -> None:
        _sync_cycle(app, max_pages=bootstrap_pages, per_page=bootstrap_per_page)

    threading.Thread(target=run_initial, daemon=True, name="neofamily-sync-initial").start()

    if interval_seconds <= 0:
        return

    def run_periodic() -> None:
        while True:
            time.sleep(interval_seconds)
            _sync_cycle(app, max_pages=periodic_pages, per_page=bootstrap_per_page)

    threading.Thread(target=run_periodic, daemon=True, name="neofamily-sync-periodic").start()
