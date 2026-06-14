"""``RecognitionValue`` ORM model (#14).

Catalog of core values a post can express (e.g. innovation, collaboration). The
``key`` is stored in Hebrew. Each organization selects its own subset via
``organization_recognition_values`` (#21).
"""
from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class RecognitionValue(TimestampMixin, Base):
    """A recognition value (Hebrew key + emoji + tone)."""

    __tablename__ = "recognition_values"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    emoji: Mapped[str | None] = mapped_column(String(16), nullable=True)
    tone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("1")
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<RecognitionValue id={self.id} key={self.key!r}>"
