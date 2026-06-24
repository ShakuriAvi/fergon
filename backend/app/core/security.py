"""JWT issuing/verification and the ``get_current_user`` dependency."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import HTTPException, status
from starlette.requests import Request

from app.core.auth_cookies import ACCESS_COOKIE
from app.core.config import get_settings


def create_access_token(*, user_id: int, role: str, **claims: Any) -> str:
    """Issue a signed JWT carrying the user id and role."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)).timestamp()),
        **claims,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT, raising 401 on any failure."""
    settings = get_settings()
    try:
        return jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
    except jwt.PyJWTError as exc:  # invalid signature, expired, malformed, ...
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="auth.invalid_token",
        ) from exc


def get_current_user(request: Request) -> dict[str, Any]:
    """FastAPI dependency resolving the current user.

    In the running app ``PermissionsMiddleware`` has already authenticated the
    request (validating the token *and* that the account is still active) and
    attached the user to ``request.state.user`` — prefer that. As a fallback
    (e.g. unit tests that mount a router without the middleware) resolve the JWT
    directly from the ``Authorization: Bearer`` header or the ``access_token``
    cookie, so both transports work everywhere.
    """
    state_user = getattr(request.state, "user", None)
    if state_user:
        return state_user

    authorization = request.headers.get("authorization")
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    else:
        token = request.cookies.get(ACCESS_COOKIE)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="auth.missing_token",
        )
    payload = decode_token(token)
    return {
        "id": int(payload["sub"]),
        "role": payload.get("role"),
        "access_level": payload.get("access_level"),
        "organization_id": payload.get("organization_id"),
        "school_id": payload.get("school_id"),
    }
