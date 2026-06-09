"""JWT issuing/verification and the ``get_current_user`` dependency."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Header, HTTPException, status

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


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    """FastAPI dependency that resolves the current user from the Bearer token."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="auth.missing_token",
        )
    token = authorization.split(" ", 1)[1].strip()
    payload = decode_token(token)
    return {
        "id": int(payload["sub"]),
        "role": payload.get("role"),
        "school_id": payload.get("school_id"),
    }
