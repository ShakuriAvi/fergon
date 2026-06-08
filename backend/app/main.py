"""FastAPI application factory and middleware/router wiring (#1).

Run locally with: ``uvicorn app.main:app --reload`` (from the ``backend`` dir).
"""
from __future__ import annotations

from fastapi import FastAPI

from app.api.routes import auth, health
from app.core.logging import setup_logging
from app.middleware.action_log import ActionLogMiddleware
from app.middleware.permissions import PermissionsMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    setup_logging()
    app = FastAPI(title="fergon")

    # Middleware added later wraps earlier ones (outermost runs first). We want:
    #   RequestLogging (outermost) -> ActionLog -> Permissions -> route.
    app.add_middleware(PermissionsMiddleware)
    app.add_middleware(ActionLogMiddleware)
    app.add_middleware(RequestLoggingMiddleware)

    app.include_router(health.router)
    app.include_router(auth.router)
    return app


app = create_app()
