# EGE-Bot - Тестирование и Развертка

## 🧪 Локальное Тестирование

### 1. Подготовка

```bash
cd c:/Users/Sergej\ Nekrasov/Projects/warkla

# Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
cd ..
```

### 2. Запуск Backend

**Терминал 1 - Flask API:**
```bash
python run.py flask
# → Flask запустится на http://localhost:5000
```

### 3. Запуск Frontend

**Терминал 3:**
```bash
cd frontend
npm run dev
# → Vite на http://localhost:5173
# → Проксирует /api на http://localhost:5000
```

### 4. Проверка

#### API Health Check:
```bash
curl http://localhost:5000/api/health
# {"status":"ok"}
```

#### Frontend:
- Открой http://localhost:5173
- Ты увидишь Login страницу
- Зарегистрируйся
- Выбери предмет → тему → решай вопросы

---

## 🐳 Docker Testing

### Полный стек с Redis:
```bash
docker-compose up -d

# Проверить статус:
docker-compose ps

# Логи:
docker-compose logs -f app

# Остановить:
docker-compose down
```

**Доступно на:**
- API: http://localhost:5000
- Frontend: http://localhost:3000 (если настроен)

---

## 🚀 Production Deployment

### На Linux сервере:

```bash
# 1. SSH на сервер
ssh user@your-server.com

# 2. Подготовь окружение
mkdir -p /opt/ege-bot
cd /opt/ege-bot

# 3. Клонируй репо
git clone https://github.com/your-user/ege-bot.git .

# 4. Backend окружение
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Frontend сборка
cd frontend
npm install
npm run build
cd ..

# 6. Создай systemd сервис
sudo tee /etc/systemd/system/ege-bot.service > /dev/null <<EOF
[Unit]
Description=EGE-Bot Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ege-bot
Environment="PATH=/opt/ege-bot/venv/bin"
Environment="FLASK_ENV=production"
Environment="REDIS_URL=redis://localhost:6379/0"
ExecStart=/opt/ege-bot/venv/bin/python run.py flask
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 7. Запусти сервис
sudo systemctl daemon-reload
sudo systemctl enable ege-bot
sudo systemctl start ege-bot
sudo systemctl status ege-bot

# 8. Настрой Nginx
sudo tee /etc/nginx/sites-available/ege-bot > /dev/null <<'NGINX'
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /opt/ege-bot/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

# 9. Включи сайт
sudo ln -s /etc/nginx/sites-available/ege-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. Проверь статус
systemctl status ege-bot
curl http://localhost:5000/api/health
```

---

## 🔄 Обновления (GitHub Actions)

После настройки Secrets в GitHub:

```bash
# Просто push в main
git push origin main

# GitHub Actions автоматически:
# 1. Проверит код (flake8)
# 2. Соберет фронтенд (npm)
# 3. Запустит тесты
# 4. Разверется на сервер (SSH/rsync)
# 5. Перезагрузит сервисы

# Проверь статус в GitHub Actions
# Settings → Actions → Workflow runs
```

---

## 🔧 Troubleshooting

### Vite предупреждение про "#":
```
(!) Could not auto-determine entry point...
```
✅ Исправлено - temp файлы удалены

### PostCSS ошибка:
```
ReferenceError: module is not defined
```
✅ Исправлено - переименованы в `.cjs`

### Redis не подключается:
```
# Для дебага Redis не требуется
FLASK_ENV=development python run.py

# Для production убедись Redis работает
redis-cli ping
# PONG
```

## ✅ Чек-лист перед deployment

- [ ] `.env` с валидными токенами
- [ ] `requirements.txt` установлены
- [ ] `npm install && npm run build` работает
- [ ] `python run.py flask` работает
- [ ] `http://localhost:5000/api/health` возвращает 200
- [ ] Frontend на http://localhost:5173 работает
- [ ] Можешь залогиниться и решать вопросы
- [ ] GitHub Secrets настроены (DEPLOY_HOST, DEPLOY_USER и т.д.)
- [ ] Nginx конфиг готов
- [ ] systemd сервис готов

---

## 📊 Мониторинг

### Проверить логи сервиса:
```bash
sudo journalctl -u ege-bot -f
```

### Проверить Redis caching:
```bash
redis-cli
> KEYS questions:*
> GET questions:neofamily:russkiy-yazyk:1:50
> INFO MEMORY
```

### Статистика API:
```bash
curl http://localhost:5000/api/questions/count \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 🎉 После успешного deployment

- Поздравляем! 🚀
- Проверь http://your-domain.com → должна открыться история
- Попробуй залогиниться → решать вопросы → проверь статистику
- Тестируй на разных устройствах (мобильная адаптивность)

