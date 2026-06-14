"""``Redemption`` ORM model (#18).

Records a user spending points on a reward.
"""
from __future__ import annotations

from sqlalchemy import Enum, ForeignKey, Integer, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.schemas.redemption import RedemptionStatus


class Redemption(TimestampMixin, Base):
    """A reward redemption by a user."""

    __tablename__ = "redemptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    reward_id: Mapped[int] = mapped_column(
        ForeignKey("rewards.id"), nullable=False, index=True
    )
    points_spent: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[RedemptionStatus] = mapped_column(
        Enum(RedemptionStatus, values_callable=lambda enum: [m.value for m in enum]),
        nullable=False,
        server_default=text("'pending'"),
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Redemption id={self.id} user={self.user_id} reward={self.reward_id}>"
