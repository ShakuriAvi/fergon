"""Pydantic schemas for the AllowancePeriod resource (#24)."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel


class AllowancePeriodRead(BaseModel):
    """A user's monthly giving budget."""

    id: int
    user_id: int
    organization_id: int
    role_id: int
    period_month: date
    base_points: int
    carried_in_points: int
    total_granted: int
    used_points: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @property
    def remaining(self) -> int:
        """Points still available to give this period."""
        return self.total_granted - self.used_points
