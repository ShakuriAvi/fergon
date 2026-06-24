"""Pydantic schemas for the OrganizationRoleAllowance resource (#23)."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class OrganizationRoleAllowanceCreate(BaseModel):
    """Payload to set a role's monthly giving points for an organization."""

    organization_id: int
    role_id: int
    monthly_points: int = Field(ge=0)


class OrgRoleAllowanceSet(BaseModel):
    """Payload to set/update a role's monthly points (org comes from the path)."""

    role_id: int
    monthly_points: int = Field(ge=0)


class OrganizationRoleAllowanceRead(BaseModel):
    """Allowance config representation returned to the frontend."""

    id: int
    organization_id: int
    role_id: int
    monthly_points: int
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class OrgRoleAllowanceRow(BaseModel):
    """A role + its (optional) configured monthly points for an org's view."""

    role_id: int
    name: str
    name_he: str
    access_level: str
    allowance_id: int | None = None
    monthly_points: int | None = None
    is_active: bool = False
