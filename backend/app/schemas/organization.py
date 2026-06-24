"""Pydantic schemas for the Organization resource (#12)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    """Payload to create an organization."""

    name: str = Field(min_length=1, max_length=255)
    short_name: str | None = Field(default=None, max_length=120)
    city: str | None = Field(default=None, max_length=120)
    org_type: str | None = Field(default=None, max_length=50)


class OrganizationUpdate(BaseModel):
    """Payload to update an organization (full replace of editable fields)."""

    name: str = Field(min_length=1, max_length=255)
    short_name: str | None = Field(default=None, max_length=120)
    city: str | None = Field(default=None, max_length=120)
    org_type: str | None = Field(default=None, max_length=50)


class OrganizationRead(BaseModel):
    """Organization representation returned to the frontend."""

    id: int
    name: str
    short_name: str | None = None
    city: str | None = None
    org_type: str | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
