"""``User`` ORM model (#11, extended in #13).

The ``role`` enum and free-text ``job_title`` were replaced by a FK to the
generic ``roles`` table (#20); the user is also scoped to an organization (#12).
``points_balance`` caches earned/redeemable points (also derivable via a view).
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:  # pragma: no cover - typing only
    from app.models.role import Role


class User(TimestampMixin, Base):
    """A platform user, scoped to an organization and a role."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int | None] = mapped_column(
        ForeignKey("roles.id"), nullable=True, index=True
    )
    organization_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizations.id"), nullable=True, index=True
    )
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    points_balance: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default=text("0")
    )
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    avatar_emoji: Mapped[str | None] = mapped_column(String(16), nullable=True)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("1")
    )

    role: Mapped["Role | None"] = relationship("Role", lazy="joined")

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<User id={self.id} email={self.email!r} role_id={self.role_id}>"
