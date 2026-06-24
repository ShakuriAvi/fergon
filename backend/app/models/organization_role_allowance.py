"""``OrganizationRoleAllowance`` ORM model (#23).

Per-organization, per-role configuration of how many giving points each role
receives per month. Source for the monthly grant in ``allowance_periods`` (#24).
"""
from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class OrganizationRoleAllowance(TimestampMixin, Base):
    """Monthly giving-points budget for a role within an organization."""

    __tablename__ = "organization_role_allowances"
    __table_args__ = (
        UniqueConstraint("organization_id", "role_id", name="org_role"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"), nullable=False, index=True
    )
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id"), nullable=False, index=True
    )
    monthly_points: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("1")
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (
            f"<OrganizationRoleAllowance org={self.organization_id} "
            f"role={self.role_id} points={self.monthly_points}>"
        )
