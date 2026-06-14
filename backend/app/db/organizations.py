"""Centralized ``organizations`` queries via raw SQL + Context Manager (#12)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import organizations as q
from app.db.session import execute_insert, get_session


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "short_name": row["short_name"],
        "city": row["city"],
        "org_type": row["org_type"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_organization_by_id(org_id: int) -> dict[str, Any] | None:
    with get_session() as session:
        row = session.execute(text(q.GET_BY_ID), {"id": org_id}).mappings().first()
        return _to_dict(row)


def list_organizations(*, active_only: bool = False) -> list[dict[str, Any]]:
    with get_session() as session:
        sql = q.LIST_ACTIVE if active_only else q.LIST_ALL
        rows = session.execute(text(sql)).mappings().all()
        return [_to_dict(r) for r in rows]


def create_organization(
    *,
    name: str,
    short_name: str | None = None,
    city: str | None = None,
    org_type: str | None = None,
) -> int:
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT),
            {
                "name": name,
                "short_name": short_name,
                "city": city,
                "org_type": org_type,
            },
        )
