# ── Build stage ───────────────────────────────────────────
FROM python:3.11-slim AS base

WORKDIR /app

# Install system deps needed by mysqlclient / bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libssl-dev default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# ── Runtime ────────────────────────────────────────────────
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
