"""Centralized ``rewards`` queries via raw SQL + Context Manager (#17)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db.queries import rewards as q
from app.db.session import execute_insert, get_session
from app.schemas.reward import RewardCategory


def _to_dict(row: Mapping[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return {
        "id": row["id"],
        "provider": row["provider"],
        "title": row["title"],
        "category": row["category"],
        "cost": row["cost"],
        "emoji": row["emoji"],
        "color": row["color"],
        "blurb": row["blurb"],
        "in_stock": bool(row["in_stock"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_reward_by_id(reward_id: int) -> dict[str, Any] | None:
    with get_session() as session:
        row = session.execute(text(q.GET_BY_ID), {"id": reward_id}).mappings().first()
        return _to_dict(row)


def list_rewards(*, in_stock_only: bool = False) -> list[dict[str, Any]]:
    with get_session() as session:
        sql = q.LIST_IN_STOCK if in_stock_only else q.LIST_ALL
        rows = session.execute(text(sql)).mappings().all()
        return [_to_dict(r) for r in rows]


def create_reward(
    *,
    provider: str,
    title: str,
    category: str,
    cost: int,
    emoji: str | None = None,
    color: str | None = None,
    blurb: str | None = None,
    in_stock: bool = True,
) -> int:
    with get_session() as session:
        return execute_insert(
            session,
            text(q.INSERT),
            {
                "provider": provider,
                "title": title,
                "category": RewardCategory(category).value,
                "cost": cost,
                "emoji": emoji,
                "color": color,
                "blurb": blurb,
                "in_stock": in_stock,
            },
        )
