"""Consumer (non-admin) read business logic (#41).

Org-scoped feed, wallet, rewards and leaderboard for the authenticated user.
Everything is sourced from the DB (the dev seed, #40) — no mock data.
"""
from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import HTTPException, status

from app.db import allowance_periods as periods_db
from app.db import organization_recognition_values as orv_db
from app.db import posts as posts_db
from app.db import recognition_values as values_db
from app.db import rewards as rewards_db
from app.db import users as users_db
from app.translations.translator import t


def _require_org(organization_id: int | None) -> int:
    if organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=t("common.not_found")
        )
    return organization_id


def get_feed(
    organization_id: int | None, *, limit: int, offset: int
) -> tuple[list[dict[str, Any]], int]:
    org_id = _require_org(organization_id)
    posts, total = posts_db.list_feed_page(
        organization_id=org_id, limit=limit, offset=offset
    )
    # Enrich with user names and value details (bulk lookups, no N+1).
    user_ids = [p["from_user_id"] for p in posts] + [p["to_user_id"] for p in posts]
    names = users_db.names_for_ids(user_ids)
    value_rows, _ = values_db.list_values_page(include_inactive=True, limit=500, offset=0)
    values_by_id = {v["id"]: v for v in value_rows}

    items: list[dict[str, Any]] = []
    for p in posts:
        vals = [
            {
                "id": v["id"],
                "key": v["key"],
                "emoji": v.get("emoji"),
                "tone": v.get("tone"),
            }
            for vid in p["recognition_value_ids"]
            if (v := values_by_id.get(vid)) is not None
        ]
        items.append(
            {
                "id": p["id"],
                "from_user_id": p["from_user_id"],
                "from_name": names.get(p["from_user_id"], "—"),
                "to_user_id": p["to_user_id"],
                "to_name": names.get(p["to_user_id"], "—"),
                "points": p["points"],
                "message": p["message"],
                "values": vals,
                "created_at": p["created_at"],
            }
        )
    return items, total


def get_wallet(user_id: int) -> dict[str, Any]:
    user = users_db.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    month = date.today().replace(day=1)
    period = periods_db.get_current_period(user_id, month)
    total = period["total_granted"] if period else 0
    used = period["used_points"] if period else 0
    return {
        "points_balance": user["points_balance"],
        "allowance_total": total,
        "allowance_used": used,
        "allowance_remaining": max(0, total - used),
        "period_month": month,
    }


def list_rewards() -> list[dict[str, Any]]:
    """In-stock, active rewards for redemption."""
    rewards, _ = rewards_db.list_rewards_page(include_inactive=False, limit=200, offset=0)
    return [r for r in rewards if r["in_stock"]]


def get_leaderboard(organization_id: int | None, *, limit: int = 6) -> list[dict[str, Any]]:
    org_id = _require_org(organization_id)
    return users_db.top_by_points(org_id, limit=limit)


def list_org_members(
    organization_id: int | None, *, exclude_user_id: int | None = None
) -> list[dict[str, Any]]:
    """Active users in the org (recipient picker for giving)."""
    org_id = _require_org(organization_id)
    members, _ = users_db.list_users_page(
        organization_id=org_id, include_inactive=False, limit=500, offset=0
    )
    return [
        {"id": m["id"], "full_name": m["full_name"]}
        for m in members
        if m["id"] != exclude_user_id
    ]


def list_org_values(organization_id: int | None) -> list[dict[str, Any]]:
    """Recognition values enabled for the org (value picker for giving)."""
    org_id = _require_org(organization_id)
    rows = orv_db.list_for_organization_joined(org_id)
    return [
        {"id": r["recognition_value_id"], "key": r["key"], "emoji": r.get("emoji"), "tone": r.get("tone")}
        for r in rows
        if r["is_active"]
    ]
