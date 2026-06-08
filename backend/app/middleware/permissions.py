"""Permission enforcement (#8).

Two complementary mechanisms:

* ``PermissionsMiddleware`` resolves the current user from the Bearer token,
  attaches it to ``request.state.user``, and rejects unauthenticated access to
  non-public routes (401). Public routes are explicitly allowlisted.
* ``require_roles(...)`` is a per-route dependency declaring which roles may
  access an endpoint, returning 403 for an authenticated-but-unauthorized user.
"""
from __future__ import annotations

import logging
from typing import Callable

import jwt
from fastapi import Depends, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import log_action
from app.core.security import get_current_user
from app.schemas.user import Role
from app.translations.translator import t

logger = logging.getLogger("fergon.permissions")

# Routes reachable without authentication.
PUBLIC_PATHS: set[str] = {
    "/health",
    "/auth/google/login",
    "/auth/google/callback",
    "/auth/register",
    "/docs",
    "/redoc",
    "/openapi.json",
}
PUBLIC_PREFIXES: tuple[str, ...] = ("/static",)


def _is_public(path: str) -> bool:
    if path in PUBLIC_PATHS:
        return True
    return any(path.startswith(prefix) for prefix in PUBLIC_PREFIXES)


class PermissionsMiddleware(BaseHTTPMiddleware):
    """Authenticate requests and attach the resolved user to request.state."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if _is_public(path):
            return await call_next(request)

        authorization = request.headers.get("authorization")
        if not authorization or not authorization.lower().startswith("bearer "):
            log_action(
                "permission_denied",
                level=logging.WARNING,
                details=f"unauthenticated access to {path}",
                path=path,
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": t("permissions.unauthenticated")},
            )

        settings = get_settings()
        token = authorization.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.PyJWTError:
            log_action(
                "permission_denied",
                level=logging.WARNING,
                details=f"invalid token for {path}",
                path=path,
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": t("auth.invalid_token")},
            )

        request.state.user = {
            "id": int(payload["sub"]),
            "role": payload.get("role"),
            "school_id": payload.get("school_id"),
        }
        return await call_next(request)


def require_roles(*roles: Role | str) -> Callable:
    """Dependency factory enforcing that the current user has one of ``roles``."""
    allowed = {r.value if isinstance(r, Role) else r for r in roles}

    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed:
            log_action(
                "permission_denied",
                level=logging.WARNING,
                user_id=user.get("id"),
                details=f"role {user.get('role')} not in {sorted(allowed)}",
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=t("permissions.forbidden"),
            )
        return user

    return checker
