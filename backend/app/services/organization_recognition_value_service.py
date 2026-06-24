"""Per-organization recognition values admin business logic (#31).

Manage which catalog recognition values an organization has selected. "Removing"
a value is a soft delete (``is_active = 0``); re-adding a previously removed value
reactivates the existing junction row rather than inserting a duplicate (the
``(organization_id, recognition_value_id)`` pair is unique).
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.logging import store_log
from app.db import organization_recognition_values as orv_db
from app.db import organizations as orgs_db
from app.db import recognition_values as values_db
from app.translations.translator import t


def _require_org(org_id: int) -> None:
    if orgs_db.get_organization_by_id(org_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )


def list_org_values(
    org_id: int, *, include_inactive: bool = False
) -> list[dict[str, Any]]:
    _require_org(org_id)
    rows = orv_db.list_for_organization_joined(org_id)
    if not include_inactive:
        rows = [r for r in rows if r["is_active"]]
    return rows


def list_available_values(org_id: int) -> list[dict[str, Any]]:
    """Active catalog values not currently (actively) linked to the org."""
    _require_org(org_id)
    linked_active = {
        r["recognition_value_id"]
        for r in orv_db.list_for_organization_joined(org_id)
        if r["is_active"]
    }
    catalog, _ = values_db.list_values_page(include_inactive=False, limit=200, offset=0)
    return [v for v in catalog if v["id"] not in linked_active]


def add_value(
    org_id: int, recognition_value_id: int, *, actor_id: int | None = None
) -> dict[str, Any]:
    _require_org(org_id)
    if values_db.get_value_by_id(recognition_value_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("recognition_value.not_found"),
        )
    link_id, created = orv_db.add_or_reactivate_value(
        organization_id=org_id, recognition_value_id=recognition_value_id
    )
    store_log(
        "admin_org_value_add", level=logging.INFO, user_id=actor_id,
        details=f"org {org_id} value {recognition_value_id} "
        f"({'created' if created else 'reactivated'})",
    )
    row = next(
        (
            r
            for r in orv_db.list_for_organization_joined(org_id)
            if r["recognition_value_id"] == recognition_value_id
        ),
        None,
    )
    if row is None:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    return row


def remove_value(
    org_id: int, recognition_value_id: int, *, actor_id: int | None = None
) -> dict[str, Any]:
    """Soft-delete the (org, value) link (``is_active = 0``)."""
    _require_org(org_id)
    link = next(
        (
            r
            for r in orv_db.list_for_organization_joined(org_id)
            if r["recognition_value_id"] == recognition_value_id and r["is_active"]
        ),
        None,
    )
    if link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    orv_db.set_link_active(link["id"], is_active=False)
    store_log(
        "admin_org_value_remove", level=logging.INFO, user_id=actor_id,
        details=f"org {org_id} value {recognition_value_id} deactivated",
    )
    link["is_active"] = False
    return link
