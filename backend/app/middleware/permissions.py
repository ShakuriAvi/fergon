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

from app.core.auth_cookies import (
    ACCESS_COOKIE,
    CSRF_COOKIE,
    CSRF_HEADER,
    UNSAFE_METHODS,
    csrf_token_valid,
)
from app.core.config import get_settings
from app.core.logging import store_log
from app.core.security import get_current_user
from app.db import users as users_db
from app.schemas.role import AccessLevel
from app.schemas.user import Role
from app.translations.translator import t

logger = logging.getLogger("fergon.permissions")

# Routes reachable without authentication.
PUBLIC_PATHS: set[str] = {
    "/health",
    "/auth/google/login",
    "/auth/google/callback",
    "/auth/register",
    "/auth/dev-login",  # TEMPORARY (#39): dev-only email login
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
    """Authenticate requests and attach the resolved user to request.state.

    ``dispatch`` is ``async`` only because Starlette's middleware contract
    requires it; the DB lookup it performs uses the synchronous db layer
    directly (no ``async``/``await``/threadpool in our own logic).
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if _is_public(path):
            return await call_next(request)

        # Two transports carry the JWT: the ``Authorization: Bearer`` header
        # (native/mobile) or the HttpOnly ``access_token`` cookie (web SPA). The
        # header takes precedence so an explicit Bearer call is never overridden
        # by a stale cookie.
        authorization = request.headers.get("authorization")
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1].strip()
            via_cookie = False
        else:
            token = request.cookies.get(ACCESS_COOKIE)
            via_cookie = bool(token)

        if not token:
            store_log(
                "permission_denied",
                level=logging.WARNING,
                details=f"unauthenticated access to {path}",
                path=path,
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": t("permissions.unauthenticated")},
            )

        # CSRF: cookie auth is ambient, so a cross-site page could trigger a
        # state-changing request with the user's cookie attached. Require the
        # double-submit token on unsafe methods. Header (Bearer) auth is immune
        # (a browser cannot set a custom header cross-site) so it is exempt.
        if via_cookie and request.method in UNSAFE_METHODS:
            if not csrf_token_valid(
                cookie_value=request.cookies.get(CSRF_COOKIE),
                header_value=request.headers.get(CSRF_HEADER),
            ):
                store_log(
                    "permission_denied",
                    level=logging.WARNING,
                    details=f"missing/invalid CSRF token for {path}",
                    path=path,
                )
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": t("permissions.csrf")},
                )

        settings = get_settings()
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.PyJWTError:
            store_log(
                "permission_denied",
                level=logging.WARNING,
                details=f"invalid token for {path}",
                path=path,
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": t("auth.invalid_token")},
            )

        # A valid token is not enough: the account must still exist and be
        # active. This revokes access immediately when a user is deactivated
        # (soft-deleted via is_active=0), rather than waiting for token expiry.
        user_id = int(payload["sub"])
        db_user = users_db.get_user_by_id(user_id)
        if db_user is None or not db_user.get("is_active", False):
            store_log(
                "permission_denied",
                level=logging.WARNING,
                user_id=user_id,
                details=f"inactive or unknown user for {path}",
                path=path,
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": t("auth.invalid_token")},
            )

        request.state.user = {
            "id": user_id,
            "role": db_user.get("role") or payload.get("role"),
            "access_level": db_user.get("access_level") or payload.get("access_level"),
            "organization_id": db_user.get("organization_id"),
            "school_id": payload.get("school_id"),
        }
        return await call_next(request)


def require_roles(*roles: Role | str) -> Callable:
    """Dependency factory enforcing that the current user has one of ``roles``."""
    allowed = {r.value if isinstance(r, Role) else r for r in roles}

    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in allowed:
            store_log(
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


def require_access_level(*levels: AccessLevel | str) -> Callable:
    """Dependency factory enforcing the current user's role ``access_level``.

    Complements ``require_roles`` for the data-driven roles table (#20): instead
    of naming specific roles, an endpoint can require an access tier
    (``admin`` / ``manager`` / ``member``).
    """
    allowed = {a.value if isinstance(a, AccessLevel) else a for a in levels}

    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user.get("access_level") not in allowed:
            store_log(
                "permission_denied",
                level=logging.WARNING,
                user_id=user.get("id"),
                details=f"access_level {user.get('access_level')} not in {sorted(allowed)}",
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=t("permissions.forbidden"),
            )
        return user

    return checker
