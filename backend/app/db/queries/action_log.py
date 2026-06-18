"""Raw SQL for the ``actions_logs`` audit table.

The set of writable columns is a trusted whitelist; the INSERT is built from
whichever of those columns the caller actually supplied. Column names come from
this module (never user input); values are always bound as parameters.
"""
from __future__ import annotations

from typing import Iterable

_TABLE = "actions_logs"

# Columns that may be written to actions_logs (matches the migration schema).
ALLOWED_COLUMNS: frozenset[str] = frozenset(
    {
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
)


def build_insert(columns: Iterable[str]) -> str:
    """Return a parameterized INSERT for the given (whitelisted) columns."""
    cols = list(columns)
    col_list = ", ".join(f"`{col}`" for col in cols)
    placeholders = ", ".join(f":{col}" for col in cols)
    return f"INSERT INTO `{_TABLE}` ({col_list}) VALUES ({placeholders})"


GET_BY_ID = (
    "SELECT id, action_name, school_id, user_id, page, payload, success, "
    "details, http_method, path, status_code, ip_address, duration_ms, "
    f"created_at FROM `{_TABLE}` WHERE id = :id"
)
