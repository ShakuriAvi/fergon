"""FastAPI application factory and middleware/router wiring (#1).

Run locally with: ``uvicorn app.main:app --reload`` (from the ``backend`` dir).
"""
from __future__ import annotations

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import auth, health
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

    app.include_router(health.router)
    app.include_router(auth.router)
    return app


# Module-level instance so ``uvicorn app.main:app`` (and reload, which re-imports
# by string) can find it.
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

