"""Centralized ``redemptions`` queries via raw SQL + Context Manager (#18)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import redemptions as q
from app.db.session import execute_insert, get_session
from app.schemas.redemption import RedemptionStatus


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "reward_id": row["reward_id"],
        "points_spent": row["points_spent"],
        "status": row["status"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_redemption_by_id(redemption_id: int) -> dict[str, Any] | None:
    with get_session() as session:
        row = (
            session.execute(text(q.GET_BY_ID), {"id": redemption_id})
            .mappings()
            .first()
        )
        return _to_dict(row)


def list_for_user(user_id: int) -> list[dict[str, Any]]:
    with get_session() as session:
        rows = (
            session.execute(text(q.LIST_FOR_USER), {"user_id": user_id})
            .mappings()
            .all()
        )
        return [_to_dict(r) for r in rows]


def create_redemption(
    *,
    user_id: int,
    reward_id: int,
    points_spent: int,
    status: str = "pending",
) -> int:
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT),
            {
                "user_id": user_id,
                "reward_id": reward_id,
                "points_spent": points_spent,
                "status": RedemptionStatus(status).value,
            },
        )
