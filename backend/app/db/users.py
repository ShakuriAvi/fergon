"""Raw-SQL queries for the ``users`` table, centralized in the db layer."""
from __future__ import annotations

from typing import Any

from app.db import connection


def get_user_by_email(email: str) -> dict[str, Any] | None:
    return connection.fetch_one(
        "SELECT * FROM `users` WHERE email = %s", (email,)
    )


def get_user_by_oauth_id(oauth_id: str) -> dict[str, Any] | None:
    return connection.fetch_one(
        "SELECT * FROM `users` WHERE oauth_id = %s", (oauth_id,)
    )


def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    return connection.fetch_one(
        "SELECT * FROM `users` WHERE id = %s", (user_id,)
    )


def create_user(
    *, email: str, full_name: str, role: str, oauth_id: str | None = None
) -> int:
    """Insert a new user row and return its id."""
    return connection.insert(
        "users",
        {
            "email": email,
            "full_name": full_name,
            "role": role,
            "oauth_id": oauth_id,
            "is_active": True,
        },
    )
