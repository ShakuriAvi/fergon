"""Raw SQL for the ``roles`` table."""
from __future__ import annotations

_COLUMNS = (
    "id, name, name_he, access_level, is_manager, rolls_up, created_at, updated_at"
)

GET_BY_ID = f"SELECT {_COLUMNS} FROM roles WHERE id = :id"

GET_BY_NAME = f"SELECT {_COLUMNS} FROM roles WHERE name = :name"

LIST_ALL = f"SELECT {_COLUMNS} FROM roles ORDER BY id"

INSERT = (
    "INSERT INTO roles (name, name_he, access_level, is_manager, rolls_up) "
    "VALUES (:name, :name_he, :access_level, :is_manager, :rolls_up)"
)

# Resolve a role id from its name (used when creating a user by role name).
GET_ID_BY_NAME = "SELECT id FROM roles WHERE name = :name"
