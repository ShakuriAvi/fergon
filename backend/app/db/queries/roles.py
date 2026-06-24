"""Raw SQL for the ``roles`` table."""
from __future__ import annotations

_COLUMNS = (
    "id, name, name_he, access_level, is_manager, rolls_up, is_active, "
    "created_at, updated_at"
)

# Hardcoded search columns (never user-supplied).
SEARCH_COLUMNS = ("name", "name_he")

GET_BY_ID = f"SELECT {_COLUMNS} FROM roles WHERE id = :id"

GET_BY_NAME = f"SELECT {_COLUMNS} FROM roles WHERE name = :name"

LIST_ALL = f"SELECT {_COLUMNS} FROM roles ORDER BY id"

INSERT = (
    "INSERT INTO roles (name, name_he, access_level, is_manager, rolls_up) "
    "VALUES (:name, :name_he, :access_level, :is_manager, :rolls_up)"
)

UPDATE = (
    "UPDATE roles SET name = :name, name_he = :name_he, "
    "access_level = :access_level, is_manager = :is_manager, "
    "rolls_up = :rolls_up WHERE id = :id"
)

SET_ACTIVE = "UPDATE roles SET is_active = :is_active WHERE id = :id"

# How many users currently reference a role (for the in-use warning on delete).
COUNT_USERS = "SELECT COUNT(*) AS n FROM users WHERE role_id = :role_id"

# Resolve a role id from its name (used when creating a user by role name).
GET_ID_BY_NAME = "SELECT id FROM roles WHERE name = :name"
