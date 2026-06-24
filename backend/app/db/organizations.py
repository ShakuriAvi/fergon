"""Centralized ``organizations`` queries via raw SQL + Context Manager (#12)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db._filters import build_list_sql
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


def list_organizations_page(
    *,
    q_text: str | None = None,
    include_inactive: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    """Return a page of organizations matching the (search) filter + the total."""
    list_sql, count_sql, count_params, list_params = build_list_sql(
        columns=q._COLUMNS,
        from_clause="organizations",
        order_by="name",
        search_columns=q.SEARCH_COLUMNS,
        q=q_text,
        include_inactive=include_inactive,
        limit=limit,
        offset=offset,
    )
    with get_session() as session:
        rows = session.execute(text(list_sql), list_params).mappings().all()
        total = session.execute(text(count_sql), count_params).scalar_one()
        return [_to_dict(r) for r in rows], int(total)


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


def update_organization(
    org_id: int,
    *,
    name: str,
    short_name: str | None,
    city: str | None,
    org_type: str | None,
) -> None:
    with get_session() as session:
        session.execute(
            text(q.UPDATE),
            {
                "id": org_id,
                "name": name,
                "short_name": short_name,
                "city": city,
                "org_type": org_type,
            },
        )


def set_organization_active(org_id: int, *, is_active: bool) -> None:
    """Soft-delete / reactivate an organization (``is_active`` flag)."""
    with get_session() as session:
        session.execute(
            text(q.SET_ACTIVE), {"id": org_id, "is_active": 1 if is_active else 0}
        )
