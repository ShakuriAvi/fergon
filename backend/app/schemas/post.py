"""Pydantic schemas for the Post resource (#15)."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field


class PostCreate(BaseModel):
    """Payload to create a recognition post.

    The actor (giver) and organization are intentionally **not** part of this
    client payload: they are derived from the authenticated session by the
    service/route layer so a user cannot post as someone else or cross
    organizations.
    """

    to_user_id: int
    points: int = Field(ge=0, le=1000, default=0)
    message: str | None = Field(default=None, max_length=2000)
    recognition_value_ids: list[int] = Field(default_factory=list)
    data_date: date | None = None


class PostRead(BaseModel):
    """Post representation returned to the frontend."""

    id: int
    from_user_id: int
    to_user_id: int
    organization_id: int
    points: int
    message: str | None = None
    recognition_value_ids: list[int] = Field(default_factory=list)
    data_date: date | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
