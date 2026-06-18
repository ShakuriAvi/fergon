"""Raw SQL for the ``recognition_values`` table (``key`` is a reserved word)."""
from __future__ import annotations

_COLUMNS = "id, `key`, emoji, tone, is_active, created_at, updated_at"

GET_BY_ID = f"SELECT {_COLUMNS} FROM recognition_values WHERE id = :id"

LIST_ALL = f"SELECT {_COLUMNS} FROM recognition_values ORDER BY id"

LIST_ACTIVE = (
    f"SELECT {_COLUMNS} FROM recognition_values WHERE is_active = 1 ORDER BY id"
)

INSERT = (
    "INSERT INTO recognition_values (`key`, emoji, tone) "
    "VALUES (:key, :emoji, :tone)"
)
