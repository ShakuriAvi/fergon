"""Request-logging middleware (#6).

Logs every incoming request with method, path, status code, duration and the
user identifiers (``user_id`` and ``school_id``) in the required JSON format.
"""
from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.logging import log_action

logger = logging.getLogger("fergon.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            user = getattr(request.state, "user", None) or {}
            log_action(
                "http_request",
                level=logging.ERROR,
                user_id=user.get("id"),
                school_id=user.get("school_id"),
                details="unhandled exception",
                method=request.method,
                path=request.url.path,
                status_code=500,
                duration_ms=round(duration_ms, 2),
            )
            raise

        duration_ms = (time.perf_counter() - start) * 1000
        user = getattr(request.state, "user", None) or {}
        level = logging.INFO if response.status_code < 400 else logging.WARNING
        log_action(
            "http_request",
            level=level,
            user_id=user.get("id"),
            school_id=user.get("school_id"),
            details=f"{request.method} {request.url.path} -> {response.status_code}",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )
        return response
