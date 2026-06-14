"""``Post`` ORM model (#15).

The central recognition fact table: a peer-to-peer recognition from one user to
another, carrying points + a message. A post may express many recognition values,
stored as a JSON array of ``recognition_values.id`` (no junction table).
"""
from __future__ import annotations

from datetime import date

from sqlalchemy import (
    JSON,
    CheckConstraint,
    Date,
    ForeignKey,
    Integer,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Post(TimestampMixin, Base):
    """A recognition post."""

    __tablename__ = "posts"
    __table_args__ = (
        CheckConstraint(
            "from_user_id <> to_user_id", name="no_self_recognition"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    from_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    to_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"), nullable=False, index=True
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON array of recognition_values.id, e.g. [1, 5]. MySQL has no array type.
    recognition_value_ids: Mapped[list[int]] = mapped_column(
        JSON, nullable=False, default=list
    )
    data_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Post id={self.id} from={self.from_user_id} to={self.to_user_id}>"
