# EGE-Bot Frontend

React/Vite приложение для подготовки к ЕГЭ. Веб-интерфейс к API бэкенда.

## Возможности

- 🔐 Регистрация и авторизация
- 📚 Выбор предмета и темы
- ❓ Решение вопросов (выбор, число, текст, множественный выбор)
- 📊 Статистика по предметам
- 🔥 Дневной стрик
- 🏆 Лидерборд
- 📋 История ответов

## Требования

- Node.js 16+
- npm или yarn

## Установка

```bash
cd frontend
npm install
```

## Разработка

```bash
npm run dev
```

Приложение будет доступно на `http://localhost:5173`

API запросы проксируются на `http://localhost:5000/api`

## Сборка

```bash
npm run build
npm run preview
```

## Структура проекта

```
src/
  components/       # React компоненты
  pages/            # Страницы приложения
  hooks/            # Custom React хуки
  lib/              # Утилиты (API клиент)
  App.jsx           # Главный компонент с маршрутизацией
  main.jsx          # Точка входа
  index.css         # Глобальные стили (TailwindCSS)
```

## API Интеграция

Используется `axios` для запросов. Все запросы автоматически получают JWT token из localStorage.

### Основные API методы:

- `authAPI.register()` - Регистрация
- `authAPI.login()` - Логин
- `subjectsAPI.getAll()` - Список предметов
- `questionsAPI.getRandom()` - Получить случайный вопрос
- `answersAPI.submit()` - Отправить ответ
- `statsAPI.getOverall()` - Общая статистика

## Стили

TailwindCSS для стилизации. Все компоненты используют утилиты Tailwind.

Конфиг файлы:
- `tailwind.config.cjs` - TailwindCSS конфиг
- `postcss.config.cjs` - PostCSS конфиг
- `vite.config.mjs` - Vite конфиг (ES модули)

## Деплой

### Автоматический деплой (GitHub Actions)

Фронтенд автоматически развертывается при Push в main:

```bash
git push origin main
# → GitHub Actions срабатывает (.github/workflows/frontend.yml)
# → npm run build
# → rsync dist/ на сервер
# → Nginx перезагружается
# ✅ Готово!
```

**Secrets для деплоя (в GitHub Settings → Secrets):**
- `DEPLOY_HOST` - IP адрес сервера
- `DEPLOY_USER` - SSH пользователь
- `DEPLOY_KEY` - SSH приватный ключ
- `DEPLOY_PATH` - Путь на сервере (например: `/opt/ege-bot`)

**Оптимизация:** Workflow срабатывает только если меняются файлы в папке `frontend/`

### Nginx конфиг (для сервера)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /opt/ege-bot/frontend/dist;
    index index.html;

    # SPA routing - всегда возвращай index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API проксирование на Flask бэкенд
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Ручной деплой

Собранные файлы из `dist/` можно развернуть на любом статического хостинга:

```bash
npm run build
# Загрузить содержимое папки dist/ на хостинг
```
