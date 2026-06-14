"""Pydantic schemas for the Redemption resource (#18)."""
from __future__ import annotations

import enum
from datetime import datetime

from pydantic import BaseModel


class RedemptionStatus(str, enum.Enum):
    """Lifecycle status of a redemption."""

    PENDING = "pending"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


REDEMPTION_STATUSES = tuple(s.value for s in RedemptionStatus)


class RedemptionCreate(BaseModel):
    """Payload to redeem a reward.

    The redeeming user is taken from the authenticated session (never the client
    payload) so a user cannot spend another user's balance.
    """

    reward_id: int


class RedemptionRead(BaseModel):
    """Redemption representation returned to the frontend."""

    id: int
    user_id: int
    reward_id: int
    points_spent: int
    status: RedemptionStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None
