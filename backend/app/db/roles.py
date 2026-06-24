"""Centralized ``roles`` queries via raw SQL + Context Manager (#20)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db._filters import build_list_sql
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
        "is_active": bool(row["is_active"]),
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


def list_roles_page(
    *,
    q_text: str | None = None,
    include_inactive: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    list_sql, count_sql, count_params, list_params = build_list_sql(
        columns=q._COLUMNS,
        from_clause="roles",
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


def count_users_for_role(role_id: int) -> int:
    with get_session() as session:
        return int(
            session.execute(text(q.COUNT_USERS), {"role_id": role_id}).scalar_one()
        )


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


def update_role(
    role_id: int,
    *,
    name: str,
    name_he: str,
    access_level: str,
    is_manager: bool,
    rolls_up: bool,
) -> None:
    with get_session() as session:
        session.execute(
            text(q.UPDATE),
            {
                "id": role_id,
                "name": name,
                "name_he": name_he,
                "access_level": AccessLevel(access_level).value,
                "is_manager": is_manager,
                "rolls_up": rolls_up,
            },
        )


def set_role_active(role_id: int, *, is_active: bool) -> None:
    """Soft-delete / reactivate a role (``is_active`` flag)."""
    with get_session() as session:
        session.execute(
            text(q.SET_ACTIVE), {"id": role_id, "is_active": 1 if is_active else 0}
        )
