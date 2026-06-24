"""Admin role views (#28). HTTP only — delegates to the service."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.routes.admin._common import ListParams, admin_dep, admin_required, list_params
from app.schemas.common import Page
from app.schemas.role import RoleCreate, RoleRead, RoleUpdate
from app.services import role_service as svc

router = APIRouter(prefix="/admin/roles", tags=["admin:roles"], dependencies=admin_dep())


@router.get("", response_model=Page[RoleRead])
def list_roles(params: ListParams = Depends(list_params)) -> Page[RoleRead]:
    items, total = svc.list_roles(
        q=params.q,
        include_inactive=params.include_inactive,
        limit=params.limit,
        offset=params.offset,
    )
    return Page[RoleRead](items=items, total=total)


@router.get("/{role_id}", response_model=RoleRead)
def get_role(role_id: int) -> RoleRead:
    return RoleRead(**svc.get_role(role_id))


@router.post("", response_model=RoleRead, status_code=201)
def create_role(payload: RoleCreate, current: dict = Depends(admin_required)) -> RoleRead:
    return RoleRead(**svc.create_role(payload, actor_id=current.get("id")))


@router.put("/{role_id}", response_model=RoleRead)
def update_role(
    role_id: int, payload: RoleUpdate, current: dict = Depends(admin_required)
) -> RoleRead:
    return RoleRead(**svc.update_role(role_id, payload, actor_id=current.get("id")))


@router.delete("/{role_id}", response_model=RoleRead)
def deactivate_role(role_id: int, current: dict = Depends(admin_required)) -> RoleRead:
    """Soft delete: sets ``is_active = 0`` (references are kept)."""
    return RoleRead(**svc.deactivate_role(role_id, actor_id=current.get("id")))


@router.post("/{role_id}/reactivate", response_model=RoleRead)
def reactivate_role(role_id: int, current: dict = Depends(admin_required)) -> RoleRead:
    return RoleRead(**svc.reactivate_role(role_id, actor_id=current.get("id")))
