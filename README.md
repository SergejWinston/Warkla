# Warkla

Полноценная платформа для подготовки к ЕГЭ с веб-интерфейсом, JWT-авторизацией, статистикой прогресса и синхронизацией заданий из NeoFamily API.

Проект состоит из:
- Flask backend API (Python + SQLAlchemy)
- React frontend (Vite + Tailwind)
- SQLite по умолчанию
- Redis (опционально, для production-кэша)

## Что умеет проект

- Регистрация и вход пользователей (JWT)
- Выбор предмета и темы
- Получение задач из локального task-bank (который синхронизируется с NeoFamily)
- Проверка ответов:
  - локально для стандартных случаев
  - через NeoFamily `/task/check/{id}` для задач с удаленной валидацией
- История ответов с удалением записей
- Прогресс и статистика (точность, активность, стрик, лидерборд)
- Баннеры предметов из NeoFamily
- Сортировка задач по нескольким полям

## Архитектура

```text
React (frontend, Vite dev server)
        |
        |  /api/*
        v
Flask API (app/routes/*)
        |
        +--> SQLite (users, subjects, themes, questions, user_answers, user_stats, banners)
        |
        +--> NeoFamily API (subjects, tasks, banners, solution, answer-check)
        |
        +--> Redis cache (только если FLASK_ENV=production)
```

Ключевой поток данных:
1. При старте backend выполняет `db.create_all()`, seed fallback-предметов и запускает фоновые sync-задачи.
2. Фоновый sync подтягивает предметы/баннеры/задачи из NeoFamily в локальную БД.
3. Frontend работает с локальным API (`/api/...`) и не ходит напрямую во внешний сервис.

## Технологический стек

### Backend
- Python 3.11+
- Flask, Flask-CORS
- Flask-SQLAlchemy, Flask-Migrate
- Flask-JWT-Extended
- requests
- redis (опционально)

### Frontend
- React 18
- React Router 6
- Vite 5
- TailwindCSS 3
- Axios
- Zustand

### Инфраструктура
- Docker, Docker Compose
- Nginx (в deploy-конфиге)
- GitHub Actions (CI/CD + Docker publish)

## Структура репозитория

```text
.
├─ app/
│  ├─ __init__.py           # create_app, health-check, init DB, startup sync
│  ├─ config.py             # конфигурация из env
│  ├─ models.py             # SQLAlchemy модели
│  ├─ routes/               # API endpoints
│  │  ├─ auth.py
│  │  ├─ subjects.py
│  │  ├─ questions.py
│  │  ├─ answers.py
│  │  └─ stats.py
│  └─ services/
│     ├─ question_loader.py # интеграция с NeoFamily, sync, answer check
│     └─ cache.py           # Redis wrapper
├─ frontend/
│  ├─ src/
│  │  ├─ pages/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  └─ lib/api.js
│  └─ vite.config.mjs       # proxy /api -> localhost:5000
├─ migrations/              # Alembic migrations
├─ deploy/nginx-docker.conf
├─ docker-compose.yml
├─ Dockerfile
├─ run.py
└─ requirements.txt
```

## Быстрый старт (локально)

## 1. Требования

- Python 3.11+
- Node.js 18+ (рекомендуется)
- npm
- Git
- (опционально) Redis

## 2. Установка

### Backend

```bash
# из корня репозитория
python -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# Linux/macOS
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
cd ..
```

## 3. Настройка окружения

Создайте `.env` из шаблона:

```bash
# Linux/macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Для локального запуска достаточно значений по умолчанию.

## 4. Запуск

### Backend API

```bash
python run.py flask
```

Backend будет доступен на `http://localhost:5000`.

Проверка:

```bash
curl http://localhost:5000/api/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

### Frontend

```bash
cd frontend
npm run dev
```

Frontend будет доступен на `http://localhost:5173`.

Vite-прокси направляет `/api/*` на `http://localhost:5000`.

## Конфигурация через .env

