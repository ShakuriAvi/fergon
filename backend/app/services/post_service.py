"""Recognition post business logic (#15).

Creating a post: the giver and organization come from the authenticated session
(never the client payload). Validate giver != recipient, that the recipient
belongs to the same organization, and that the chosen recognition values are
enabled for the organization; enforce the giver's monthly giving allowance;
persist the post and credit the recipient's points balance. Runs in a single
transaction.
"""
from __future__ import annotations

import json
import logging
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import text

from app.core.logging import store_log
from app.db.queries import allowance_periods as periods_q
from app.db.queries import organization_recognition_values as orv_q
from app.db.queries import posts as posts_q
from app.db.queries import users as users_q
from app.db.session import execute_insert, get_session
from app.schemas.post import PostCreate
from app.translations.translator import t


def _month_start(value: date) -> date:
    return value.replace(day=1)


def create_recognition(
    payload: PostCreate,
    *,
    from_user_id: int,
    organization_id: int,
) -> int:
    """Validate and persist a recognition post; return its id.

    ``from_user_id`` (the giver) and ``organization_id`` are supplied by the
    caller from the authenticated session — never from the client payload — so a
    user cannot post as someone else or cross organization boundaries.
    """
    if from_user_id == payload.to_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("posts.self_recognition"),
        )

    period_month = _month_start(payload.data_date or date.today())

    with get_session() as session:
        # Tenant isolation: the recipient must exist and be in the same org.
        recipient = (
            session.execute(text(users_q.GET_BY_ID), {"id": payload.to_user_id})
            .mappings()
            .first()
        )
        if recipient is None or recipient["organization_id"] != organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("posts.invalid_recipient"),
            )

        if payload.recognition_value_ids:
            enabled = {
                row["recognition_value_id"]
                for row in session.execute(
                    text(orv_q.ENABLED_VALUE_IDS),
                    {"organization_id": organization_id},
                ).mappings()
            }
            invalid = set(payload.recognition_value_ids) - enabled
            if invalid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("posts.invalid_value"),
                )

        # Enforce the giver's monthly giving allowance atomically before
        # crediting anyone: the guarded UPDATE only matches when a current period
        # exists with enough remaining points (rowcount == 0 otherwise).
        if payload.points > 0:
            spent = session.execute(
                text(periods_q.ADD_USED_POINTS_GUARDED),
                {
                    "user_id": from_user_id,
                    "period_month": period_month.isoformat(),
                    "points": payload.points,
                },
            )
            if spent.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("posts.insufficient_allowance"),
                )

        post_id = execute_insert(
            session,
            text(posts_q.INSERT),
            {
                "from_user_id": from_user_id,
                "to_user_id": payload.to_user_id,
                "organization_id": organization_id,
                "points": payload.points,
                "message": payload.message,
                "recognition_value_ids": json.dumps(
                    list(payload.recognition_value_ids)
                ),
                "data_date": (
                    payload.data_date.isoformat() if payload.data_date else None
                ),
            },
        )

        # Credit the recipient's earned/redeemable balance.
        session.execute(
            text(users_q.ADD_POINTS_BALANCE),
            {"id": payload.to_user_id, "delta": payload.points},
        )

    store_log(
        "post_create",
        level=logging.INFO,
        user_id=from_user_id,
        details=f"recognition {from_user_id}->{payload.to_user_id}",
    )
    return post_id
