"""Monthly giving-allowance reset + rollover (#24).

Synchronous business logic (per CLAUDE.md — no async). At the start of a month,
per organization:

1. Close the previous period: for every user whose role ``rolls_up``, compute the
   leftover (``total_granted - used_points``).
2. Pool the leftovers and add the sum as ``carried_in_points`` to the new period
   of the organization's manager role user(s) (``is_manager``).
3. Open a fresh period for every active user, granting ``base_points`` from the
   organization's per-role config (``organization_role_allowances``).

The whole reset runs in a single transaction for atomicity, using raw SQL.
"""
from __future__ import annotations

import logging
from datetime import date
from typing import Any

from sqlalchemy import text

from app.core.logging import store_log
from app.db.queries import allowance_periods as periods_q
from app.db.queries import organization_role_allowances as ora_q
from app.db.queries import roles as roles_q
from app.db.queries import users as users_q
from app.db.session import get_session


def month_start(value: date) -> date:
    """First day of the month for ``value``."""
    return value.replace(day=1)


def reset_monthly_allowances(
    organization_id: int,
    period_month: date,
    *,
    previous_period_month: date | None = None,
) -> dict[str, Any]:
    """Reset allowances for one organization for ``period_month``.

    Returns a summary dict: number of periods created, the rolled-over pool, and
    the manager user ids that received it.
    """
    period_month = month_start(period_month)
    prev = (
        month_start(previous_period_month)
        if previous_period_month is not None
        else None
    )

    with get_session() as session:
        roles = {
            row["id"]: row
            for row in session.execute(text(roles_q.LIST_ALL)).mappings()
        }
        config = {
            row["role_id"]: row["monthly_points"]
            for row in session.execute(
                text(ora_q.LIST_FOR_ORG), {"organization_id": organization_id}
            ).mappings()
        }
        users = list(
            session.execute(
                text(users_q.LIST_ACTIVE_FOR_ORG),
                {"organization_id": organization_id},
            ).mappings()
        )

        # 1 + 2: pool leftovers from rolls_up roles in the previous period.
        pool = 0
        if prev is not None:
            prev_periods = {
                p["user_id"]: p
                for p in session.execute(
                    text(periods_q.LIST_FOR_PERIOD),
                    {
                        "organization_id": organization_id,
                        "period_month": prev.isoformat(),
                    },
                ).mappings()
            }
            for user in users:
                role = roles.get(user["role_id"])
                period = prev_periods.get(user["id"])
                if role is not None and role["rolls_up"] and period is not None:
                    leftover = period["total_granted"] - period["used_points"]
                    if leftover > 0:
                        pool += leftover

        manager_ids = [
            u["id"]
            for u in users
            if roles.get(u["role_id"]) is not None
            and roles[u["role_id"]]["is_manager"]
        ]
        carried_by_user: dict[int, int] = {}
        if manager_ids and pool > 0:
            share, remainder = divmod(pool, len(manager_ids))
            for idx, mid in enumerate(manager_ids):
                carried_by_user[mid] = share + (remainder if idx == 0 else 0)

        # 3: open (or refresh) a period for every active user.
        existing = {
            p["user_id"]: p
            for p in session.execute(
                text(periods_q.LIST_FOR_PERIOD),
                {
                    "organization_id": organization_id,
                    "period_month": period_month.isoformat(),
                },
            ).mappings()
        }
        created = 0
        for user in users:
            user_id = user["id"]
            role_id = user["role_id"]
            base = config.get(role_id, 0)
            carried = carried_by_user.get(user_id, 0)
            total = base + carried
            period = existing.get(user_id)
            if period is None:
                session.execute(
                    text(periods_q.INSERT),
                    {
                        "user_id": user_id,
                        "organization_id": organization_id,
                        "role_id": role_id,
                        "period_month": period_month.isoformat(),
                        "base_points": base,
                        "carried_in_points": carried,
                        "total_granted": total,
                        "used_points": 0,
                    },
                )
                created += 1
            else:
                session.execute(
                    text(periods_q.UPDATE_GRANT),
                    {
                        "id": period["id"],
                        "base_points": base,
                        "carried_in_points": carried,
                        "total_granted": total,
                        "used_points": 0,
                    },
                )

    store_log(
        "allowance_reset",
        level=logging.INFO,
        school_id=organization_id,
        details=(
            f"reset {created} periods for org={organization_id} "
            f"month={period_month} pool={pool}"
        ),
    )
    return {
        "organization_id": organization_id,
        "period_month": period_month,
        "periods_created": created,
        "rolled_over_pool": pool,
        "manager_user_ids": manager_ids,
    }
