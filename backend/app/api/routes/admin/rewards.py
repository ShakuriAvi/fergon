"""Admin rewards catalog ("providers") views (#33). HTTP only."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.routes.admin._common import ListParams, admin_dep, admin_required, list_params
from app.schemas.common import Page
from app.schemas.reward import RewardCategory, RewardCreate, RewardRead, RewardUpdate
from app.services import reward_admin_service as svc

router = APIRouter(prefix="/admin/rewards", tags=["admin:rewards"], dependencies=admin_dep())


@router.get("", response_model=Page[RewardRead])
def list_rewards(
    params: ListParams = Depends(list_params),
    provider: str | None = Query(default=None, max_length=255),
    category: RewardCategory | None = Query(default=None),
) -> Page[RewardRead]:
    items, total = svc.list_rewards(
        q=params.q,
        provider=provider,
        category=category.value if category else None,
        include_inactive=params.include_inactive,
        limit=params.limit,
        offset=params.offset,
    )
    return Page[RewardRead](items=items, total=total)


@router.get("/{reward_id}", response_model=RewardRead)
def get_reward(reward_id: int) -> RewardRead:
    return RewardRead(**svc.get_reward(reward_id))


@router.post("", response_model=RewardRead, status_code=201)
def create_reward(
    payload: RewardCreate, current: dict = Depends(admin_required)
) -> RewardRead:
    return RewardRead(**svc.create_reward(payload, actor_id=current.get("id")))


@router.put("/{reward_id}", response_model=RewardRead)
def update_reward(
    reward_id: int, payload: RewardUpdate, current: dict = Depends(admin_required)
) -> RewardRead:
    return RewardRead(**svc.update_reward(reward_id, payload, actor_id=current.get("id")))


@router.delete("/{reward_id}", response_model=RewardRead)
def deactivate_reward(reward_id: int, current: dict = Depends(admin_required)) -> RewardRead:
    """Soft delete: sets ``is_active = 0`` (distinct from ``in_stock``)."""
    return RewardRead(**svc.deactivate_reward(reward_id, actor_id=current.get("id")))


@router.post("/{reward_id}/reactivate", response_model=RewardRead)
def reactivate_reward(reward_id: int, current: dict = Depends(admin_required)) -> RewardRead:
    return RewardRead(**svc.reactivate_reward(reward_id, actor_id=current.get("id")))
