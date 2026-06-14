"""Centralized ``actions_logs`` writes via raw SQL + the session Context Manager.

No ORM querying: rows are written with a parameterized INSERT (built from a
trusted column whitelist) executed through ``get_session``, so the same code path
works on MySQL in prod and SQLite in tests. Every user action is persisted here
for auditing (#5).
"""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import action_log as q
from app.db.session import execute_insert, get_session


def insert_action_log(**fields: Any) -> int:
    """Insert one row into ``actions_logs`` and return its id.

    Unknown keys are ignored so callers can pass a superset of fields.
    ``action_name`` is required. ``http_method`` / ``path`` are NOT NULL in the
    schema, so for internal actions (no HTTP context) they default to ``"-"``.
    ``created_at`` is populated by the DB default and must not be supplied here.
    """
    data = {
        k: v
        for k, v in fields.items()
        if k in q.ALLOWED_COLUMNS and v is not None
    }
    if not data.get("action_name"):
        raise ValueError("action_name is required for an action log entry")
    data.setdefault("http_method", "-")
    data.setdefault("path", "-")
    with get_session() as session:
        return execute_insert(session, text(q.build_insert(data.keys())), data)


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "action_name": row["action_name"],
        "school_id": row["school_id"],
        "user_id": row["user_id"],
        "page": row["page"],
        "payload": row["payload"],
        "success": bool(row["success"]),
        "details": row["details"],
        "http_method": row["http_method"],
        "path": row["path"],
        "status_code": row["status_code"],
        "ip_address": row["ip_address"],
        "duration_ms": row["duration_ms"],
        "created_at": row["created_at"],
    }


def get_action_log_by_id(log_id: int) -> dict[str, Any] | None:
    """Return one actions_logs row (used for audit reads / tests)."""
    with get_session() as session:
        row = session.execute(text(q.GET_BY_ID), {"id": log_id}).mappings().first()
        return _to_dict(row)
