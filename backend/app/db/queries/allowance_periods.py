"""Raw SQL for the ``allowance_periods`` table."""
from __future__ import annotations

_COLUMNS = (
    "id, user_id, organization_id, role_id, period_month, base_points, "
    "carried_in_points, total_granted, used_points, created_at, updated_at"
)

GET_CURRENT = (
    f"SELECT {_COLUMNS} FROM allowance_periods "
    "WHERE user_id = :user_id AND period_month = :period_month"
)

LIST_FOR_PERIOD = (
    f"SELECT {_COLUMNS} FROM allowance_periods "
    "WHERE organization_id = :organization_id AND period_month = :period_month"
)

ADD_USED_POINTS = (
    "UPDATE allowance_periods SET used_points = used_points + :points "
    "WHERE user_id = :user_id AND period_month = :period_month"
)

# Atomic spend: only succeeds (rowcount == 1) when the user has a current period
# with enough remaining allowance, preventing over-spend under concurrency.
ADD_USED_POINTS_GUARDED = (
    "UPDATE allowance_periods SET used_points = used_points + :points "
    "WHERE user_id = :user_id AND period_month = :period_month "
    "AND total_granted - used_points >= :points"
)

INSERT = (
    "INSERT INTO allowance_periods "
    "(user_id, organization_id, role_id, period_month, base_points, "
    "carried_in_points, total_granted, used_points) "
    "VALUES (:user_id, :organization_id, :role_id, :period_month, :base_points, "
    ":carried_in_points, :total_granted, :used_points)"
)

# Refresh the grant of an existing period (monthly reset).
UPDATE_GRANT = (
    "UPDATE allowance_periods SET base_points = :base_points, "
    "carried_in_points = :carried_in_points, total_granted = :total_granted, "
    "used_points = :used_points WHERE id = :id"
)
