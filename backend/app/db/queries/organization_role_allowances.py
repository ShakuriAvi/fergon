"""Raw SQL for the ``organization_role_allowances`` table."""
from __future__ import annotations

_COLUMNS = (
    "id, organization_id, role_id, monthly_points, is_active, "
    "created_at, updated_at"
)

GET_BY_ID = f"SELECT {_COLUMNS} FROM organization_role_allowances WHERE id = :id"

LIST_FOR_ORG = (
    f"SELECT {_COLUMNS} FROM organization_role_allowances "
    "WHERE organization_id = :organization_id"
)

# Every active role for the org with its (active) allowance, if any. Roles with
# no allowance row show NULL monthly_points (unset).
LIST_ROLES_WITH_ALLOWANCE = (
    "SELECT r.id AS role_id, r.name, r.name_he, r.access_level, "
    "a.id AS allowance_id, a.monthly_points, a.is_active "
    "FROM roles r "
    "LEFT JOIN organization_role_allowances a "
    "  ON a.role_id = r.id AND a.organization_id = :organization_id "
    "  AND a.is_active = 1 "
    "WHERE r.is_active = 1 "
    "ORDER BY r.id"
)

GET_MONTHLY_POINTS = (
    "SELECT monthly_points FROM organization_role_allowances "
    "WHERE organization_id = :organization_id AND role_id = :role_id "
    "AND is_active = 1"
)

# Upsert support: look up the existing row id, then insert or update it.
GET_ID_BY_ORG_ROLE = (
    "SELECT id FROM organization_role_allowances "
    "WHERE organization_id = :organization_id AND role_id = :role_id"
)

INSERT = (
    "INSERT INTO organization_role_allowances "
    "(organization_id, role_id, monthly_points) "
    "VALUES (:organization_id, :role_id, :monthly_points)"
)

# Re-setting an allowance updates the points and reactivates the row (so a
# previously soft-deleted (org, role) pair returns instead of breaking the
# unique constraint).
UPDATE_POINTS = (
    "UPDATE organization_role_allowances "
    "SET monthly_points = :monthly_points, is_active = 1 WHERE id = :id"
)

SET_ACTIVE = (
    "UPDATE organization_role_allowances SET is_active = :is_active WHERE id = :id"
)
