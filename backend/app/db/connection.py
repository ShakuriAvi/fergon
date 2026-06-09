"""Centralized database layer using the Context Manager pattern.

All SQL for the application is funnelled through this module. Connections are
managed by context managers that commit on success, roll back on error, and
always close. Only **parameterized** queries are used here — callers pass values
separately and never interpolate them into the SQL string.

Per project decision (#3): plain/raw SQL via pymysql, not the SQLAlchemy ORM.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator, Mapping, Sequence

import pymysql
from pymysql.connections import Connection
from pymysql.cursors import DictCursor

from app.core.config import get_settings


def _connect() -> Connection:
    """Open a raw MySQL connection using settings.

    Isolated into its own function so tests can monkeypatch it without touching
    the context-manager logic.
    """
    settings = get_settings()
    return pymysql.connect(
        host=settings.MYSQL_HOST,
        port=settings.MYSQL_PORT,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=settings.MYSQL_DB,
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=False,
    )


@contextmanager
def get_connection() -> Iterator[Connection]:
    """Yield a connection, committing on success and rolling back on error."""
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def db_cursor() -> Iterator[DictCursor]:
    """Yield a cursor bound to a managed connection."""
    with get_connection() as conn:
        cur = conn.cursor()
        try:
            yield cur
        finally:
            cur.close()


# --- Thin query-helper API used by services / db modules -------------------

def execute(query: str, params: Sequence[Any] | Mapping[str, Any] | None = None) -> int:
    """Run a write/DDL statement; return affected row count."""
    with db_cursor() as cur:
        cur.execute(query, params or ())
        return cur.rowcount


def fetch_one(
    query: str, params: Sequence[Any] | Mapping[str, Any] | None = None
) -> dict[str, Any] | None:
    """Run a query and return the first row (or ``None``)."""
    with db_cursor() as cur:
        cur.execute(query, params or ())
        return cur.fetchone()


def fetch_all(
    query: str, params: Sequence[Any] | Mapping[str, Any] | None = None
) -> list[dict[str, Any]]:
    """Run a query and return all rows."""
    with db_cursor() as cur:
        cur.execute(query, params or ())
        return list(cur.fetchall())


def insert(table: str, data: Mapping[str, Any]) -> int:
    """Generic parameterized INSERT; return the new row id (``lastrowid``).

    ``table`` and column names come from trusted code (never user input); values
    are always bound as parameters.
    """
    columns = ", ".join(f"`{col}`" for col in data)
    placeholders = ", ".join(["%s"] * len(data))
    query = f"INSERT INTO `{table}` ({columns}) VALUES ({placeholders})"
    with db_cursor() as cur:
        cur.execute(query, tuple(data.values()))
        return cur.lastrowid


def get_db() -> Iterator[Connection]:
    """FastAPI dependency that injects a managed connection into views/services."""
    with get_connection() as conn:
        yield conn
