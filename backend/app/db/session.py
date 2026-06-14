"""SQLAlchemy engine + session factory (#11).

A single ``Engine`` and ``sessionmaker`` are built once (at app setup via
``init_engine``) from ``Settings.database_url`` and reused for the whole process,
consistent with the configuration singleton.

``get_session`` is the centralized Context Manager for ORM work: it commits on
success, rolls back on error, and always closes. Everything here is synchronous
(per CLAUDE.md) — no async engine/session, no ``await``.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator, Mapping, cast

from sqlalchemy import create_engine
from sqlalchemy.engine import CursorResult, Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.sql.elements import Executable

from app.core.config import get_settings

_engine: Engine | None = None
_SessionLocal: sessionmaker[Session] | None = None


def init_engine(url: str | None = None) -> Engine:
    """Build the engine + session factory once. Called when the app is set up.

    ``url`` overrides ``Settings.database_url`` (used by tests to point at a
    throwaway SQLite database). ``create_engine`` is lazy — no connection is
    opened until a session actually runs a statement.
    """
    global _engine, _SessionLocal
    if _engine is None:
        db_url = url or get_settings().database_url
        _engine = create_engine(db_url, future=True, pool_pre_ping=True)
        _SessionLocal = sessionmaker(
            bind=_engine, future=True, autoflush=False, expire_on_commit=False
        )
    return _engine


def get_engine() -> Engine:
    """Return the shared engine (initializing it on first use)."""
    return init_engine()


@contextmanager
def get_session() -> Iterator[Session]:
    """Yield an ORM session, committing on success and rolling back on error."""
    init_engine()
    assert _SessionLocal is not None  # set by init_engine
    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def execute_insert(
    session: Session,
    statement: Executable,
    params: Mapping[str, Any] | None = None,
) -> int:
    """Run an INSERT and return the new row's autoincrement id.

    ``Session.execute`` is typed to return a generic ``Result``; for a Core
    INSERT it is really a ``CursorResult`` (the only result type that exposes
    ``lastrowid``), so we cast to read it without a type-checker warning.
    """
    result = cast(CursorResult, session.execute(statement, params or {}))
    return result.lastrowid


def reset_engine() -> None:
    """Dispose and drop the engine/session factory (tests only)."""
    global _engine, _SessionLocal
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _SessionLocal = None
