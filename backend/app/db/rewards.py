"""Centralized ``rewards`` queries via raw SQL + Context Manager (#17)."""
from __future__ import annotations

from typing import Any, Mapping

from sqlalchemy import text

from app.db._filters import build_list_sql
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
        "is_active": bool(row["is_active"]),
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


def list_rewards_page(
    *,
    q_text: str | None = None,
    provider: str | None = None,
    category: str | None = None,
    include_inactive: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    extra_where: list[str] = []
    extra_params: dict[str, Any] = {}
    if provider:
        extra_where.append("provider = :provider")
        extra_params["provider"] = provider
    if category:
        extra_where.append("category = :category")
        extra_params["category"] = RewardCategory(category).value
    list_sql, count_sql, count_params, list_params = build_list_sql(
        columns=q._COLUMNS,
        from_clause="rewards",
        order_by="cost",
        search_columns=q.SEARCH_COLUMNS,
        q=q_text,
        include_inactive=include_inactive,
        limit=limit,
        offset=offset,
        extra_where=extra_where,
        extra_params=extra_params,
    )
    with get_session() as session:
        rows = session.execute(text(list_sql), list_params).mappings().all()
        total = session.execute(text(count_sql), count_params).scalar_one()
        return [_to_dict(r) for r in rows], int(total)


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


def update_reward(
    reward_id: int,
    *,
    provider: str,
    title: str,
    category: str,
    cost: int,
    emoji: str | None,
    color: str | None,
    blurb: str | None,
    in_stock: bool,
) -> None:
    with get_session() as session:
        session.execute(
            text(q.UPDATE),
            {
                "id": reward_id,
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


def set_reward_active(reward_id: int, *, is_active: bool) -> None:
    """Soft-delete / reactivate a reward (``is_active`` flag)."""
    with get_session() as session:
        session.execute(
            text(q.SET_ACTIVE),
            {"id": reward_id, "is_active": 1 if is_active else 0},
        )
