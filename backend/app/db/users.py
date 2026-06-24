"""Centralized ``users`` queries via raw SQL + Context Manager (#11, #13).

These helpers return plain ``dict``s (or ``None``) and the new user id, so
services/middleware are unchanged. ``role`` is exposed as the role *name*
(resolved via a join to the ``roles`` table) for backward compatibility with the
JWT/permission layer. All access goes through the ``get_session`` context manager.
"""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import bindparam, text

from app.db._filters import build_list_sql
from app.db.queries import roles as roles_q
from app.db.queries import users as q
from app.db.session import execute_insert, get_session


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    """Serialize a joined ``users``/``roles`` row to the dict shape callers expect."""
    if row is None:
        return None
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "role": row["role_name"],
        "access_level": row["access_level"],
        "role_id": row["role_id"],
        "organization_id": row["organization_id"],
        "points_balance": row["points_balance"],
        "phone": row["phone"],
        "avatar_emoji": row["avatar_emoji"],
        "oauth_id": row["oauth_id"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_user_by_email(email: str) -> dict[str, Any] | None:
    """Return the user with the given email, or ``None``."""
    with get_session() as session:
        row = session.execute(text(q.GET_BY_EMAIL), {"email": email}).mappings().first()
        return _to_dict(row)


def get_user_by_oauth_id(oauth_id: str) -> dict[str, Any] | None:
    """Return the user with the given Google ``oauth_id``, or ``None``."""
    with get_session() as session:
        row = (
            session.execute(text(q.GET_BY_OAUTH_ID), {"oauth_id": oauth_id})
            .mappings()
            .first()
        )
        return _to_dict(row)


def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    """Return the user with the given id, or ``None``."""
    with get_session() as session:
        row = session.execute(text(q.GET_BY_ID), {"id": user_id}).mappings().first()
        return _to_dict(row)


def create_user(
    *,
    email: str,
    full_name: str,
    role: str | None = None,
    role_id: int | None = None,
    organization_id: int | None = None,
    oauth_id: str | None = None,
) -> int:
    """Insert a new user row and return its id.

    ``role`` may be passed as a role *name* (e.g. ``"teacher"``) and is resolved
    to ``role_id`` via the ``roles`` table; an explicit ``role_id`` takes
    precedence.
    """
    with get_session() as session:
        resolved_role_id = role_id
        if resolved_role_id is None and role is not None:
            role_row = (
                session.execute(text(roles_q.GET_ID_BY_NAME), {"name": role})
                .mappings()
                .first()
            )
            resolved_role_id = role_row["id"] if role_row is not None else None
        return execute_insert(
            session,
            text(q.INSERT),
            {
                "email": email,
                "full_name": full_name,
                "role_id": resolved_role_id,
                "organization_id": organization_id,
                "oauth_id": oauth_id,
            },
        )


def list_users_page(
    *,
    q_text: str | None = None,
    organization_id: int | None = None,
    role_id: int | None = None,
    include_inactive: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    """Return a page of users (joined to roles) matching the filters + total."""
    extra_where: list[str] = []
    extra_params: dict[str, Any] = {}
    if organization_id is not None:
        extra_where.append("u.organization_id = :organization_id")
        extra_params["organization_id"] = organization_id
    if role_id is not None:
        extra_where.append("u.role_id = :role_id")
        extra_params["role_id"] = role_id
    list_sql, count_sql, count_params, list_params = build_list_sql(
        columns=q._COLUMNS,
        from_clause="users u LEFT JOIN roles r ON r.id = u.role_id",
        order_by="u.full_name",
        search_columns=q.SEARCH_COLUMNS,
        q=q_text,
        include_inactive=include_inactive,
        active_column="u.is_active",
        limit=limit,
        offset=offset,
        extra_where=extra_where,
        extra_params=extra_params,
    )
    with get_session() as session:
        rows = session.execute(text(list_sql), list_params).mappings().all()
        total = session.execute(text(count_sql), count_params).scalar_one()
        return [_to_dict(r) for r in rows], int(total)


def create_user_admin(
    *,
    email: str,
    full_name: str,
    role_id: int | None = None,
    organization_id: int | None = None,
    phone: str | None = None,
    avatar_emoji: str | None = None,
) -> int:
    """Admin create with the profile fields the admin panel manages."""
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT_ADMIN),
            {
                "email": email,
                "full_name": full_name,
                "role_id": role_id,
                "organization_id": organization_id,
                "phone": phone,
                "avatar_emoji": avatar_emoji,
            },
        )


def update_user_admin(
    user_id: int,
    *,
    full_name: str,
    role_id: int | None,
    organization_id: int | None,
    phone: str | None,
    avatar_emoji: str | None,
) -> None:
    with get_session() as session:
        session.execute(
            text(q.UPDATE_ADMIN),
            {
                "id": user_id,
                "full_name": full_name,
                "role_id": role_id,
                "organization_id": organization_id,
                "phone": phone,
                "avatar_emoji": avatar_emoji,
            },
        )


def names_for_ids(ids: list[int]) -> dict[int, str]:
    """Map user id -> full_name for the given ids (feed enrichment)."""
    if not ids:
        return {}
    stmt = text(q.NAMES_BY_IDS).bindparams(bindparam("ids", expanding=True))
    with get_session() as session:
        rows = session.execute(stmt, {"ids": list(set(ids))}).mappings().all()
        return {r["id"]: r["full_name"] for r in rows}


def top_by_points(organization_id: int, *, limit: int = 6) -> list[dict[str, Any]]:
    """Top earners in an org (feed spotlight / leaderboard)."""
    with get_session() as session:
        rows = (
            session.execute(
                text(q.TOP_BY_POINTS),
                {"organization_id": organization_id, "limit": limit},
            )
            .mappings()
            .all()
        )
        return [
            {"user_id": r["id"], "name": r["full_name"], "points": r["points_balance"]}
            for r in rows
        ]


def set_points_balance(user_id: int, points: int) -> None:
    """Set a user's earned balance to an absolute value (seeding)."""
    with get_session() as session:
        session.execute(text(q.SET_POINTS_BALANCE), {"id": user_id, "points": points})


def set_user_active(user_id: int, *, is_active: bool) -> None:
    """Soft-delete / reactivate a user (``is_active`` flag)."""
    with get_session() as session:
        session.execute(
            text(q.SET_ACTIVE),
            {"id": user_id, "is_active": 1 if is_active else 0},
        )
