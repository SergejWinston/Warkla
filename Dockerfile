FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

COPY . .

RUN mkdir -p /app/uploads /app/instance

EXPOSE 5000

# Health check for Docker
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Run both Flask API (with gunicorn) and Telegram Bot
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 'app:create_app()' & python -c 'from bot.main import start_bot; import asyncio; asyncio.run(start_bot())' & wait"]
