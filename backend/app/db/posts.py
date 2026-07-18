"""Centralized ``posts`` queries via raw SQL + Context Manager (#15).

``recognition_value_ids`` is a JSON column: it is bound as a JSON-encoded string
on write and decoded back into a ``list[int]`` on read.
"""
from __future__ import annotations

import json
from datetime import date
from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import posts as q
from app.db.session import execute_insert, get_session


def _decode_value_ids(raw: Any) -> list[int]:
    """Decode the JSON ``recognition_value_ids`` column into a list."""
    if raw is None:
        return []
    if isinstance(raw, (list, tuple)):
        return list(raw)
    return list(json.loads(raw))


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "from_user_id": row["from_user_id"],
        "to_user_id": row["to_user_id"],
        "organization_id": row["organization_id"],
        "points": row["points"],
        "message": row["message"],
        "recognition_value_ids": _decode_value_ids(row["recognition_value_ids"]),
        "data_date": row["data_date"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_post_by_id(post_id: int) -> dict[str, Any] | None:
    with get_session() as session:
        row = session.execute(text(q.GET_BY_ID), {"id": post_id}).mappings().first()
        return _to_dict(row)


def list_feed(
    *, organization_id: int | None = None, limit: int = 50
) -> list[dict[str, Any]]:
    """Posts ordered by recency, optionally scoped to one organization."""
    with get_session() as session:
        if organization_id is not None:
            rows = (
                session.execute(
                    text(q.LIST_FEED_FOR_ORG),
                    {"organization_id": organization_id, "limit": limit},
                )
                .mappings()
                .all()
            )
        else:
            rows = (
                session.execute(text(q.LIST_FEED), {"limit": limit})
                .mappings()
                .all()
            )
        return [_to_dict(p) for p in rows]


def list_feed_page(
    *,
    organization_id: int,
    limit: int = 20,
    offset: int = 0,
    recognition_value_id: int | None = None,
) -> tuple[list[dict[str, Any]], int]:
    """Org-scoped feed page (most recent first) + total count.

    When ``recognition_value_id`` is given, filters to posts tagged with that
    value. JSON-array membership isn't portable across SQL dialects, so the
    filtered path fetches every org post and paginates in Python instead.
    """
    if recognition_value_id is not None:
        with get_session() as session:
            rows = (
                session.execute(
                    text(q.LIST_FEED_FOR_ORG_ALL), {"organization_id": organization_id}
                )
                .mappings()
                .all()
            )
        matches = [
            p for p in (_to_dict(r) for r in rows)
            if recognition_value_id in p["recognition_value_ids"]
        ]
        return matches[offset : offset + limit], len(matches)

    with get_session() as session:
        rows = (
            session.execute(
                text(q.LIST_FEED_FOR_ORG_PAGED),
                {"organization_id": organization_id, "limit": limit, "offset": offset},
            )
            .mappings()
            .all()
        )
        total = session.execute(
            text(q.COUNT_FOR_ORG), {"organization_id": organization_id}
        ).scalar_one()
        return [_to_dict(p) for p in rows], int(total)


def list_for_user(user_id: int, *, direction: str = "received") -> list[dict[str, Any]]:
    """Posts received by (default) or given by the user."""
    sql = q.LIST_RECEIVED if direction == "received" else q.LIST_GIVEN
    with get_session() as session:
        rows = session.execute(text(sql), {"user_id": user_id}).mappings().all()
        return [_to_dict(p) for p in rows]


def create_post(
    *,
    from_user_id: int,
    to_user_id: int,
    organization_id: int,
    points: int = 0,
    message: str | None = None,
    recognition_value_ids: list[int] | None = None,
    data_date: date | None = None,
) -> int:
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT),
            {
                "from_user_id": from_user_id,
                "to_user_id": to_user_id,
                "organization_id": organization_id,
                "points": points,
                "message": message,
                "recognition_value_ids": json.dumps(recognition_value_ids or []),
                "data_date": data_date.isoformat() if data_date else None,
            },
        )
