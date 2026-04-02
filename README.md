# EGE-Bot: Интерактивный помощник для подготовки к ЕГЭ

Веб-приложение + Flask API для подготовки школьников к ЕГЭ. Сервис генерирует вопросы по выбранному предмету, проверяет ответы, ведет статистику прогресса и объясняет ошибки.

## Основные возможности

- **Выбор предмета и темы** - Пользователь выбирает предмет (русский язык, математика, информатика, обществознание)
- **Генерация вопросов** - База готовых вопросов (загружается из NeoFamily API с кешированием)
- **Продвинутая сортировка** ⭐ - Множественная сортировка по различным полям (ID, сложность, дата и др.)
- **Разные типы вопросов** - выбор ответа, ввод числа, краткий текстовый ответ, множественный выбор
- **Проверка ответов** - Автоматическая проверка правильности с объяснением ошибок
- **Статистика и прогресс** - Процент правильных ответов по предметам и темам, визуализация графиков
- **Веб-приложение** - React/Vite приложение для подробной аналитики

## Технический стек

### Backend
- Flask, Flask-SQLAlchemy, Flask-JWT-Extended
- Redis для кеширования
- SQLite (по умолчанию)

### Frontend
- React/Vite
- TailwindCSS

### CI/CD
- GitHub Actions

## Локальный запуск

### Требования
- Python 3.11+
- pip
- Node.js 16+ (для фронтенда)

### Установка и запуск Backend

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/your-repo/ege-bot.git
cd ege-bot

# 2. Создайте виртуальную среду
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или на Windows:
# venv\Scripts\activate

# 3. Установите зависимости
pip install -r requirements.txt

# 4. Создайте .env
cp .env.example .env

# 5. Запустите приложение
python run.py flask
```

Приложение будет доступно на `http://localhost:5000`

### Установка и запуск Frontend

```bash
cd frontend

# 1. Установите зависимости
npm install

# 2. Запустите dev сервер
npm run dev
```

Фронтенд будет доступен на `http://localhost:5173`

### Запуск Backend

```bash
python run.py flask
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Логин
- `GET /api/auth/me` - Текущий пользователь (protected)

### Subjects & Themes
- `GET /api/subjects` - Список предметов
- `GET /api/subjects/<id>/themes` - Темы предмета
- `GET /api/subjects/<id>/progress` - Прогресс (protected)

### Questions
- `GET /api/questions?subject_slug=<slug>&theme_id=<id>` - Получить вопросы (protected)
  - **Поддержка сортировки**: `sort[field]=order` (множественные параметры)
  - Примеры:
    - `?subject_slug=russkiy-yazyk&sort[id]=asc` - по ID
    - `?subject_slug=russkiy-yazyk&sort[difficulty]=desc&sort[id]=asc` - по сложности и ID
    - `?subject_slug=russkiy-yazyk&theme_id=43&sort[created_at]=desc` - с фильтром
  - Доступные поля: `id`, `created_at`, `updated_at`, `difficulty`, `external_id`, `theme_id`, `question_type`
  - 📘 [Подробная документация по сортировке](SORTING.md)
- `GET /api/questions/<id>/solution` - Вопрос с ответом (protected)

### Answers
- `POST /api/answers` - Отправить ответ (protected)
- `GET /api/answers/history` - История ответов (protected)

### Statistics
- `GET /api/stats` - Общая статистика (protected)
- `GET /api/stats/subjects` - По предметам (protected)
- `GET /api/stats/streak` - Дневной стрик (protected)

## Веб-приложение (Frontend)

React/Vite приложение с полным функционалом:

### Страницы:
- **Login** - Регистрация и авторизация
- **Dashboard** - Главная панель с статистикой
- **Quiz** - Решение вопросов
- **Stats** - Подробная статистика по предметам
- **History** - История всех ответов с пагинацией
- **Leaderboard** - Таблица лучших игроков

### Компоненты:
- QuestionCard - Отображение вопроса и ввод ответа
- ResultCard - Результат проверки ответа
- SubjectSelector - Выбор предмета и темы
- ProtectedRoute - Защита маршрутов на основе аутентификации

Подробнее см. [Frontend README](./frontend/README.md)

## Docker

### Docker Compose (рекомендуется для быстрого старта)

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/your-repo/ege-bot.git
cd ege-bot

# 2. Создайте .env файл
cp .env.example .env

# 3. Запустите с Docker Compose (включает Redis)
docker-compose up -d

# 4. Проверьте логи
docker-compose logs -f app
```

