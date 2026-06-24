"""Admin per-organization role allowance views (#32). HTTP only."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.routes.admin._common import admin_dep, admin_required
from app.schemas.organization_role_allowance import (
    OrganizationRoleAllowanceRead,
    OrgRoleAllowanceRow,
    OrgRoleAllowanceSet,
)
from app.services import organization_role_allowance_service as svc

router = APIRouter(
    prefix="/admin/organizations/{org_id}/role-allowances",
    tags=["admin:org-role-allowances"],
    dependencies=admin_dep(),
)


@router.get("", response_model=list[OrgRoleAllowanceRow])
def list_allowances(org_id: int) -> list[OrgRoleAllowanceRow]:
    return [OrgRoleAllowanceRow(**r) for r in svc.list_for_org(org_id)]


@router.put("", response_model=OrganizationRoleAllowanceRead)
def set_allowance(
    org_id: int, payload: OrgRoleAllowanceSet, current: dict = Depends(admin_required)
) -> OrganizationRoleAllowanceRead:
    """Create or update (upsert) a role's monthly points for the org."""
    allowance = svc.set_allowance(
        org_id, payload.role_id, payload.monthly_points, actor_id=current.get("id")
    )
    return OrganizationRoleAllowanceRead(**allowance)


@router.delete("/{role_id}", response_model=OrganizationRoleAllowanceRead)
def remove_allowance(
    org_id: int, role_id: int, current: dict = Depends(admin_required)
) -> OrganizationRoleAllowanceRead:
    """Soft delete: deactivates the (org, role) allowance."""
    allowance = svc.remove_allowance(org_id, role_id, actor_id=current.get("id"))
    return OrganizationRoleAllowanceRead(**allowance)
