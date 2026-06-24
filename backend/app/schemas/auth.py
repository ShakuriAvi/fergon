"""Pydantic schemas for authentication flows."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr

from app.schemas.user import UserRead


class Token(BaseModel):
    """Issued access token returned on login / registration."""

    access_token: str
    token_type: str = "bearer"
    user: UserRead


class DevLoginRequest(BaseModel):
    """TEMPORARY (#39): payload for the dev-only email login. Remove at the
    Google OAuth cutover."""

    email: EmailStr
