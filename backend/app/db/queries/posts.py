"""Raw SQL for the ``posts`` table.

``recognition_value_ids`` is a JSON column; callers bind it as a JSON-encoded
string and decode it on read (see ``app.db.posts``).
"""
from __future__ import annotations

_COLUMNS = (
    "id, from_user_id, to_user_id, organization_id, points, message, "
    "recognition_value_ids, data_date, created_at, updated_at"
)

GET_BY_ID = f"SELECT {_COLUMNS} FROM posts WHERE id = :id"

LIST_FEED = f"SELECT {_COLUMNS} FROM posts ORDER BY created_at DESC LIMIT :limit"

LIST_FEED_FOR_ORG = (
    f"SELECT {_COLUMNS} FROM posts WHERE organization_id = :organization_id "
    "ORDER BY created_at DESC LIMIT :limit"
)

LIST_FEED_FOR_ORG_PAGED = (
    f"SELECT {_COLUMNS} FROM posts WHERE organization_id = :organization_id "
    "ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset"
)

# recognition_value_ids is a JSON column; membership filtering isn't portable
# across SQL dialects (MySQL JSON_CONTAINS vs. SQLite), so callers fetch every
# org post unpaginated and filter/paginate in Python (see app.db.posts).
LIST_FEED_FOR_ORG_ALL = (
    f"SELECT {_COLUMNS} FROM posts WHERE organization_id = :organization_id "
    "ORDER BY created_at DESC, id DESC"
)

COUNT_FOR_ORG = "SELECT COUNT(*) AS n FROM posts WHERE organization_id = :organization_id"

LIST_RECEIVED = (
    f"SELECT {_COLUMNS} FROM posts WHERE to_user_id = :user_id "
    "ORDER BY created_at DESC"
)

LIST_GIVEN = (
    f"SELECT {_COLUMNS} FROM posts WHERE from_user_id = :user_id "
    "ORDER BY created_at DESC"
)

INSERT = (
    "INSERT INTO posts "
    "(from_user_id, to_user_id, organization_id, points, message, "
    "recognition_value_ids, data_date) "
    "VALUES (:from_user_id, :to_user_id, :organization_id, :points, :message, "
    ":recognition_value_ids, :data_date)"
)
