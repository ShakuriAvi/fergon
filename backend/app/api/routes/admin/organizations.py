"""Admin organization views (#27). HTTP only — delegates to the service."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.routes.admin._common import ListParams, admin_dep, admin_required, list_params
from app.schemas.common import Page
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationRead,
    OrganizationUpdate,
)
from app.services import organization_service as svc

router = APIRouter(
    prefix="/admin/organizations", tags=["admin:organizations"], dependencies=admin_dep()
)


@router.get("", response_model=Page[OrganizationRead])
def list_organizations(params: ListParams = Depends(list_params)) -> Page[OrganizationRead]:
    items, total = svc.list_organizations(
        q=params.q,
        include_inactive=params.include_inactive,
        limit=params.limit,
        offset=params.offset,
    )
    return Page[OrganizationRead](items=items, total=total)


@router.get("/{org_id}", response_model=OrganizationRead)
def get_organization(org_id: int) -> OrganizationRead:
    return OrganizationRead(**svc.get_organization(org_id))


@router.post("", response_model=OrganizationRead, status_code=201)
def create_organization(
    payload: OrganizationCreate, current: dict = Depends(admin_required)
) -> OrganizationRead:
    return OrganizationRead(
        **svc.create_organization(payload, actor_id=current.get("id"))
    )


@router.put("/{org_id}", response_model=OrganizationRead)
def update_organization(
    org_id: int, payload: OrganizationUpdate, current: dict = Depends(admin_required)
) -> OrganizationRead:
    return OrganizationRead(
        **svc.update_organization(org_id, payload, actor_id=current.get("id"))
    )


@router.delete("/{org_id}", response_model=OrganizationRead)
def deactivate_organization(
    org_id: int, current: dict = Depends(admin_required)
) -> OrganizationRead:
    """Soft delete: sets ``is_active = 0`` (no row is removed)."""
    return OrganizationRead(
        **svc.deactivate_organization(org_id, actor_id=current.get("id"))
    )


@router.post("/{org_id}/reactivate", response_model=OrganizationRead)
def reactivate_organization(
    org_id: int, current: dict = Depends(admin_required)
) -> OrganizationRead:
    return OrganizationRead(
        **svc.reactivate_organization(org_id, actor_id=current.get("id"))
    )
