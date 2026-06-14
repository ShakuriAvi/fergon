"""Centralized ``organization_recognition_values`` queries via raw SQL (#21)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import organization_recognition_values as q
from app.db.session import execute_insert, get_session


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "organization_id": row["organization_id"],
        "recognition_value_id": row["recognition_value_id"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_for_organization(
    organization_id: int, *, active_only: bool = True
) -> list[dict[str, Any]]:
    with get_session() as session:
        sql = q.LIST_FOR_ORG_ACTIVE if active_only else q.LIST_FOR_ORG
        rows = (
            session.execute(text(sql), {"organization_id": organization_id})
            .mappings()
            .all()
        )
        return [_to_dict(link) for link in rows]


def enabled_value_ids(organization_id: int) -> set[int]:
    """Return the set of active recognition_value ids enabled for the org."""
    with get_session() as session:
        rows = (
            session.execute(
                text(q.ENABLED_VALUE_IDS), {"organization_id": organization_id}
            )
            .mappings()
            .all()
        )
        return {row["recognition_value_id"] for row in rows}


def add_value(*, organization_id: int, recognition_value_id: int) -> int:
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT),
            {
                "organization_id": organization_id,
                "recognition_value_id": recognition_value_id,
            },
        )
