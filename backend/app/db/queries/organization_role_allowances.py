"""Raw SQL for the ``organization_role_allowances`` table."""
from __future__ import annotations

_COLUMNS = "id, organization_id, role_id, monthly_points, created_at, updated_at"

LIST_FOR_ORG = (
    f"SELECT {_COLUMNS} FROM organization_role_allowances "
    "WHERE organization_id = :organization_id"
)

GET_MONTHLY_POINTS = (
    "SELECT monthly_points FROM organization_role_allowances "
    "WHERE organization_id = :organization_id AND role_id = :role_id"
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

UPDATE_POINTS = (
    "UPDATE organization_role_allowances SET monthly_points = :monthly_points "
    "WHERE id = :id"
)
