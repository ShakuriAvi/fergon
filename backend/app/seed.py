"""Dev-only local seed (#40).

Mirrors the content that used to live in ``frontend/src/data/mock.js`` (the same
schools, users, recognition values, rewards and recognition posts) so the app is
driven by real backend data instead of frontend mock. Adds users for the roles
the mock lacked (admin/secretary/student/server) so every role can be simulated
via the dev email-login (#39).

Guarded to ``APP_ENV == "dev"`` and **idempotent** (safe to run repeatedly):
re-running creates no duplicates. Runs automatically at app startup in dev (see
``create_app``) and can be run manually with ``python -m app.seed``.
"""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path
from typing import Any

from sqlalchemy import text

from app.core.config import get_settings
from app.db import organization_recognition_values as orv_db
from app.db import organization_role_allowances as ora_db
from app.db import organizations as orgs_db
from app.db import posts as posts_db
from app.db import recognition_values as values_db
from app.db import rewards as rewards_db
from app.db import roles as roles_db
from app.db import users as users_db
from app.db.queries import allowance_periods as periods_q
from app.db.session import get_session

logger = logging.getLogger("fergon.seed")

EMAIL_DOMAIN = "fergon.dev"

# --- Content mirrored from frontend/src/data/mock.js -----------------------
# The Hebrew seed *content* lives in the sibling ``seed_data.json`` data file
# (not in this source) so the .py stays English-only per CLAUDE.md. Here we just
# load it and reshape it into the structures the seeding helpers below expect.

_DATA_FILE = Path(__file__).with_name("seed_data.json")


def _load_seed_data() -> dict[str, Any]:
    with _DATA_FILE.open(encoding="utf-8") as fh:
        return json.load(fh)


_DATA = _load_seed_data()

SCHOOLS = _DATA["schools"]

# value id -> (key, emoji, tone)
VALUES = {vid: (v["key"], v["emoji"], v["tone"]) for vid, v in _DATA["values"].items()}


def _user_tuples(rows: list[dict[str, Any]]) -> list[tuple]:
    """(key, full_name, role_name, school_key, points, allowance, given)."""
    return [
        (u["key"], u["full_name"], u["role"], u["school"], u["points"], u["allowance"], u["given"])
        for u in rows
    ]


# mock users + extra users so every role in the roles table has a seeded user.
MOCK_USERS = _user_tuples(_DATA["users"])
EXTRA_USERS = _user_tuples(_DATA["extra_users"])

# rewards: (provider, title, category, cost, emoji, color, blurb)
REWARDS = [
    (r["provider"], r["title"], r["category"], r["cost"], r["emoji"], r["color"], r["blurb"])
    for r in _DATA["rewards"]
]

# recognition posts: (from_key, to_key, value_id, points, message)
RECOGNITIONS = [
    (r["from"], r["to"], r["value"], r["points"], r["message"]) for r in _DATA["recognitions"]
]

# Per-role monthly giving budget seeded for every organization.
ROLE_ALLOWANCES = _DATA["role_allowances"]


def _email(key: str) -> str:
    return f"{key}@{EMAIL_DOMAIN}"


def _seed_organizations() -> dict[str, int]:
    existing = {o["name"]: o["id"] for o in orgs_db.list_organizations()}
    ids: dict[str, int] = {}
    for s in SCHOOLS:
        if s["name"] in existing:
            ids[s["key"]] = existing[s["name"]]
        else:
            ids[s["key"]] = orgs_db.create_organization(
                name=s["name"], short_name=s["short_name"], city=s["city"], org_type="school"
            )
    return ids


def _seed_values() -> dict[str, int]:
    ids: dict[str, int] = {}
    for vid, (key, emoji, tone) in VALUES.items():
        existing = values_db.get_value_by_key(key)
        ids[vid] = existing["id"] if existing else values_db.create_value(key=key, emoji=emoji, tone=tone)
    return ids


def _seed_users(org_ids: dict[str, int]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for key, full_name, role_name, school_key, points, allowance, given in (*MOCK_USERS, *EXTRA_USERS):
        email = _email(key)
        existing = users_db.get_user_by_email(email)
        if existing is None:
            uid = users_db.create_user_admin(
                email=email,
                full_name=full_name,
                role_id=roles_db.get_role_by_name(role_name)["id"],
                organization_id=org_ids[school_key],
            )
        else:
            uid = existing["id"]
        # Set the earned balance to the mock value (idempotent: absolute set).
        users_db.set_points_balance(uid, points)
        out[key] = {"id": uid, "allowance": allowance, "given": given,
                    "role_name": role_name, "org_id": org_ids[school_key]}
    return out


def _seed_org_values(org_ids: dict[str, int], value_ids: dict[str, int]) -> None:
    for org_id in org_ids.values():
        for vid in value_ids.values():
            orv_db.add_or_reactivate_value(organization_id=org_id, recognition_value_id=vid)


def _seed_role_allowances(org_ids: dict[str, int]) -> None:
    for org_id in org_ids.values():
        for role_name, points in ROLE_ALLOWANCES.items():
            role = roles_db.get_role_by_name(role_name)
            if role is not None:
                ora_db.set_allowance(organization_id=org_id, role_id=role["id"], monthly_points=points)


def _seed_rewards() -> None:
    existing = {(r["provider"], r["title"]) for r in rewards_db.list_rewards()}
    for provider, title, category, cost, emoji, color, blurb in REWARDS:
        if (provider, title) not in existing:
            rewards_db.create_reward(
                provider=provider, title=title, category=category, cost=cost,
                emoji=emoji, color=color, blurb=blurb,
            )


def _seed_allowance_periods(users: dict[str, dict[str, Any]]) -> None:
    month = date.today().replace(day=1).isoformat()
    with get_session() as session:
        for u in users.values():
            existing = session.execute(
                text(periods_q.GET_CURRENT), {"user_id": u["id"], "period_month": month}
            ).mappings().first()
            if existing is not None:
                continue
            role = roles_db.get_role_by_name(u["role_name"])
            session.execute(
                text(periods_q.INSERT),
                {
                    "user_id": u["id"],
                    "organization_id": u["org_id"],
                    "role_id": role["id"],
                    "period_month": month,
                    "base_points": u["allowance"],
                    "carried_in_points": 0,
                    "total_granted": u["allowance"],
                    "used_points": u["given"],
                },
            )


def _seed_posts(users: dict[str, dict[str, Any]], value_ids: dict[str, int]) -> None:
    # Idempotency: only seed posts when there are none yet (any org).
    if posts_db.list_feed(limit=1):
        return
    for from_key, to_key, vid, points, message in RECOGNITIONS:
        giver = users[from_key]
        posts_db.create_post(
            from_user_id=giver["id"],
            to_user_id=users[to_key]["id"],
            organization_id=giver["org_id"],
            points=points,
            message=message,
            recognition_value_ids=[value_ids[vid]],
        )


def seed_all() -> None:
    """Populate the DB with the mock-mirrored content. Dev-only + idempotent."""
    if get_settings().APP_ENV.lower() != "dev":
        logger.info("seed skipped: APP_ENV is not 'dev'")
        return
    org_ids = _seed_organizations()
    value_ids = _seed_values()
    users = _seed_users(org_ids)
    _seed_org_values(org_ids, value_ids)
    _seed_role_allowances(org_ids)
    _seed_rewards()
    _seed_allowance_periods(users)
    _seed_posts(users, value_ids)
    logger.info("seed complete: %d orgs, %d users", len(org_ids), len(users))


if __name__ == "__main__":  # pragma: no cover - manual entrypoint
    from app.core.logging import setup_logging

    setup_logging()
    seed_all()
