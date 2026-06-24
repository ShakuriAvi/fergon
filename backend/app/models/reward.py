"""``Reward`` ORM model (#17).

Catalog of rewards redeemable with points.
"""
from __future__ import annotations

from sqlalchemy import Boolean, Enum, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.schemas.reward import RewardCategory


class Reward(TimestampMixin, Base):
    """A redeemable reward."""

    __tablename__ = "rewards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[RewardCategory] = mapped_column(
        Enum(RewardCategory, values_callable=lambda enum: [m.value for m in enum]),
        nullable=False,
    )
    cost: Mapped[int] = mapped_column(Integer, nullable=False)
    emoji: Mapped[str | None] = mapped_column(String(16), nullable=True)
    color: Mapped[str | None] = mapped_column(String(32), nullable=True)
    blurb: Mapped[str | None] = mapped_column(Text, nullable=True)
    in_stock: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("1")
    )
    # ``is_active`` (record exists/visible) is distinct from ``in_stock``
    # (temporarily out of stock). Soft delete flips ``is_active`` to 0 (#33).
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("1")
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Reward id={self.id} provider={self.provider!r} title={self.title!r}>"
