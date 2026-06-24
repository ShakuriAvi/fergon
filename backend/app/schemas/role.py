"""Pydantic schemas for the Role resource (#20)."""
from __future__ import annotations

import enum
from datetime import datetime

from pydantic import BaseModel, Field


class AccessLevel(str, enum.Enum):
    """Permission tier a role grants, used by the permission middleware."""

    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"


ACCESS_LEVELS = tuple(a.value for a in AccessLevel)


class RoleCreate(BaseModel):
    """Payload to create a role."""

    name: str = Field(min_length=1, max_length=50)
    name_he: str = Field(min_length=1, max_length=120)
    access_level: AccessLevel = AccessLevel.MEMBER
    is_manager: bool = False
    rolls_up: bool = False


class RoleUpdate(BaseModel):
    """Payload to update a role."""

    name: str = Field(min_length=1, max_length=50)
    name_he: str = Field(min_length=1, max_length=120)
    access_level: AccessLevel = AccessLevel.MEMBER
    is_manager: bool = False
    rolls_up: bool = False


class RoleRead(BaseModel):
    """Role representation returned to the frontend."""

    id: int
    name: str
    name_he: str
    access_level: AccessLevel
    is_manager: bool
    rolls_up: bool
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
