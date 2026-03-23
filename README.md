# Warkla

Warkla - это веб-приложение для учета личных финансов: доходы/расходы, дашборд бюджета, аналитика, история операций, достижения и профиль пользователя.

## Возможности

- Регистрация и вход по JWT
- Добавление, просмотр и удаление транзакций
- Загрузка чеков к транзакциям (jpg/jpeg/png/webp)
- Дашборд: баланс, безопасный лимит на день, прогноз до конца месяца
- Аналитика: категории, таймлайн, статистика, сравнение периодов, аномалии
- Достижения с прогрессом
- Профиль: имя, день стипендии, аватар
- Web UI на чистом HTML/CSS/JS (без отдельного frontend-сервера)

## Технологии

- Python 3.10+
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- SQLite (по умолчанию)

## Быстрый старт

1. Клонируйте репозиторий и перейдите в папку проекта.
2. Создайте и активируйте виртуальное окружение.
3. Установите зависимости.
4. Запустите приложение.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

После запуска приложение будет доступно по адресу:

- http://localhost:5000

Страницы:

- `/` - основное приложение
- `/login` - вход
- `/register` - регистрация

## Переменные окружения

Можно задать через `.env` или переменные окружения системы.

| Переменная | По умолчанию | Описание |
| --- | --- | --- |
| `FLASK_ENV` | `development` | Режим конфигурации (`development`/`testing`) |
| `SECRET_KEY` | `dev-secret-key` | Flask secret key |
| `JWT_SECRET_KEY` | `dev-jwt-secret` | Ключ подписи JWT |
| `JWT_ACCESS_TOKEN_EXPIRES_DAYS` | `30` | Срок жизни access token в днях |
| `DATABASE_URL` | `sqlite:///.../warkla.db` | URL базы данных SQLAlchemy |
| `CORS_ORIGINS` | `*` | CORS для `/api/*` |
| `UPLOAD_FOLDER` | `uploads` | Каталог для загрузок (чеки, аватары) |
| `MAX_CONTENT_LENGTH` | `5242880` | Максимальный размер файла в байтах (по умолчанию 5MB) |

Пример `.env`:

```env
FLASK_ENV=development
SECRET_KEY=change-me
JWT_SECRET_KEY=change-me-too
JWT_ACCESS_TOKEN_EXPIRES_DAYS=30
DATABASE_URL=sqlite:///warkla.db
CORS_ORIGINS=*
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=5242880
```

## API (кратко)

Базовые префиксы:

- `/api/auth`
- `/api/transactions`
- `/api/dashboard`
- `/api/analytics/*`
- `/api/achievements`
- `/api/profile`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Transactions

- `POST /api/transactions`
- `GET /api/transactions`
- `GET /api/transactions/<id>`
- `DELETE /api/transactions/<id>`
- `POST /api/transactions/<id>/receipt`
- `GET /api/transactions/<id>/receipt`

### Dashboard и Analytics

- `GET /api/dashboard`
- `GET /api/analytics/categories`
- `GET /api/analytics/timeline`
- `GET /api/analytics/forecast`
- `GET /api/analytics/sources`
- `GET /api/analytics/stats`
- `GET /api/analytics/comparison?period=week|month|quarter`
- `GET /api/analytics/category/<category>/timeline`
- `GET /api/analytics/anomalies?lookback=90`

### Achievements

- `GET /api/achievements`

### Profile

- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/profile/avatar`

## Авторизация

Большинство API (кроме `/api/auth/*`) требуют JWT:

```http
Authorization: Bearer <access_token>
```

Токен возвращается в ответах `register` и `login`.

## Миграции и БД

- При старте приложения вызывается `db.create_all()` и сидирование достижений.
- Папка `migrations/` присутствует и может использоваться для Flask-Migrate.

Пример команд миграций:

```bash
flask db init
flask db migrate -m "init"
flask db upgrade
```

## Структура проекта

```text
app/
  routes/        # REST endpoints
  services/      # бизнес-логика аналитики/достижений
  models.py      # SQLAlchemy модели
  config.py      # конфигурация
  __init__.py    # app factory + регистрация blueprint
web/             # статический frontend (HTML/CSS/JS)
uploads/         # загруженные файлы пользователей
migrations/      # миграции БД
run.py           # точка запуска
requirements.txt # зависимости
```

## Полезно для разработки

- Максимальный `per_page` для списка транзакций: `100`.
- Поддерживаемые форматы файлов: `.jpg`, `.jpeg`, `.png`, `.webp`.
- В тестовом режиме используется in-memory SQLite (`sqlite:///:memory:`).

## Лицензия

Добавьте информацию о лицензии при необходимости.
