"""Pydantic schemas for the OrganizationRoleAllowance resource (#23)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class OrganizationRoleAllowanceCreate(BaseModel):
    """Payload to set a role's monthly giving points for an organization."""

    organization_id: int
    role_id: int
    monthly_points: int = Field(ge=0)


class OrganizationRoleAllowanceRead(BaseModel):
    """Allowance config representation returned to the frontend."""

    id: int
    organization_id: int
    role_id: int
    monthly_points: int
    created_at: datetime | None = None
    updated_at: datetime | None = None
