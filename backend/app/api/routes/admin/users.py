"""Admin user views (#29). HTTP only — delegates to the service."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.routes.admin._common import ListParams, admin_dep, admin_required, list_params
from app.schemas.common import Page
from app.schemas.user import UserAdminCreate, UserAdminUpdate, UserRead
from app.services import user_admin_service as svc

router = APIRouter(prefix="/admin/users", tags=["admin:users"], dependencies=admin_dep())


@router.get("", response_model=Page[UserRead])
def list_users(
    params: ListParams = Depends(list_params),
    organization_id: int | None = Query(default=None),
    role_id: int | None = Query(default=None),
) -> Page[UserRead]:
    items, total = svc.list_users(
        q=params.q,
        organization_id=organization_id,
        role_id=role_id,
        include_inactive=params.include_inactive,
        limit=params.limit,
        offset=params.offset,
    )
    return Page[UserRead](items=items, total=total)


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int) -> UserRead:
    return UserRead(**svc.get_user(user_id))


@router.post("", response_model=UserRead, status_code=201)
def create_user(
    payload: UserAdminCreate, current: dict = Depends(admin_required)
) -> UserRead:
    return UserRead(**svc.create_user(payload, actor_id=current.get("id")))


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int, payload: UserAdminUpdate, current: dict = Depends(admin_required)
) -> UserRead:
    return UserRead(**svc.update_user(user_id, payload, actor_id=current.get("id")))


@router.delete("/{user_id}", response_model=UserRead)
def deactivate_user(user_id: int, current: dict = Depends(admin_required)) -> UserRead:
    """Soft delete: sets ``is_active = 0`` (revokes access immediately)."""
    return UserRead(**svc.deactivate_user(user_id, actor_id=current.get("id")))


@router.post("/{user_id}/reactivate", response_model=UserRead)
def reactivate_user(user_id: int, current: dict = Depends(admin_required)) -> UserRead:
    return UserRead(**svc.reactivate_user(user_id, actor_id=current.get("id")))
