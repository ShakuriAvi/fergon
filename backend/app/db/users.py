"""Centralized ``users`` queries via raw SQL + Context Manager (#11, #13).

These helpers return plain ``dict``s (or ``None``) and the new user id, so
services/middleware are unchanged. ``role`` is exposed as the role *name*
(resolved via a join to the ``roles`` table) for backward compatibility with the
JWT/permission layer. All access goes through the ``get_session`` context manager.
"""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

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
