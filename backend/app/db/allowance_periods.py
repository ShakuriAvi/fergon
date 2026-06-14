"""Centralized ``allowance_periods`` queries via raw SQL + Context Manager (#24)."""
from __future__ import annotations

from datetime import date
from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import allowance_periods as q
from app.db.session import get_session


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "organization_id": row["organization_id"],
        "role_id": row["role_id"],
        "period_month": row["period_month"],
        "base_points": row["base_points"],
        "carried_in_points": row["carried_in_points"],
        "total_granted": row["total_granted"],
        "used_points": row["used_points"],
        "remaining": row["total_granted"] - row["used_points"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_current_period(user_id: int, period_month: date) -> dict[str, Any] | None:
    with get_session() as session:
        row = (
            session.execute(
                text(q.GET_CURRENT),
                {"user_id": user_id, "period_month": period_month.isoformat()},
            )
            .mappings()
            .first()
        )
        return _to_dict(row)


def list_for_period(
    organization_id: int, period_month: date
) -> list[dict[str, Any]]:
    with get_session() as session:
        rows = (
            session.execute(
                text(q.LIST_FOR_PERIOD),
                {
                    "organization_id": organization_id,
                    "period_month": period_month.isoformat(),
                },
            )
            .mappings()
            .all()
        )
        return [_to_dict(r) for r in rows]


def add_used_points(user_id: int, period_month: date, points: int) -> None:
    """Increment ``used_points`` for a user's current period (when giving)."""
    with get_session() as session:
        session.execute(
            text(q.ADD_USED_POINTS),
            {
                "user_id": user_id,
                "period_month": period_month.isoformat(),
                "points": points,
            },
        )
