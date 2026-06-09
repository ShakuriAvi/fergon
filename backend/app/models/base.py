"""Shared SQLAlchemy declarative base (#11).

All ORM models inherit from this single ``Base`` (per CLAUDE.md). A naming
convention is applied so generated index/constraint names are deterministic and
match the hand-written migration ``0001`` (e.g. ``uq_users_email``,
``ix_actions_logs_action_name``), keeping Alembic autogenerate stable.
"""
from __future__ import annotations

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

_NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_name)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model in the application."""

    metadata = MetaData(naming_convention=_NAMING_CONVENTION)
