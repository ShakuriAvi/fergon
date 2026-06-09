"""Action-logging middleware (#9).

Persists **every user action — successful and failed —** to the ``actions_logs``
MySQL table via the centralized db layer. Unhandled exceptions and non-2xx
responses are caught here and stored with ``success = FALSE`` and error info in
``details``. A failure to write the log must never break the request.
"""
from __future__ import annotations

import functools
import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.db.action_log import insert_action_log

logger = logging.getLogger("fergon.action_log")

# Requests that are not user actions and should not produce an action-log row.
_EXCLUDED_PATHS: set[str] = {
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
}
_EXCLUDED_PREFIXES: tuple[str, ...] = ("/static",)


def _excluded(path: str) -> bool:
    if path in _EXCLUDED_PATHS:
        return True
    return any(path.startswith(prefix) for prefix in _EXCLUDED_PREFIXES)


def _action_name_for(request: Request) -> str:
    """Resolve the action label: explicit override wins, else method+path."""
    override = getattr(request.state, "action_name", None)
    if override:
        return override
    return f"{request.method} {request.url.path}"


def _persist(request: Request, *, status_code: int, success: bool,
             details: str | None, duration_ms: float) -> None:
    """Write one actions_logs row, swallowing any DB error."""
    user = getattr(request.state, "user", None) or {}
    try:
        insert_action_log(
            action_name=_action_name_for(request),
            user_id=user.get("id"),
            school_id=user.get("school_id"),
            page=request.headers.get("x-page"),
            http_method=request.method,
            path=request.url.path,
            status_code=status_code,
            success=success,
            details=details,
            ip_address=request.client.host if request.client else None,
            duration_ms=round(duration_ms, 2),
        )
    except Exception:  # a logging failure must not break the request
        logger.exception("failed to persist action log for %s", request.url.path)


class ActionLogMiddleware(BaseHTTPMiddleware):
    """Persist one actions_logs row per user request.

    ``dispatch`` is ``async`` only because Starlette's middleware contract
    requires it; all business/DB work is delegated to the synchronous
    ``_persist`` helper (no ``async``/``await``/threadpool in our own logic).
    """

    async def dispatch(self, request: Request, call_next):
        if _excluded(request.url.path):
            return await call_next(request)

        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start) * 1000
            _persist(
                request,
                status_code=500,
                success=False,
                details=f"{type(exc).__name__}: {exc}",
                duration_ms=duration_ms,
            )
            raise

        duration_ms = (time.perf_counter() - start) * 1000
        success = response.status_code < 400
        details = None if success else f"HTTP {response.status_code}"
        _persist(
            request,
            status_code=response.status_code,
            success=success,
            details=details,
            duration_ms=duration_ms,
        )
        return response


def log_action_name(name: str):
    """Decorator to explicitly label the action for an endpoint.

    Usage::

        @router.post("/book")
        @log_action_name("book")
        def book(request: Request, ...):
            ...

    The endpoint must accept the ``request`` so the middleware can read the label
    set on ``request.state``.
    """

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            request = kwargs.get("request")
            if request is None:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            if request is not None:
                request.state.action_name = name
            return func(*args, **kwargs)

        return wrapper

    return decorator
