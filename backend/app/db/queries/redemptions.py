"""Raw SQL for the ``redemptions`` table."""
from __future__ import annotations

_COLUMNS = "id, user_id, reward_id, points_spent, status, created_at, updated_at"

GET_BY_ID = f"SELECT {_COLUMNS} FROM redemptions WHERE id = :id"

LIST_FOR_USER = (
    f"SELECT {_COLUMNS} FROM redemptions WHERE user_id = :user_id "
    "ORDER BY created_at DESC"
)

INSERT = (
    "INSERT INTO redemptions (user_id, reward_id, points_spent, status) "
    "VALUES (:user_id, :reward_id, :points_spent, :status)"
)
