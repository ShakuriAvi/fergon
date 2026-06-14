"""Pydantic schemas for the User resource and the role enumeration."""
from __future__ import annotations

import enum
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class Role(str, enum.Enum):
    """The four roles supported by the system."""

    ADMIN = "admin"
    PRINCIPAL = "principal"
    TEACHER = "teacher"
    SECRETARY = "secretary"


# Tuple of the valid role values, reused for DB constraints and validation.
ROLE_VALUES = tuple(r.value for r in Role)


class UserCreate(BaseModel):
    """Payload to register a new user."""

    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    role: Role = Role.TEACHER
    organization_id: int | None = None
    oauth_id: str | None = None


class UserRead(BaseModel):
    """User representation returned to the frontend.

    ``role`` is the role *name* (resolved from the ``roles`` table); it is a plain
    string so newer roles (student, server, …) beyond the well-known four are
    representable.
    """

    id: int
    email: EmailStr
    full_name: str
    role: str | None = None
    role_id: int | None = None
    organization_id: int | None = None
    points_balance: int = 0
    phone: str | None = None
    avatar_emoji: str | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
