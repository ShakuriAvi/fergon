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

GET_BY_ID = (
    f"SELECT {_COLUMNS} FROM organization_recognition_values WHERE id = :id"
)

# An org's selected values joined to the catalog (key/emoji), active or not.
LIST_FOR_ORG_JOINED = (
    "SELECT orv.id, orv.organization_id, orv.recognition_value_id, "
    "orv.is_active, orv.created_at, orv.updated_at, "
    "rv.`key` AS `key`, rv.emoji AS emoji, rv.tone AS tone "
    "FROM organization_recognition_values orv "
    "JOIN recognition_values rv ON rv.id = orv.recognition_value_id "
    "WHERE orv.organization_id = :organization_id "
    "ORDER BY orv.id"
)

# Look up an existing link (active or not) for the (org, value) pair.
GET_BY_ORG_VALUE = (
    "SELECT id, is_active FROM organization_recognition_values "
    "WHERE organization_id = :organization_id "
    "AND recognition_value_id = :recognition_value_id"
)

INSERT = (
    "INSERT INTO organization_recognition_values "
    "(organization_id, recognition_value_id) "
    "VALUES (:organization_id, :recognition_value_id)"
)

SET_ACTIVE = (
    "UPDATE organization_recognition_values SET is_active = :is_active "
    "WHERE id = :id"
)
