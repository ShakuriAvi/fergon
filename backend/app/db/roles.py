"""Centralized ``roles`` queries via raw SQL + Context Manager (#20)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import roles as q
from app.db.session import execute_insert, get_session
from app.schemas.role import AccessLevel


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "name_he": row["name_he"],
        "access_level": row["access_level"],
        "is_manager": bool(row["is_manager"]),
        "rolls_up": bool(row["rolls_up"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_role_by_id(role_id: int) -> dict[str, Any] | None:
    with get_session() as session:
        row = session.execute(text(q.GET_BY_ID), {"id": role_id}).mappings().first()
        return _to_dict(row)


def get_role_by_name(name: str) -> dict[str, Any] | None:
    with get_session() as session:
        row = session.execute(text(q.GET_BY_NAME), {"name": name}).mappings().first()
        return _to_dict(row)


def list_roles() -> list[dict[str, Any]]:
    with get_session() as session:
        rows = session.execute(text(q.LIST_ALL)).mappings().all()
        return [_to_dict(r) for r in rows]


def create_role(
    *,
    name: str,
    name_he: str,
    access_level: str = "member",
    is_manager: bool = False,
    rolls_up: bool = False,
) -> int:
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT),
            {
                "name": name,
                "name_he": name_he,
                "access_level": AccessLevel(access_level).value,
                "is_manager": is_manager,
                "rolls_up": rolls_up,
            },
        )
