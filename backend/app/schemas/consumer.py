"""Response schemas for the consumer (non-admin) read endpoints (#41)."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel


class FeedValue(BaseModel):
    id: int
    key: str
    emoji: str | None = None
    tone: str | None = None


class FeedItem(BaseModel):
    id: int
    from_user_id: int
    from_name: str
    to_user_id: int
    to_name: str
    points: int
    message: str | None = None
    values: list[FeedValue] = []
    created_at: datetime | None = None


class WalletRead(BaseModel):
    points_balance: int
    allowance_total: int
    allowance_used: int
    allowance_remaining: int
    period_month: date | None = None


class LeaderboardEntry(BaseModel):
    user_id: int
    name: str
    points: int


class OrgMember(BaseModel):
    id: int
    full_name: str


class OrgValueOption(BaseModel):
    id: int
    key: str
    emoji: str | None = None
    tone: str | None = None
