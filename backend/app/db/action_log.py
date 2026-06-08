"""Generic raw-SQL insert helper for the ``actions_logs`` table (#5).

No ORM is used; rows are written via the centralized db layer's generic
parameterized ``insert`` helper.
"""
from __future__ import annotations

from typing import Any

from app.db import connection

# Columns accepted by the actions_logs table (matches the migration schema).
_ALLOWED_COLUMNS = {
    "action_name",
    "school_id",
    "user_id",
    "page",
    "payload",
    "success",
    "details",
    "http_method",
    "path",
    "status_code",
    "ip_address",
    "duration_ms",
}


def insert_action_log(**fields: Any) -> int:
    """Insert one row into ``actions_logs`` and return its id.

    Unknown keys are ignored so callers can pass a superset of fields. ``created_at``
    is populated by the DB default and must not be supplied here.
    """
    data = {k: v for k, v in fields.items() if k in _ALLOWED_COLUMNS}
    if "action_name" not in data or not data["action_name"]:
        raise ValueError("action_name is required for an action log entry")
    if "http_method" not in data:
        raise ValueError("http_method is required for an action log entry")
    if "path" not in data:
        raise ValueError("path is required for an action log entry")
    return connection.insert("actions_logs", data)