Docker Compose запустит:
- **EGE-Bot приложение** (Flask API) на `http://localhost:5000`
- **Redis** для кеширования на `localhost:6379`

### Standalone Docker

```bash
# Сборка образа
docker build -t ege-bot .

# Запуск без Redis (для дебага)
docker run -p 5000:5000 ege-bot

# Запуск с Redis
docker run -p 5000:5000 \
  -e REDIS_URL=redis://redis:6379/0 \
  ege-bot
```

### Production Environment

Для production переменные окружения:
- `FLASK_ENV=production` - Включает Redis кеширование и оптимизации
- `REDIS_URL=redis://hostname:6379/0` - Подключение к Redis
- `JWT_SECRET_KEY=your-secret-key` - JWT токен

## CI/CD и Авторазвертка

### GitHub Actions Workflows

Проект поддерживает полностью автоматическую развертку с GitHub Actions:

**1. ci-cd.yml** - Backend CI/CD:
   - ✅ Линтер (flake8) для Python кода
   - ✅ Сборка фронтенда (Vite)
   - ✅ Тесты (если существуют)
   - ✅ Автоматическая развертка Backend на сервер
   - ✅ Реальная работа: собирает и развертывает backend + frontend

**2. frontend.yml** - Frontend только:
   - ✅ Линтер (ESLint, опционально)
   - ✅ Сборка Vite проекта
   - ✅ Проверка артефактов (dist/)
   - ✅ Деплой фронтенда на веб-сервер (Nginx)
   - ✅ Срабатывает: только при изменении файлов в `frontend/`

**3. docker.yml** - Docker образ:
   - ✅ Сборка Docker образа
   - ✅ Пуш в GitHub Container Registry (ghcr.io)
   - ✅ Кеширование слоев для быстрой сборки

### Как работает развертка

**На Push в main ветку:**
```
Автоматический цикл:
  1. Линтинг Backend (flake8)
  2. Сборка Frontend (npm run build)
  3. Запуск тестов
  4. SSH деплой на сервер
   5. Перезагрузка сервисов (Flask API + Nginx)
  ✅ Готово!
```

**Если меняются только файлы frontend/:**
```
Быстрый фронтенд-деплой:
  1. npm install
  2. npm run build → dist/
  3. rsync dist/ на сервер → Nginx
  ✅ Быстрый деплой без перестройки Backend!
```

### Настройка авторазвертки

1. **Добавьте Secrets в GitHub репозитории:**
   ```
   Settings → Secrets and variables → Actions → New repository secret
   ```

   Требуемые secrets:
   - `DEPLOY_HOST` - IP адрес сервера
   - `DEPLOY_USER` - SSH пользователь
   - `DEPLOY_KEY` - Приватный SSH ключ
   - `DEPLOY_PATH` - Путь на сервере (напр. `/opt/ege-bot`)

2. **Подготовка сервера:**
   ```bash
   # На сервере:
   mkdir -p /opt/ege-bot
   chmod 755 /opt/ege-bot

   # Создайте systemd сервис для ege-bot
   sudo nano /etc/systemd/system/ege-bot.service
   ```

3. **Systemd сервис (ege-bot.service):**
   ```ini
   [Unit]
   Description=EGE-Bot Service
   After=network.target

   [Service]
   Type=simple
   User=appuser
   WorkingDirectory=/opt/ege-bot
   Environment="PATH=/opt/ege-bot/venv/bin"
   ExecStart=/opt/ege-bot/venv/bin/python run.py flask
   Restart=always
   RestartSec=10
   StandardOutput=journal
   StandardError=journal

   [Install]
   WantedBy=multi-user.target
   ```

### Redis кеширование

Redis кеширование **автоматически включается в production** (`FLASK_ENV=production`):

- Кешируются вопросы из NeoFamily API на 24 часа
- Случайные вопросы кешируются на 1 час
- Кеширование опционально - работает если Redis доступен
- Для дебага Redis не требуется

Преимущества:
- ⚡ 10x более быстрое получение вопросов
- 📉 Снижение нагрузки на внешнее API
- 💾 Экономия трафика

## Лицензия

MIT License
