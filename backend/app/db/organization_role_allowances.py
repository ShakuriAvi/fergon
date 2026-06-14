"""Centralized ``organization_role_allowances`` queries via raw SQL (#23)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import organization_role_allowances as q
from app.db.session import execute_insert, get_session


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "organization_id": row["organization_id"],
        "role_id": row["role_id"],
        "monthly_points": row["monthly_points"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_for_organization(organization_id: int) -> list[dict[str, Any]]:
    with get_session() as session:
        rows = (
            session.execute(
                text(q.LIST_FOR_ORG), {"organization_id": organization_id}
            )
            .mappings()
            .all()
        )
        return [_to_dict(r) for r in rows]


def get_monthly_points(organization_id: int, role_id: int) -> int | None:
    with get_session() as session:
        row = (
            session.execute(
                text(q.GET_MONTHLY_POINTS),
                {"organization_id": organization_id, "role_id": role_id},
            )
            .mappings()
            .first()
        )
        return row["monthly_points"] if row is not None else None


def set_allowance(
    *, organization_id: int, role_id: int, monthly_points: int
) -> int:
    """Insert or update the monthly points for an (org, role) pair."""
    with get_session() as session:
        existing = (
            session.execute(
                text(q.GET_ID_BY_ORG_ROLE),
                {"organization_id": organization_id, "role_id": role_id},
            )
            .mappings()
            .first()
        )
        if existing is None:
            return execute_insert(
                session,
                text(q.INSERT),
                {
                    "organization_id": organization_id,
                    "role_id": role_id,
                    "monthly_points": monthly_points,
                },
            )
        session.execute(
            text(q.UPDATE_POINTS),
            {"id": existing["id"], "monthly_points": monthly_points},
        )
        return existing["id"]
