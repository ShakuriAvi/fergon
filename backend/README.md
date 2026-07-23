# fergoni backend

FastAPI backend for **פירגוני** following a View & Service architecture with a
centralized raw-SQL DB layer (no ORM), structured JSON logging, Google OAuth, and
an action-logging audit trail.

## Layout

```
app/
  main.py            # create_app() factory + middleware/router wiring
  api/routes/        # Views: HTTP/auth/validation only
  services/          # Business logic
  db/                # Centralized DB layer (context manager + raw SQL)
  schemas/           # Pydantic request/response models
  core/              # config, logging, security
  middleware/        # request logging, permissions, action logging
  translations/      # English-key -> Hebrew JSON for API responses
alembic/             # Hand-written SQL migrations (dev -> prod sync)
tests/               # pytest suite
```

## Run with Docker

```bash
cp backend/.env.example backend/.env   # optional for local non-docker runs
docker compose up --build
# API on http://localhost:8000 ; GET /health -> {"status":"ok"}
```

`docker compose up` runs `alembic upgrade head` against MySQL, then starts the API.

## Run locally (without Docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head           # requires a reachable MySQL
uvicorn app.main:app --reload
```

## Migrations (Alembic)

The DB URL is sourced from application settings (`Settings.database_url`), not
from `alembic.ini`. Migrations are hand-written SQL (no ORM autogenerate).

```bash
alembic upgrade head           # apply migrations
alembic downgrade -1           # roll back one
alembic revision -m "message"  # create a new (hand-edited) migration
```

## Tests

```bash
cd backend
pytest
```

Tests mock MySQL and Google, so no live services are required.

## Environments

`APP_ENV=dev` reads `backend/.env`. `APP_ENV=prod` ignores `.env` entirely and
reads configuration from the process environment, with secrets injected by
Google Cloud Secret Manager.
