"""Per-organization role allowance admin business logic (#32).

Configure the monthly giving-points budget per role within an organization. This
is the config CRUD — distinct from ``allowance_service`` which grants the monthly
periods. Setting an allowance upserts (reactivating a soft-deleted row), so the
unique ``(organization_id, role_id)`` pair is respected. Deletes are soft.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.logging import store_log
from app.db import organization_role_allowances as ora_db
from app.db import organizations as orgs_db
from app.db import roles as roles_db
from app.translations.translator import t


def _require_org(org_id: int) -> None:
    if orgs_db.get_organization_by_id(org_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )


def list_for_org(org_id: int) -> list[dict[str, Any]]:
    """Every active role for the org + its configured monthly points (or None)."""
    _require_org(org_id)
    return ora_db.list_roles_with_allowance(org_id)


def set_allowance(
    org_id: int, role_id: int, monthly_points: int, *, actor_id: int | None = None
) -> dict[str, Any]:
    _require_org(org_id)
    if roles_db.get_role_by_id(role_id) is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=t("user.invalid_role")
        )
    allowance_id = ora_db.set_allowance(
        organization_id=org_id, role_id=role_id, monthly_points=monthly_points
    )
    store_log(
        "admin_org_allowance_set", level=logging.INFO, user_id=actor_id,
        details=f"org {org_id} role {role_id} -> {monthly_points}",
    )
    allowance = ora_db.get_allowance_by_id(allowance_id)
    if allowance is None:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    return allowance


def remove_allowance(
    org_id: int, role_id: int, *, actor_id: int | None = None
) -> dict[str, Any]:
    """Soft-delete the (org, role) allowance (``is_active = 0``)."""
    _require_org(org_id)
    row = next(
        (
            r
            for r in ora_db.list_roles_with_allowance(org_id)
            if r["role_id"] == role_id and r["allowance_id"] is not None
        ),
        None,
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    ora_db.set_allowance_active(row["allowance_id"], is_active=False)
    store_log(
        "admin_org_allowance_remove", level=logging.INFO, user_id=actor_id,
        details=f"org {org_id} role {role_id} allowance deactivated",
    )
    allowance = ora_db.get_allowance_by_id(row["allowance_id"])
    return allowance  # type: ignore[return-value]
