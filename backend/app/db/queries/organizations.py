"""Raw SQL for the ``organizations`` table."""
from __future__ import annotations

_COLUMNS = "id, name, short_name, city, org_type, is_active, created_at, updated_at"

GET_BY_ID = f"SELECT {_COLUMNS} FROM organizations WHERE id = :id"

LIST_ALL = f"SELECT {_COLUMNS} FROM organizations ORDER BY name"

LIST_ACTIVE = (
    f"SELECT {_COLUMNS} FROM organizations WHERE is_active = 1 ORDER BY name"
)

INSERT = (
    "INSERT INTO organizations (name, short_name, city, org_type) "
    "VALUES (:name, :short_name, :city, :org_type)"
)

# Columns the free-text search (``q``) matches against (hardcoded — never
# user-supplied — so they are safe to interpolate into the SQL fragment).
SEARCH_COLUMNS = ("name", "short_name", "city")

UPDATE = (
    "UPDATE organizations SET name = :name, short_name = :short_name, "
    "city = :city, org_type = :org_type WHERE id = :id"
)

SET_ACTIVE = "UPDATE organizations SET is_active = :is_active WHERE id = :id"
