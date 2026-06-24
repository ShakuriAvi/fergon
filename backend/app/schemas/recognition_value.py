"""Pydantic schemas for the RecognitionValue resource (#14)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class RecognitionValueCreate(BaseModel):
    """Payload to create a recognition value (Hebrew key)."""

    key: str = Field(min_length=1, max_length=120)
    emoji: str | None = None
    tone: str | None = None


class RecognitionValueUpdate(BaseModel):
    """Payload to update a recognition value."""

    key: str = Field(min_length=1, max_length=120)
    emoji: str | None = Field(default=None, max_length=16)
    tone: str | None = Field(default=None, max_length=32)


class RecognitionValueRead(BaseModel):
    """Recognition value representation returned to the frontend."""

    id: int
    key: str
    emoji: str | None = None
    tone: str | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