Основные переменные:

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `FLASK_ENV` | `development` | Режим приложения; `production` также включает Redis-кэш при доступном Redis |
| `SECRET_KEY` | `dev-secret-key` | Flask secret |
| `JWT_SECRET_KEY` | `dev-jwt-secret` | Подпись JWT |
| `JWT_ACCESS_TOKEN_EXPIRES_DAYS` | `30` | Срок жизни access token |
| `DATABASE_URL` | `sqlite:///.../warkla.db` (в коде) | Подключение к БД |
| `CORS_ORIGINS` | `*` | CORS для `/api/*` |
| `UPLOAD_FOLDER` | `uploads` | Папка загрузок |
| `MAX_CONTENT_LENGTH` | `5242880` | Макс. размер upload (байт) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis для кэша |
| `NEOFAMILY_API_BASE` | `https://backend.neofamily.ru/api` | Базовый URL внешнего API |
| `NEOFAMILY_SYNC_ENABLED` | `true` | Включение фоновой синхронизации |
| `NEOFAMILY_BOOTSTRAP_PAGES` | `15` | Глубина первичной загрузки |
| `NEOFAMILY_BOOTSTRAP_PER_PAGE` | `15` | Размер страницы для bootstrap |
| `NEOFAMILY_PERIODIC_PAGES` | `2` | Глубина периодической синхронизации |
| `NEOFAMILY_SYNC_INTERVAL_SECONDS` | `21600` | Интервал периодического sync |

Примечание по БД: в `.env.example` указан `sqlite:///ege.db`; если не задавать `DATABASE_URL`, код использует `warkla.db` в корне проекта.

## База данных и миграции

В проекте используется смешанный подход:

- На старте приложения выполняется `db.create_all()` и patch-совместимость SQLite-схемы.
- Alembic/Flask-Migrate также присутствуют для версионируемых миграций.

Команды миграций:

```bash
flask --app run.py db current
flask --app run.py db upgrade
flask --app run.py db migrate -m "описание изменений"
```

## API (краткий справочник)

Базовый префикс: `/api`.

## Auth

| Метод | Endpoint | Auth | Описание |
|---|---|---|---|
| `POST` | `/auth/register` | Нет | Регистрация |
| `POST` | `/auth/login` | Нет | Логин по username/email |
| `GET` | `/auth/me` | Да | Текущий пользователь |

## Subjects

| Метод | Endpoint | Auth | Описание |
|---|---|---|---|
| `GET` | `/subjects` | Нет | Активные предметы |
| `GET` | `/subjects/<subject_id>` | Нет | Предмет по ID |
| `GET` | `/subjects/by-slug/<subject_slug>` | Нет | Предмет по slug |
| `GET` | `/subjects/<subject_id>/themes` | Нет | Темы предмета |
| `GET` | `/subjects/<subject_slug>/banner` | Нет | Баннер предмета |
| `POST` | `/subjects/sync` | Нет | Ручной запуск sync (bootstrap с ограничением страниц) |
| `GET` | `/subjects/<subject_id>/progress` | Да | Прогресс пользователя по предмету |

## Questions

| Метод | Endpoint | Auth | Описание |
|---|---|---|---|
| `GET` | `/questions` | Да | Пагинация задач из локального task-bank |
| `GET` | `/questions/<question_id>` | Да | Задача без ответа |
| `GET` | `/questions/<question_id>/solution` | Да | Решение/объяснение (при необходимости подтягивается извне) |
| `GET` | `/questions/count` | Нет | Количество задач (всего и по предметам) |

Параметры `/questions`:

- `subject_slug` (обязательный)
- `theme_id` (опционально)
- `page`, `per_page`
- сортировка:
  - современный формат: `sort[field]=asc|desc` (можно несколько)
  - legacy: `sort_by=field&sort_order=asc|desc`

Доступные сортируемые поля:
- `id`
- `created_at`
- `updated_at`
- `difficulty`
- `external_id`
- `theme_id`
- `question_type`

Пример:

```http
GET /api/questions?subject_slug=russkiy-yazyk&page=1&per_page=15&sort[difficulty]=desc&sort[id]=asc
Authorization: Bearer <token>
```

## Answers

