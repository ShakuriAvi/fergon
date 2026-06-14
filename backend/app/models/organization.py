"""``Organization`` ORM model (#12).

The generic top-level entity. The platform is organization-agnostic (schools,
restaurants, companies…); every non-admin user and every post is scoped to an
organization.
"""
from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Organization(TimestampMixin, Base):
    """A tenant organization (school / company / etc.)."""

    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    short_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    org_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("1")
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Organization id={self.id} name={self.name!r}>"
