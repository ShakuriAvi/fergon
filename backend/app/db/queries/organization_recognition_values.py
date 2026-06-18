"""Raw SQL for the ``organization_recognition_values`` junction table."""
from __future__ import annotations

_COLUMNS = (
    "id, organization_id, recognition_value_id, is_active, created_at, updated_at"
)

LIST_FOR_ORG = (
    f"SELECT {_COLUMNS} FROM organization_recognition_values "
    "WHERE organization_id = :organization_id"
)

LIST_FOR_ORG_ACTIVE = (
    f"SELECT {_COLUMNS} FROM organization_recognition_values "
    "WHERE organization_id = :organization_id AND is_active = 1"
)

# Just the enabled value ids for an organization.
ENABLED_VALUE_IDS = (
    "SELECT recognition_value_id FROM organization_recognition_values "
    "WHERE organization_id = :organization_id AND is_active = 1"
)

INSERT = (
    "INSERT INTO organization_recognition_values "
    "(organization_id, recognition_value_id) "
    "VALUES (:organization_id, :recognition_value_id)"
)
