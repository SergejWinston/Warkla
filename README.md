# Warkla

Тема проекта: трекер расхода денег для студента.

Warkla - это MVP веб-сервис для учета личных финансов, который помогает дожить от стипендии до стипендии без долгов: фиксирует доходы/расходы, прогнозирует остаток бюджета, показывает финансовые риски и добавляет мотивацию через достижения.

## 1. Цель и сценарий использования

Пользователь ежедневно вносит транзакции:
- доходы: стипендия, работа, подработка, помощь родителей;
- расходы: еда, транспорт, развлечения, учеба, связь и т.д.

Сервис рассчитывает:
- текущий баланс;
- безопасный лимит на сегодня;
- дни до следующей стипендии;
- прогноз на конец месяца;
- предупреждения о риске финансовой ямы.

## 2. Соответствие требованиям задания

1. Учет доходов/расходов
- Реализовано добавление доходов с источником, датой, валютой.
- Реализовано добавление расходов с категорией, датой, заметкой, флагом скидки.

2. Прогнозирование и аналитика
- Реализован прогноз остатка на конец месяца.
- Реализованы данные для круговой диаграммы расходов по категориям.
- Реализованы данные для линейного графика динамики баланса.

3. Геймификация и уведомления
- Реализована система достижений с прогрессом.
- Реализованы статусные бюджетные предупреждения (danger/warning/info/success) и текстовые подсказки.

4. Дашборд «Финансовое здоровье»
- Текущий баланс.
- Дней до стипендии.
- Сколько можно потратить сегодня.
- Прогноз на конец месяца (успех/риск).

5. Инспектор транзакций
- Лента операций с фильтрацией по дате, категории и типу.
- Детали операции по ID.
- Загрузка и просмотр фото чека.

## 3. Технический стек

- Backend: Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Flask-Cors.
- Frontend: HTML/CSS/JavaScript (статическая SPA-подобная клиентская часть без отдельного node-сервера).
- БД: SQLite по умолчанию (можно переопределить через `DATABASE_URL`).
- Отчеты: CSV и PDF (reportlab).
- Runtime: Python 3.11+, Gunicorn (в Docker).
- CI/CD: Автоматический билд проекта и деплой на warkla.ru

## 4. Архитектура

- `app/__init__.py`: app factory, конфигурация, инициализация расширений, регистрация blueprints, глобальные обработчики ошибок.
- `app/models.py`: модели `User`, `Transaction`, `Achievement`, `UserAchievement`, `UserProfile`.
- `app/routes/*`: REST API (auth, transactions, dashboard/analytics, achievements, profile).
- `app/services/*`: аналитика, бюджетные метрики, логика достижений.
- `web/*`: клиентские страницы и JS-логика.

При старте приложения:
- создаются таблицы (`db.create_all()`),
- выполняется сидирование достижений,
- применяется защитная донастройка схемы для поля `currency` в `transactions`.

## 5. Структура репозитория

```text
app/
  routes/
  services/
  config.py
  extensions.py
  models.py
  __init__.py
web/
  index.html
  login.html
  register.html
  app.js
  styles.css
migrations/
deploy/
uploads/
run.py
requirements.txt
Dockerfile
```

## 6. Локальный запуск

### 6.1 Требования

- Linux/macOS/WSL
- Python 3.11+
- pip

### 6.2 Установка и старт

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

Приложение будет доступно на `http://localhost:5000`.

Основные страницы:
- `/` - приложение;
- `/login` - вход;
- `/register` - регистрация;
- `/how_build` - описание сборки/архитектуры.

## 7. Запуск в Docker

```bash
docker build -t warkla:latest .
docker run --rm -p 5000:5000 --name warkla warkla:latest
```

Контейнер стартует через Gunicorn (`run:app`) и слушает порт `5000`.

## 8. Конфигурация окружения

Поддерживается настройка через системные переменные или `.env`.

