"""Raw SQL for the ``rewards`` table."""
from __future__ import annotations

_COLUMNS = (
    "id, provider, title, category, cost, emoji, color, blurb, in_stock, "
    "created_at, updated_at"
)

GET_BY_ID = f"SELECT {_COLUMNS} FROM rewards WHERE id = :id"

LIST_ALL = f"SELECT {_COLUMNS} FROM rewards ORDER BY cost"

LIST_IN_STOCK = f"SELECT {_COLUMNS} FROM rewards WHERE in_stock = 1 ORDER BY cost"

INSERT = (
    "INSERT INTO rewards "
    "(provider, title, category, cost, emoji, color, blurb, in_stock) "
    "VALUES (:provider, :title, :category, :cost, :emoji, :color, :blurb, :in_stock)"
)
