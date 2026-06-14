"""Centralized ``recognition_values`` queries via raw SQL + Context Manager (#14)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

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


def create_value(
    *, key: str, emoji: str | None = None, tone: str | None = None
) -> int:
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT), {"key": key, "emoji": emoji, "tone": tone}
        )