| Метод | Endpoint | Auth | Описание |
|---|---|---|---|
| `POST` | `/answers` | Да | Отправка ответа на задачу |
| `GET` | `/answers/history` | Да | История ответов (limit/offset + фильтры) |
| `DELETE` | `/answers/history/<answer_id>` | Да | Удаление записи из истории с коррекцией статистики |
| `GET` | `/answers/stats` | Да | Агрегированная статистика ответов |

## Stats

| Метод | Endpoint | Auth | Описание |
|---|---|---|---|
| `GET` | `/stats` | Да | Общая статистика + активность за 7 дней |
| `GET` | `/stats/subjects` | Да | Статистика по предметам |
| `GET` | `/stats/subject/<subject_id>` | Да | Детальная статистика по предмету |
| `GET` | `/stats/theme/<theme_id>` | Да | Статистика по теме |
| `GET` | `/stats/streak` | Да | Дневной стрик |
| `GET` | `/stats/leaderboard` | Нет | Лидерборд |

## Health

| Метод | Endpoint | Auth | Описание |
|---|---|---|---|
| `GET` | `/health` | Нет | Health-check |

## Пример сценария через API

1. Зарегистрироваться
2. Получить `access_token`
3. Запросить предметы
4. Выбрать `subject_slug` и получить задачи
5. Отправить ответ
6. Проверить историю и статистику

Пример (упрощенно):

```bash
# Регистрация
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@example.com","password":"secret123"}'

# Логин
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"demo","password":"secret123"}'
```

Дальше используйте токен в заголовке:

```http
Authorization: Bearer <access_token>
```

## Docker

## Docker Compose (рекомендуется)

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Поднимаются сервисы:
- `app` (Flask API)
- `redis` (кэш)

Остановка:

```bash
docker compose down
```

## Docker image

```bash
docker build -t warkla:local .
docker run --rm -p 5000:5000 --env-file .env warkla:local
```

## CI/CD (GitHub Actions)

В репозитории есть workflow-файлы:

- `.github/workflows/ci-cd.yml`
  - backend lint/test
  - frontend build
  - deploy на `main` при наличии секретов

- `.github/workflows/frontend.yml`
  - frontend lint/build
  - отдельный frontend deploy

- `.github/workflows/docker.yml`
  - сборка и push Docker-образа в GHCR (`ghcr.io/sergejwinston/warkla`)

- `.github/workflows/build-deploy.yml`
  - legacy manual workflow (`workflow_dispatch`)

### Секреты для deploy

В зависимости от сценария используются:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KEY`
- `DEPLOY_PATH`
- `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_PORT` (legacy)
- `GH_PAT` (legacy deploy через GHCR)

## Тестирование

### Быстрая проверка сортировки

```bash
python test_sorting.py
```

### Pytest

```bash
pytest -v
```

### Линтинг backend

```bash
flake8 app
```

### Линтинг frontend

```bash
cd frontend
npm run lint
```

## Частые проблемы

### 1. Пустой список задач

Причина: локальный task-bank еще не синхронизирован.

Решение:
- подождать завершения фонового sync после старта
- либо вызвать `POST /api/subjects/sync` вручную

### 2. Redis не используется

Redis-кэш включается только если:
- `FLASK_ENV=production`
- пакет `redis` установлен
- `REDIS_URL` доступен

В `development` режиме кэш намеренно отключен.

### 3. Ошибки CORS

Проверьте `CORS_ORIGINS` в `.env`.

### 4. Проблемы с токеном/401

Проверьте:
- срок жизни JWT (`JWT_ACCESS_TOKEN_EXPIRES_DAYS`)
- корректность `JWT_SECRET_KEY`
- заголовок `Authorization: Bearer <token>`

## Production рекомендации

- Обязательно заменить `SECRET_KEY` и `JWT_SECRET_KEY`
- Ограничить `CORS_ORIGINS` конкретным доменом
- Использовать HTTPS (см. `deploy/nginx-docker.conf`)
- Не коммитить `.env` и файлы базы
- Мониторить логи и health-check

## Дополнительные документы

- `DEPLOYMENT.md` — заметки по развёртыванию
- `frontend/README.md` — frontend-часть отдельно
- `migrations/README.md` — базовые команды миграций
