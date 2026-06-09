"""Centralized ``users`` queries, now backed by the SQLAlchemy ORM (#11).

These helpers keep their original contract — returning plain ``dict``s (or
``None``) and the new user id — so services/middleware are unchanged. All access
goes through the ``get_session`` context manager in the db layer.
"""
from __future__ import annotations

from typing import Any

from app.db.session import get_session
from app.models.user import User
from app.schemas.user import Role


def _to_dict(user: User | None) -> dict[str, Any] | None:
    """Serialize a ``User`` row to the dict shape callers expect."""
    if user is None:
        return None
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if isinstance(user.role, Role) else user.role,
        "oauth_id": user.oauth_id,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


def get_user_by_email(email: str) -> dict[str, Any] | None:
    """Return the user with the given email, or ``None``."""
    with get_session() as session:
        return _to_dict(session.query(User).filter(User.email == email).first())


def get_user_by_oauth_id(oauth_id: str) -> dict[str, Any] | None:
    """Return the user with the given Google ``oauth_id``, or ``None``."""
    with get_session() as session:
        return _to_dict(
            session.query(User).filter(User.oauth_id == oauth_id).first()
        )


def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    """Return the user with the given id, or ``None``."""
    with get_session() as session:
        return _to_dict(session.get(User, user_id))


def create_user(
    *, email: str, full_name: str, role: str, oauth_id: str | None = None
) -> int:
    """Insert a new user row and return its id."""
    with get_session() as session:
        user = User(
            email=email,
            full_name=full_name,
            role=Role(role) if not isinstance(role, Role) else role,
            oauth_id=oauth_id,
            is_active=True,
        )
        session.add(user)
        session.flush()  # populate the autoincrement id before commit
        return user.id
