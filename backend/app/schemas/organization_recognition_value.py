"""Pydantic schemas for the OrganizationRecognitionValue junction (#21)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class OrganizationRecognitionValueCreate(BaseModel):
    """Payload to link a recognition value to an organization."""

    organization_id: int
    recognition_value_id: int


class OrgRecognitionValueAdd(BaseModel):
    """Payload to add a value to an org (org comes from the path)."""

    recognition_value_id: int


class OrganizationRecognitionValueRead(BaseModel):
    """Junction representation returned to the frontend."""

    id: int
    organization_id: int
    recognition_value_id: int
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class OrgRecognitionValueRow(BaseModel):
    """A junction row joined to the catalog (key/emoji/tone) for the org view."""

    id: int
    organization_id: int
    recognition_value_id: int
    key: str
    emoji: str | None = None
    tone: str | None = None
    is_active: bool = True
