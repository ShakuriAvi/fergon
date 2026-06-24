"""User admin business logic (#29).

Admin-only CRUD over users. Kept separate from ``auth_service`` (which handles
login/registration). Enforces a unique email, validates the referenced role and
organization exist, and soft-deletes (``is_active = 0``) — which the permission
middleware already treats as revoked access. Sensitive fields (``oauth_id``) are
never returned (``UserRead`` omits them).
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.logging import store_log
from app.db import organizations as orgs_db
from app.db import roles as roles_db
from app.db import users as users_db
from app.schemas.user import UserAdminCreate, UserAdminUpdate
from app.translations.translator import t


def _get_or_404(user_id: int) -> dict[str, Any]:
    user = users_db.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    return user


def _validate_refs(role_id: int | None, organization_id: int | None) -> None:
    if role_id is not None and roles_db.get_role_by_id(role_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=t("user.invalid_role")
        )
    if (
        organization_id is not None
        and orgs_db.get_organization_by_id(organization_id) is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("user.invalid_organization"),
        )


def list_users(
    *,
    q: str | None,
    organization_id: int | None,
    role_id: int | None,
    include_inactive: bool,
    limit: int,
    offset: int,
) -> tuple[list[dict[str, Any]], int]:
    return users_db.list_users_page(
        q_text=q,
        organization_id=organization_id,
        role_id=role_id,
        include_inactive=include_inactive,
        limit=limit,
        offset=offset,
    )


def get_user(user_id: int) -> dict[str, Any]:
    return _get_or_404(user_id)


def create_user(payload: UserAdminCreate, *, actor_id: int | None = None) -> dict[str, Any]:
    if users_db.get_user_by_email(payload.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=t("auth.user_exists")
        )
    _validate_refs(payload.role_id, payload.organization_id)
    new_id = users_db.create_user_admin(
        email=payload.email,
        full_name=payload.full_name,
        role_id=payload.role_id,
        organization_id=payload.organization_id,
        phone=payload.phone,
        avatar_emoji=payload.avatar_emoji,
    )
    store_log(
        "admin_user_create", level=logging.INFO, user_id=actor_id,
        details=f"user {new_id}",
    )
    return _get_or_404(new_id)


def update_user(
    user_id: int, payload: UserAdminUpdate, *, actor_id: int | None = None
) -> dict[str, Any]:
    _get_or_404(user_id)
    _validate_refs(payload.role_id, payload.organization_id)
    users_db.update_user_admin(
        user_id,
        full_name=payload.full_name,
        role_id=payload.role_id,
        organization_id=payload.organization_id,
        phone=payload.phone,
        avatar_emoji=payload.avatar_emoji,
    )
    store_log(
        "admin_user_update", level=logging.INFO, user_id=actor_id,
        details=f"user {user_id}",
    )
    return _get_or_404(user_id)


def deactivate_user(user_id: int, *, actor_id: int | None = None) -> dict[str, Any]:
    """Soft-delete (``is_active = 0``) — revokes access immediately."""
    _get_or_404(user_id)
    users_db.set_user_active(user_id, is_active=False)
    store_log(
        "admin_user_delete", level=logging.INFO, user_id=actor_id,
        details=f"user {user_id} deactivated",
    )
    return _get_or_404(user_id)


def reactivate_user(user_id: int, *, actor_id: int | None = None) -> dict[str, Any]:
    _get_or_404(user_id)
    users_db.set_user_active(user_id, is_active=True)
    store_log(
        "admin_user_reactivate", level=logging.INFO, user_id=actor_id,
        details=f"user {user_id} reactivated",
    )
    return _get_or_404(user_id)
