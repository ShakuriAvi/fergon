"""Raw SQL for the ``users`` table.

Reads join ``roles`` so callers get the role *name* and ``access_level`` (the
shape the JWT/permission layer expects).
"""
from __future__ import annotations

_COLUMNS = (
    "u.id, u.email, u.full_name, u.role_id, u.organization_id, "
    "u.points_balance, u.phone, u.avatar_emoji, u.oauth_id, u.is_active, "
    "u.created_at, u.updated_at, "
    "r.name AS role_name, r.access_level AS access_level"
)

_FROM = "FROM users u LEFT JOIN roles r ON r.id = u.role_id"

GET_BY_ID = f"SELECT {_COLUMNS} {_FROM} WHERE u.id = :id"

GET_BY_EMAIL = f"SELECT {_COLUMNS} {_FROM} WHERE u.email = :email"

GET_BY_OAUTH_ID = f"SELECT {_COLUMNS} {_FROM} WHERE u.oauth_id = :oauth_id"

# Active users of an organization that have a role (for the allowance reset).
LIST_ACTIVE_FOR_ORG = (
    f"SELECT {_COLUMNS} {_FROM} "
    "WHERE u.organization_id = :organization_id AND u.is_active = 1 "
    "AND u.role_id IS NOT NULL"
)

INSERT = (
    "INSERT INTO users (email, full_name, role_id, organization_id, oauth_id, "
    "is_active) "
    "VALUES (:email, :full_name, :role_id, :organization_id, :oauth_id, 1)"
)

# Hardcoded search columns (never user-supplied).
SEARCH_COLUMNS = ("u.full_name", "u.email")

# Admin create: includes the profile fields the admin panel manages.
INSERT_ADMIN = (
    "INSERT INTO users (email, full_name, role_id, organization_id, phone, "
    "avatar_emoji, is_active) "
    "VALUES (:email, :full_name, :role_id, :organization_id, :phone, "
    ":avatar_emoji, 1)"
)

UPDATE_ADMIN = (
    "UPDATE users SET full_name = :full_name, role_id = :role_id, "
    "organization_id = :organization_id, phone = :phone, "
    "avatar_emoji = :avatar_emoji WHERE id = :id"
)

SET_ACTIVE = "UPDATE users SET is_active = :is_active WHERE id = :id"

# Names for a set of ids (feed enrichment). ``ids`` is an expanding bindparam.
NAMES_BY_IDS = "SELECT id, full_name FROM users WHERE id IN :ids"

# Top recipients in an org by earned points (feed spotlight / leaderboard).
TOP_BY_POINTS = (
    "SELECT id, full_name, points_balance FROM users "
    "WHERE organization_id = :organization_id AND is_active = 1 "
    "ORDER BY points_balance DESC, id ASC LIMIT :limit"
)

# Add (or subtract, with a negative delta) points to a user's earned balance.
ADD_POINTS_BALANCE = (
    "UPDATE users SET points_balance = points_balance + :delta WHERE id = :id"
)

# Set the earned balance to an absolute value (idempotent seeding).
SET_POINTS_BALANCE = "UPDATE users SET points_balance = :points WHERE id = :id"
