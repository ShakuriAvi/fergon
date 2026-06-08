"""Pydantic schemas for authentication flows."""
from __future__ import annotations

from pydantic import BaseModel

from app.schemas.user import UserRead


class Token(BaseModel):
    """Issued access token returned on login / registration."""

    access_token: str
    token_type: str = "bearer"
    user: UserRead
