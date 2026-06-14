"""Reward redemption business logic (#18).

Redeeming: ensure the reward exists and the user has enough earned points, then
record the redemption and debit the user's balance — all in one transaction.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import text

from app.core.logging import store_log
from app.db.queries import redemptions as redemptions_q
from app.db.queries import rewards as rewards_q
from app.db.queries import users as users_q
from app.db.session import execute_insert, get_session
from app.schemas.redemption import RedemptionStatus
from app.translations.translator import t


def redeem(*, user_id: int, reward_id: int) -> dict[str, Any]:
    """Redeem a reward for a user; return the created redemption as a dict.

    Raises 404 if the user/reward is missing and 400 if the balance is
    insufficient (the insufficient-balance guard).
    """
    with get_session() as session:
        user = (
            session.execute(text(users_q.GET_BY_ID), {"id": user_id})
            .mappings()
            .first()
        )
        reward = (
            session.execute(text(rewards_q.GET_BY_ID), {"id": reward_id})
            .mappings()
            .first()
        )
        if user is None or reward is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=t("redemption.not_found"),
            )
        cost = reward["cost"]
        if user["points_balance"] < cost:
            # Log + raise after the session closes so the audit write (which
            # opens its own session) does not nest inside this transaction.
            insufficient = True
        else:
            insufficient = False
            redemption_id = execute_insert(
                session,
                text(redemptions_q.INSERT),
                {
                    "user_id": user_id,
                    "reward_id": reward_id,
                    "points_spent": cost,
                    "status": RedemptionStatus.PENDING.value,
                },
            )
            session.execute(
                text(users_q.ADD_POINTS_BALANCE), {"id": user_id, "delta": -cost}
            )
            result = {
                "id": redemption_id,
                "user_id": user_id,
                "reward_id": reward_id,
                "points_spent": cost,
                "status": RedemptionStatus.PENDING.value,
            }

    if insufficient:
        store_log(
            "redeem",
            level=logging.WARNING,
            user_id=user_id,
            details=f"insufficient balance for reward {reward_id}",
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("redemption.insufficient"),
        )

    store_log("redeem", level=logging.INFO, user_id=user_id, details=str(result))
    return result
