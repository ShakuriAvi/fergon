"""Centralized ``recognition_values`` queries via raw SQL + Context Manager (#14)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db._filters import build_list_sql
from app.db.queries import recognition_values as q
from app.db.session import execute_insert, get_session


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "key": row["key"],
        "emoji": row["emoji"],
        "tone": row["tone"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_value_by_id(value_id: int) -> dict[str, Any] | None:
    with get_session() as session:
        row = session.execute(text(q.GET_BY_ID), {"id": value_id}).mappings().first()
        return _to_dict(row)


def list_values(*, active_only: bool = False) -> list[dict[str, Any]]:
    with get_session() as session:
        sql = q.LIST_ACTIVE if active_only else q.LIST_ALL
        rows = session.execute(text(sql)).mappings().all()
        return [_to_dict(r) for r in rows]


def get_value_by_key(key: str) -> dict[str, Any] | None:
    with get_session() as session:
        row = session.execute(text(q.GET_BY_KEY), {"key": key}).mappings().first()
        return _to_dict(row)


def list_values_page(
    *,
    q_text: str | None = None,
    include_inactive: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    list_sql, count_sql, count_params, list_params = build_list_sql(
        columns=q._COLUMNS,
        from_clause="recognition_values",
        order_by="id",
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


def create_value(
    *, key: str, emoji: str | None = None, tone: str | None = None
) -> int:
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT), {"key": key, "emoji": emoji, "tone": tone}
        )


def update_value(
    value_id: int, *, key: str, emoji: str | None, tone: str | None
) -> None:
    with get_session() as session:
        session.execute(
            text(q.UPDATE),
            {"id": value_id, "key": key, "emoji": emoji, "tone": tone},
        )


def set_value_active(value_id: int, *, is_active: bool) -> None:
    """Soft-delete / reactivate a recognition value (``is_active`` flag)."""
    with get_session() as session:
        session.execute(
            text(q.SET_ACTIVE),
            {"id": value_id, "is_active": 1 if is_active else 0},
        )
