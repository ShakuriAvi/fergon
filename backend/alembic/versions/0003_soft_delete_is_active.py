"""Add ``is_active`` soft-delete columns to roles, organization_role_allowances
and rewards (#28, #32, #33).

These three tables lacked an ``is_active`` flag; the admin panel requires every
delete to be a soft delete (``is_active = 0``) per the global rule in CLAUDE.md.
Organizations, recognition_values, organization_recognition_values and users
already have the column (migrations 0001/0002), so they are untouched here.

Revision ID: 0003_soft_delete
Revises: 0002_recognition
Create Date: 2026-06-18
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0003_soft_delete"
down_revision: Union[str, None] = "0002_recognition"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE `roles` "
        "ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `rolls_up`;"
    )
    op.execute(
        "ALTER TABLE `organization_role_allowances` "
        "ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `monthly_points`;"
    )
    op.execute(
        "ALTER TABLE `rewards` "
        "ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT TRUE AFTER `in_stock`;"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE `rewards` DROP COLUMN `is_active`;")
    op.execute(
        "ALTER TABLE `organization_role_allowances` DROP COLUMN `is_active`;"
    )
    op.execute("ALTER TABLE `roles` DROP COLUMN `is_active`;")
