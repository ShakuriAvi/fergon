"""Role admin business logic (#28).

CRUD for roles, admin-only. Enforces a unique ``name``. Deletes are soft
(``is_active = 0``); deactivating a role that users still reference is allowed
(it only hides it from selection) and the referencing-user count is logged.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.logging import store_log
from app.db import roles as roles_db
from app.schemas.role import RoleCreate, RoleUpdate
from app.translations.translator import t


def _get_or_404(role_id: int) -> dict[str, Any]:
    role = roles_db.get_role_by_id(role_id)
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    return role


def _ensure_name_free(name: str, *, exclude_id: int | None = None) -> None:
    existing = roles_db.get_role_by_name(name)
    if existing is not None and existing["id"] != exclude_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=t("role.name_taken")
        )


def list_roles(
    *, q: str | None, include_inactive: bool, limit: int, offset: int
) -> tuple[list[dict[str, Any]], int]:
    return roles_db.list_roles_page(
        q_text=q, include_inactive=include_inactive, limit=limit, offset=offset
    )


def get_role(role_id: int) -> dict[str, Any]:
    return _get_or_404(role_id)


def create_role(payload: RoleCreate, *, actor_id: int | None = None) -> dict[str, Any]:
    _ensure_name_free(payload.name)
    new_id = roles_db.create_role(
        name=payload.name,
        name_he=payload.name_he,
        access_level=payload.access_level.value,
        is_manager=payload.is_manager,
        rolls_up=payload.rolls_up,
    )
    store_log(
        "admin_role_create", level=logging.INFO, user_id=actor_id,
        details=f"role {new_id}",
    )
    return _get_or_404(new_id)


def update_role(
    role_id: int, payload: RoleUpdate, *, actor_id: int | None = None
) -> dict[str, Any]:
    _get_or_404(role_id)
    _ensure_name_free(payload.name, exclude_id=role_id)
    roles_db.update_role(
        role_id,
        name=payload.name,
        name_he=payload.name_he,
        access_level=payload.access_level.value,
        is_manager=payload.is_manager,
        rolls_up=payload.rolls_up,
    )
    store_log(
        "admin_role_update", level=logging.INFO, user_id=actor_id,
        details=f"role {role_id}",
    )
    return _get_or_404(role_id)


def deactivate_role(role_id: int, *, actor_id: int | None = None) -> dict[str, Any]:
    """Soft-delete (``is_active = 0``). References are left intact."""
    _get_or_404(role_id)
    in_use = roles_db.count_users_for_role(role_id)
    roles_db.set_role_active(role_id, is_active=False)
    store_log(
        "admin_role_delete", level=logging.INFO, user_id=actor_id,
        details=f"role {role_id} deactivated; {in_use} users still reference it",
    )
    return _get_or_404(role_id)


def reactivate_role(role_id: int, *, actor_id: int | None = None) -> dict[str, Any]:
    _get_or_404(role_id)
    roles_db.set_role_active(role_id, is_active=True)
    store_log(
        "admin_role_reactivate", level=logging.INFO, user_id=actor_id,
        details=f"role {role_id} reactivated",
    )
    return _get_or_404(role_id)
