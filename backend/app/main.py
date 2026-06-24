"""FastAPI application factory and middleware/router wiring (#1).

Run locally with: ``uvicorn app.main:app --reload`` (from the ``backend`` dir).
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import admin, auth, consumer, dev_auth, health
from app.core.config import init_settings
from app.core.logging import setup_logging
from app.core.rate_limit import limiter
from app.db.session import init_engine
from app.middleware.action_log import ActionLogMiddleware
from app.middleware.permissions import PermissionsMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    # Build the settings singleton once, here at app setup.
    settings = init_settings()
    setup_logging()
    # Build the ORM engine + session factory once (lazy; no connection yet).
    init_engine()

    # TEMPORARY/DEV (#40): auto-seed the DB on startup in dev so the app has
    # real data to drive the full flow. Idempotent + dev-gated; a failure here
    # (e.g. DB not ready) must never block startup.
    if settings.APP_ENV.lower() == "dev":
        try:
            from app.seed import seed_all

            seed_all()
        except Exception:  # pragma: no cover - best-effort dev convenience
            import logging

            logging.getLogger("fergon.seed").warning(
                "dev auto-seed failed (continuing)", exc_info=True
            )

    # Interactive API docs leak the full surface area; expose them in dev only.
    docs_enabled = settings.APP_ENV.lower() == "dev"
    app = FastAPI(
        title="fergon",
        docs_url="/docs" if docs_enabled else None,
        redoc_url="/redoc" if docs_enabled else None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )

    # Expose the singleton on app.state for convenience.
    app.state.settings = settings

    # Rate limiting: register the shared limiter and the 429 handler so the
    # @limiter.limit decorators on auth routes are enforced.
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Middleware added later wraps earlier ones (outermost runs first). We want:
    #   SecurityHeaders (outermost) -> RequestLogging -> ActionLog -> Permissions.
    app.add_middleware(PermissionsMiddleware)
    app.add_middleware(ActionLogMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    # CORS added last → outermost, so browser preflight (OPTIONS) is answered
    # before auth/permission middleware. Required for the SPA → API calls.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(admin.router)
    app.include_router(consumer.router)
    # TEMPORARY (#39): dev-only email login; inert (404) outside APP_ENV=dev.
    app.include_router(dev_auth.router)
    return app


# Module-level instance so ``uvicorn app.main:app`` (and reload, which re-imports
# by string) can find it.
app = create_app()


if __name__ == "__main__":
    import uvicorn

    # Local dev runner only. Host/port come from settings (env-overridable) and
    # auto-reload is enabled only in the dev environment.
    settings = init_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.APP_ENV.lower() == "dev",
    )
