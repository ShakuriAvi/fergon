FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as an unprivileged user (do not run the app as root).
RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser

# Cloud Run injects $PORT (default 8080) and requires the container to listen
# on it; local docker-compose overrides this CMD directly, so 8000 stays the
# default for a plain `docker run` unless overridden at build time. Shell form
# so $PORT expands at container start rather than build time.
ARG PORT=8000
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
