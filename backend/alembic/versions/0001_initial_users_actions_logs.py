"""Initial schema: users and actions_logs (hand-written SQL, no ORM).

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-08
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users table — role constrained to the four supported roles.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `users` (
            `id`         INT NOT NULL AUTO_INCREMENT,
            `email`      VARCHAR(255) NOT NULL,
            `full_name`  VARCHAR(255) NOT NULL,
            `role`       ENUM('admin','principal','teacher','secretary')
                         NOT NULL DEFAULT 'teacher',
            `oauth_id`   VARCHAR(255) NULL,
            `is_active`  BOOLEAN NOT NULL DEFAULT TRUE,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uq_users_email` (`email`),
            UNIQUE KEY `uq_users_oauth_id` (`oauth_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

    # actions_logs table — exact columns per issue #5.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `actions_logs` (
            `id`          INT NOT NULL AUTO_INCREMENT,
            `action_name` VARCHAR(255) NOT NULL,
            `school_id`   INT NULL,
            `user_id`     INT NULL,
            `page`        VARCHAR(50) NULL,
            `payload`     TEXT NULL,
            `success`     BOOLEAN NOT NULL DEFAULT TRUE,
            `details`     TEXT NULL,
            `http_method` VARCHAR(10) NOT NULL,
            `path`        VARCHAR(500) NOT NULL,
            `status_code` INT NULL,
            `ip_address`  VARCHAR(45) NULL,
            `duration_ms` FLOAT NULL,
            `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `ix_actions_logs_action_name` (`action_name`),
            KEY `ix_actions_logs_school_id` (`school_id`),
            KEY `ix_actions_logs_user_id` (`user_id`),
            KEY `ix_actions_logs_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS `actions_logs`;")
    op.execute("DROP TABLE IF EXISTS `users`;")
