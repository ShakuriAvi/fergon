"""``AllowancePeriod`` ORM model (#24).

Tracks each user's monthly giving budget. Reset every month; unused points from
roles flagged ``rolls_up`` pool to the organization's manager role next month.
This is the *giving* allowance — distinct from ``users.points_balance`` (earned).
"""
from __future__ import annotations

from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class AllowancePeriod(TimestampMixin, Base):
    """A user's giving budget for one month."""

    __tablename__ = "allowance_periods"
    __table_args__ = (
        UniqueConstraint("user_id", "period_month", name="user_period"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"), nullable=False, index=True
    )
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id"), nullable=False, index=True
    )
    period_month: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    base_points: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    carried_in_points: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    total_granted: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    used_points: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (
            f"<AllowancePeriod user={self.user_id} month={self.period_month} "
            f"granted={self.total_granted} used={self.used_points}>"
        )
