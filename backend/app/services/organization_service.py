"""Organization admin business logic (#27).

CRUD for organizations, admin-only (the route layer enforces the access tier).
All persistence goes through the centralized db layer (parameterized SQL); no
sensitive data is accepted or returned beyond the organization's own fields.
Deletes are soft (``is_active = 0``) per the global rule in CLAUDE.md.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.logging import store_log
from app.db import organizations as orgs_db
from app.schemas.organization import OrganizationCreate, OrganizationUpdate
from app.translations.translator import t


def _get_or_404(org_id: int) -> dict[str, Any]:
    org = orgs_db.get_organization_by_id(org_id)
    if org is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    return org


def list_organizations(
    *, q: str | None, include_inactive: bool, limit: int, offset: int
) -> tuple[list[dict[str, Any]], int]:
    return orgs_db.list_organizations_page(
        q_text=q, include_inactive=include_inactive, limit=limit, offset=offset
    )


def get_organization(org_id: int) -> dict[str, Any]:
    return _get_or_404(org_id)


def create_organization(
    payload: OrganizationCreate, *, actor_id: int | None = None
) -> dict[str, Any]:
    new_id = orgs_db.create_organization(
        name=payload.name,
        short_name=payload.short_name,
        city=payload.city,
        org_type=payload.org_type,
    )
    store_log(
        "admin_organization_create",
        level=logging.INFO,
        user_id=actor_id,
        details=f"organization {new_id}",
    )
    return _get_or_404(new_id)


def update_organization(
    org_id: int, payload: OrganizationUpdate, *, actor_id: int | None = None
) -> dict[str, Any]:
    _get_or_404(org_id)
    orgs_db.update_organization(
        org_id,
        name=payload.name,
        short_name=payload.short_name,
        city=payload.city,
        org_type=payload.org_type,
    )
    store_log(
        "admin_organization_update",
        level=logging.INFO,
        user_id=actor_id,
        details=f"organization {org_id}",
    )
    return _get_or_404(org_id)


def deactivate_organization(
    org_id: int, *, actor_id: int | None = None
) -> dict[str, Any]:
    """Soft-delete (``is_active = 0``) — never removes the row."""
    _get_or_404(org_id)
    orgs_db.set_organization_active(org_id, is_active=False)
    store_log(
        "admin_organization_delete",
        level=logging.INFO,
        user_id=actor_id,
        details=f"organization {org_id} deactivated",
    )
    return _get_or_404(org_id)


def reactivate_organization(
    org_id: int, *, actor_id: int | None = None
) -> dict[str, Any]:
    _get_or_404(org_id)
    orgs_db.set_organization_active(org_id, is_active=True)
    store_log(
        "admin_organization_reactivate",
        level=logging.INFO,
        user_id=actor_id,
        details=f"organization {org_id} reactivated",
    )
    return _get_or_404(org_id)
