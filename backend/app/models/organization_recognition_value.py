"""``OrganizationRecognitionValue`` junction ORM model (#21).

Resolves the many-to-many between organizations and recognition_values: each
organization chooses its own set of values.
"""
from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class OrganizationRecognitionValue(TimestampMixin, Base):
    """An organization ↔ recognition_value link."""

    __tablename__ = "organization_recognition_values"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "recognition_value_id",
            name="org_value",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"), nullable=False, index=True
    )
    recognition_value_id: Mapped[int] = mapped_column(
        ForeignKey("recognition_values.id"), nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("1")
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (
            f"<OrganizationRecognitionValue org={self.organization_id} "
            f"value={self.recognition_value_id}>"
        )