| Переменная | Значение по умолчанию | Назначение |
| --- | --- | --- |
| `FLASK_ENV` | `development` | Профиль конфигурации (`development` / `testing`) |
| `SECRET_KEY` | `dev-secret-key` | Секрет Flask-сессий |
| `JWT_SECRET_KEY` | `dev-jwt-secret` | Секрет подписи JWT |
| `JWT_ACCESS_TOKEN_EXPIRES_DAYS` | `30` | TTL access token (дни) |
| `DATABASE_URL` | `sqlite:///.../warkla.db` | SQLAlchemy DSN |
| `CORS_ORIGINS` | `*` | Разрешенные origin для `/api/*` |
| `UPLOAD_FOLDER` | `uploads` | Хранилище чеков и аватаров |
| `MAX_CONTENT_LENGTH` | `5242880` | Максимальный размер upload (байт) |

Пример:

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

## 9. REST API

Базовые группы:
- `/api/auth`
- `/api/transactions`
- `/api/dashboard`
- `/api/analytics/*`
- `/api/achievements`
- `/api/profile`

### 9.1 Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

Ответ содержит `access_token`.

### 9.2 Transactions

- `POST /api/transactions` - создать транзакцию.
- `GET /api/transactions` - список с пагинацией (`page`, `per_page<=100`) и фильтрами (`date_from`, `date_to`, `category`, `type`).
- `GET /api/transactions/<id>` - детальная карточка.
- `PATCH /api/transactions/<id>` - обновление.
- `DELETE /api/transactions/<id>` - удаление.
- `POST /api/transactions/<id>/receipt` - загрузка чека.
- `GET /api/transactions/<id>/receipt` - просмотр чека.
- `GET /api/transactions/export?format=csv|pdf` - экспорт.

Ограничения:
- `type`: `income` или `expense`.
- `currency`: `RUB` или `USD`.
- Для `expense` обязательна корректная категория: `food`, `transport`, `entertainment`, `study`, `communication`, `health`, `housing`, `other`.
- Чеки: `jpg/jpeg/png/webp`.

### 9.3 Dashboard и Analytics

- `GET /api/dashboard`
- `GET /api/analytics/categories`
- `GET /api/analytics/timeline`
- `GET /api/analytics/forecast`
- `GET /api/analytics/sources`
- `GET /api/analytics/stats`
- `GET /api/analytics/comparison?period=week|month|quarter`
- `GET /api/analytics/category/<category>/timeline`
- `GET /api/analytics/anomalies?lookback=90`

### 9.4 Achievements

- `GET /api/achievements`

### 9.5 Profile

- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/profile/avatar`

## 10. Авторизация

Все API, кроме `POST /api/auth/register` и `POST /api/auth/login`, требуют JWT:

```http
Authorization: Bearer <access_token>
```

## 11. Примеры запросов (curl)

Регистрация:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","email":"student1@example.com","password":"123456"}'
```

Логин:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@example.com","password":"123456"}'
```

Создание расхода:

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"type":"expense","amount":450,"currency":"RUB","category":"food","date":"2026-03-24","note":"Обед"}'
```

Дашборд:

```bash
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer <TOKEN>"
```

## 12. База данных и миграции

- По умолчанию используется SQLite файл `warkla.db` в корне проекта.
- Для управляемых изменений схемы используется Flask-Migrate (Alembic).

Пример:

```bash
flask db migrate -m "add new field"
flask db upgrade
```

Важно: в проекте уже есть рабочий каталог `migrations/`.

## 13. Что предоставить жюри

1. Рабочий прототип
- Запущенный сервис по локальному URL или на хостинге.

2. Исходный код
- Репозиторий с коммитами и инструкцией запуска.

3. Краткая документация
- Данный README (архитектура, запуск, API, конфигурация, ограничения).

## 14. Дорожная карта (следующий шаг)

- Telegram-бот как дополнительный интерфейс ввода транзакций.
- Push/чат-уведомления с персонализацией.
- Расширение валют и динамические курсы.
- Тесты (unit/integration/e2e) и CI-пайплайн.
