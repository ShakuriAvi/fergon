"""Centralized ``organization_recognition_values`` queries via raw SQL (#21)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import organization_recognition_values as q
from app.db.session import execute_insert, get_session


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "organization_id": row["organization_id"],
        "recognition_value_id": row["recognition_value_id"],
        "is_active": bool(row["is_active"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def list_for_organization(
    organization_id: int, *, active_only: bool = True
) -> list[dict[str, Any]]:
    with get_session() as session:
        sql = q.LIST_FOR_ORG_ACTIVE if active_only else q.LIST_FOR_ORG
        rows = (
            session.execute(text(sql), {"organization_id": organization_id})
            .mappings()
            .all()
        )
        return [_to_dict(link) for link in rows]


def enabled_value_ids(organization_id: int) -> set[int]:
    """Return the set of active recognition_value ids enabled for the org."""
    with get_session() as session:
        rows = (
            session.execute(
                text(q.ENABLED_VALUE_IDS), {"organization_id": organization_id}
            )
            .mappings()
            .all()
        )
        return {row["recognition_value_id"] for row in rows}


def list_for_organization_joined(organization_id: int) -> list[dict[str, Any]]:
    """Org's links joined to the catalog (key/emoji/tone), active or not."""
    with get_session() as session:
        rows = (
            session.execute(
                text(q.LIST_FOR_ORG_JOINED), {"organization_id": organization_id}
            )
            .mappings()
            .all()
        )
        return [
            {
                "id": r["id"],
                "organization_id": r["organization_id"],
                "recognition_value_id": r["recognition_value_id"],
                "is_active": bool(r["is_active"]),
                "key": r["key"],
                "emoji": r["emoji"],
                "tone": r["tone"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
            }
            for r in rows
        ]


def get_link_by_id(link_id: int) -> dict[str, Any] | None:
    with get_session() as session:
        row = session.execute(text(q.GET_BY_ID), {"id": link_id}).mappings().first()
        return _to_dict(row)


def add_value(*, organization_id: int, recognition_value_id: int) -> int:
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT),
            {
                "organization_id": organization_id,
                "recognition_value_id": recognition_value_id,
            },
        )


def add_or_reactivate_value(
    *, organization_id: int, recognition_value_id: int
) -> tuple[int, bool]:
    """Link a value to an org, reactivating an existing (possibly soft-deleted)
    row instead of inserting a duplicate. Returns ``(link_id, created)`` where
    ``created`` is True only when a brand-new row was inserted."""
    with get_session() as session:
        existing = (
            session.execute(
                text(q.GET_BY_ORG_VALUE),
                {
                    "organization_id": organization_id,
                    "recognition_value_id": recognition_value_id,
                },
            )
            .mappings()
            .first()
        )
        if existing is not None:
            if not existing["is_active"]:
                session.execute(
                    text(q.SET_ACTIVE), {"id": existing["id"], "is_active": 1}
                )
            return existing["id"], False
        new_id = execute_insert(
            session,
            text(q.INSERT),
            {
                "organization_id": organization_id,
                "recognition_value_id": recognition_value_id,
            },
        )
        return new_id, True


def set_link_active(link_id: int, *, is_active: bool) -> None:
    with get_session() as session:
        session.execute(
            text(q.SET_ACTIVE),
            {"id": link_id, "is_active": 1 if is_active else 0},
        )
