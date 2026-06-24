"""Rewards catalog ("providers") admin business logic (#33).

CRUD for the ``rewards`` catalog, admin-only. ``category`` and ``cost`` are
validated by the Pydantic schema. Deletes are soft (``is_active = 0``), kept
distinct from ``in_stock`` (temporary stock state).
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.logging import store_log
from app.db import rewards as rewards_db
from app.schemas.reward import RewardCreate, RewardUpdate
from app.translations.translator import t


def _get_or_404(reward_id: int) -> dict[str, Any]:
    reward = rewards_db.get_reward_by_id(reward_id)
    if reward is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    return reward


def list_rewards(
    *,
    q: str | None,
    provider: str | None,
    category: str | None,
    include_inactive: bool,
    limit: int,
    offset: int,
) -> tuple[list[dict[str, Any]], int]:
    return rewards_db.list_rewards_page(
        q_text=q,
        provider=provider,
        category=category,
        include_inactive=include_inactive,
        limit=limit,
        offset=offset,
    )


def get_reward(reward_id: int) -> dict[str, Any]:
    return _get_or_404(reward_id)


def create_reward(payload: RewardCreate, *, actor_id: int | None = None) -> dict[str, Any]:
    new_id = rewards_db.create_reward(
        provider=payload.provider,
        title=payload.title,
        category=payload.category.value,
        cost=payload.cost,
        emoji=payload.emoji,
        color=payload.color,
        blurb=payload.blurb,
        in_stock=payload.in_stock,
    )
    store_log(
        "admin_reward_create", level=logging.INFO, user_id=actor_id,
        details=f"reward {new_id}",
    )
    return _get_or_404(new_id)


def update_reward(
    reward_id: int, payload: RewardUpdate, *, actor_id: int | None = None
) -> dict[str, Any]:
    _get_or_404(reward_id)
    rewards_db.update_reward(
        reward_id,
        provider=payload.provider,
        title=payload.title,
        category=payload.category.value,
        cost=payload.cost,
        emoji=payload.emoji,
        color=payload.color,
        blurb=payload.blurb,
        in_stock=payload.in_stock,
    )
    store_log(
        "admin_reward_update", level=logging.INFO, user_id=actor_id,
        details=f"reward {reward_id}",
    )
    return _get_or_404(reward_id)


def deactivate_reward(reward_id: int, *, actor_id: int | None = None) -> dict[str, Any]:
    _get_or_404(reward_id)
    rewards_db.set_reward_active(reward_id, is_active=False)
    store_log(
        "admin_reward_delete", level=logging.INFO, user_id=actor_id,
        details=f"reward {reward_id} deactivated",
    )
    return _get_or_404(reward_id)


def reactivate_reward(reward_id: int, *, actor_id: int | None = None) -> dict[str, Any]:
    _get_or_404(reward_id)
    rewards_db.set_reward_active(reward_id, is_active=True)
    store_log(
        "admin_reward_reactivate", level=logging.INFO, user_id=actor_id,
        details=f"reward {reward_id} reactivated",
    )
    return _get_or_404(reward_id)
