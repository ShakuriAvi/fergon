"""``Role`` ORM model (#20).

Generic catalog of positions that works for any organization type. Replaces the
old ``User.role`` enum and the free-text ``job_title``. ``access_level`` drives
the permission middleware; ``is_manager`` / ``rolls_up`` drive the monthly
allowance rollover (#24).
"""
from __future__ import annotations

from sqlalchemy import Boolean, Enum, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.schemas.role import AccessLevel


class Role(TimestampMixin, Base):
    """A position/role within an organization."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    name_he: Mapped[str] = mapped_column(String(120), nullable=False)
    access_level: Mapped[AccessLevel] = mapped_column(
        Enum(AccessLevel, values_callable=lambda enum: [m.value for m in enum]),
        nullable=False,
        server_default=text("'member'"),
    )
    is_manager: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("0")
    )
    rolls_up: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("0")
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Role id={self.id} name={self.name!r} access={self.access_level}>"
