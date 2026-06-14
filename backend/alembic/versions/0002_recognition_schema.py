"""Recognition domain schema (#12-#24): organizations, roles, recognition_values,
posts, rewards, redemptions, org/value + org/role configs, allowance_periods;
plus the users table migration from a role enum to a roles FK.

Revision ID: 0002_recognition
Revises: 0001_initial
Create Date: 2026-06-14
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0002_recognition"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Independent catalogs --------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `organizations` (
            `id`         INT NOT NULL AUTO_INCREMENT,
            `name`       VARCHAR(255) NOT NULL,
            `short_name` VARCHAR(120) NULL,
            `city`       VARCHAR(120) NULL,
            `org_type`   VARCHAR(50) NULL,
            `is_active`  BOOLEAN NOT NULL DEFAULT TRUE,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `roles` (
            `id`           INT NOT NULL AUTO_INCREMENT,
            `name`         VARCHAR(50) NOT NULL,
            `name_he`      VARCHAR(120) NOT NULL,
            `access_level` ENUM('admin','manager','member')
                           NOT NULL DEFAULT 'member',
            `is_manager`   BOOLEAN NOT NULL DEFAULT FALSE,
            `rolls_up`     BOOLEAN NOT NULL DEFAULT FALSE,
            `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uq_roles_name` (`name`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `recognition_values` (
            `id`         INT NOT NULL AUTO_INCREMENT,
            `key`        VARCHAR(120) NOT NULL,
            `emoji`      VARCHAR(16) NULL,
            `tone`       VARCHAR(32) NULL,
            `is_active`  BOOLEAN NOT NULL DEFAULT TRUE,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uq_recognition_values_key` (`key`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `rewards` (
            `id`         INT NOT NULL AUTO_INCREMENT,
            `provider`   VARCHAR(255) NOT NULL,
            `title`      VARCHAR(255) NOT NULL,
            `category`   ENUM('books','food','shop','fun') NOT NULL,
            `cost`       INT NOT NULL,
            `emoji`      VARCHAR(16) NULL,
            `color`      VARCHAR(32) NULL,
            `blurb`      TEXT NULL,
            `in_stock`   BOOLEAN NOT NULL DEFAULT TRUE,
            `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

    # --- Seed roles + recognition values ---------------------------------
    op.execute(
        """
        INSERT INTO `roles` (`name`,`name_he`,`access_level`,`is_manager`,`rolls_up`)
        VALUES
            ('admin','מנהל מערכת','admin',FALSE,FALSE),
            ('principal','מנהל','manager',TRUE,FALSE),
            ('secretary','מזכיר/ה','member',FALSE,FALSE),
            ('teacher','מורה','member',FALSE,TRUE),
            ('student','תלמיד/ה','member',FALSE,TRUE),
            ('server','עובד/ת','member',FALSE,TRUE);
        """
    )
    op.execute(
        """
        INSERT INTO `recognition_values` (`key`,`emoji`,`tone`) VALUES
            ('חדשנות','💡','gold'),
            ('שיתוף פעולה','🤝','green'),
            ('חניכה','🌱','green'),
            ('מסירות','💪','terra'),
            ('יצירתיות','🎨','terra'),
            ('מנהיגות','🏆','gold');
        """
    )

    # --- Migrate users: role enum -> role_id FK + new columns ------------
    op.execute(
        """
        ALTER TABLE `users`
            ADD COLUMN `role_id`         INT NULL AFTER `full_name`,
            ADD COLUMN `organization_id` INT NULL AFTER `role_id`,
            ADD COLUMN `points_balance`  INT NOT NULL DEFAULT 0 AFTER `oauth_id`,
            ADD COLUMN `phone`           VARCHAR(32) NULL AFTER `points_balance`,
            ADD COLUMN `avatar_emoji`    VARCHAR(16) NULL AFTER `phone`,
            ADD KEY `ix_users_role_id` (`role_id`),
            ADD KEY `ix_users_organization_id` (`organization_id`),
            ADD CONSTRAINT `fk_users_role_id_roles`
                FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
            ADD CONSTRAINT `fk_users_organization_id_organizations`
                FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`);
        """
    )
    # Map the old enum value onto the seeded role rows, then drop the column.
    op.execute(
        """
        UPDATE `users` u
        JOIN `roles` r ON r.`name` = u.`role`
        SET u.`role_id` = r.`id`;
        """
    )
    op.execute("ALTER TABLE `users` DROP COLUMN `role`;")

    # --- Posts ------------------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `posts` (
            `id`                    INT NOT NULL AUTO_INCREMENT,
            `from_user_id`          INT NOT NULL,
            `to_user_id`            INT NOT NULL,
            `organization_id`       INT NOT NULL,
            `points`                INT NOT NULL DEFAULT 0,
            `message`               TEXT NULL,
            `recognition_value_ids` JSON NOT NULL,
            `data_date`             DATE NULL,
            `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `ix_posts_from_user_id` (`from_user_id`),
            KEY `ix_posts_to_user_id` (`to_user_id`),
            KEY `ix_posts_organization_id` (`organization_id`),
            KEY `ix_posts_created_at` (`created_at`),
            CONSTRAINT `ck_posts_no_self_recognition`
                CHECK (`from_user_id` <> `to_user_id`),
            CONSTRAINT `fk_posts_from_user_id_users`
                FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`),
            CONSTRAINT `fk_posts_to_user_id_users`
                FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`),
            CONSTRAINT `fk_posts_organization_id_organizations`
                FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

    # --- Redemptions ------------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `redemptions` (
            `id`           INT NOT NULL AUTO_INCREMENT,
            `user_id`      INT NOT NULL,
            `reward_id`    INT NOT NULL,
            `points_spent` INT NOT NULL,
            `status`       ENUM('pending','fulfilled','cancelled')
                           NOT NULL DEFAULT 'pending',
            `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `ix_redemptions_user_id` (`user_id`),
            KEY `ix_redemptions_reward_id` (`reward_id`),
            CONSTRAINT `fk_redemptions_user_id_users`
                FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
            CONSTRAINT `fk_redemptions_reward_id_rewards`
                FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

    # --- Org <-> value junction ------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `organization_recognition_values` (
            `id`                   INT NOT NULL AUTO_INCREMENT,
            `organization_id`      INT NOT NULL,
            `recognition_value_id` INT NOT NULL,
            `is_active`            BOOLEAN NOT NULL DEFAULT TRUE,
            `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `ix_organization_recognition_values_organization_id` (`organization_id`),
            KEY `ix_organization_recognition_values_recognition_value_id` (`recognition_value_id`),
            UNIQUE KEY `uq_org_value` (`organization_id`,`recognition_value_id`),
            CONSTRAINT `fk_orv_organization_id_organizations`
                FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
            CONSTRAINT `fk_orv_recognition_value_id_recognition_values`
                FOREIGN KEY (`recognition_value_id`) REFERENCES `recognition_values` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

    # --- Org <-> role allowance config -----------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `organization_role_allowances` (
            `id`              INT NOT NULL AUTO_INCREMENT,
            `organization_id` INT NOT NULL,
            `role_id`         INT NOT NULL,
            `monthly_points`  INT NOT NULL,
            `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `ix_organization_role_allowances_organization_id` (`organization_id`),
            KEY `ix_organization_role_allowances_role_id` (`role_id`),
            UNIQUE KEY `uq_org_role` (`organization_id`,`role_id`),
            CONSTRAINT `fk_ora_organization_id_organizations`
                FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
            CONSTRAINT `fk_ora_role_id_roles`
                FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

    # --- Allowance periods ------------------------------------------------
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS `allowance_periods` (
            `id`                INT NOT NULL AUTO_INCREMENT,
            `user_id`           INT NOT NULL,
            `organization_id`   INT NOT NULL,
            `role_id`           INT NOT NULL,
            `period_month`      DATE NOT NULL,
            `base_points`       INT NOT NULL DEFAULT 0,
            `carried_in_points` INT NOT NULL DEFAULT 0,
            `total_granted`     INT NOT NULL DEFAULT 0,
            `used_points`       INT NOT NULL DEFAULT 0,
            `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `ix_allowance_periods_user_id` (`user_id`),
            KEY `ix_allowance_periods_organization_id` (`organization_id`),
            KEY `ix_allowance_periods_role_id` (`role_id`),
            KEY `ix_allowance_periods_period_month` (`period_month`),
            UNIQUE KEY `uq_user_period` (`user_id`,`period_month`),
            CONSTRAINT `fk_ap_user_id_users`
                FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
            CONSTRAINT `fk_ap_organization_id_organizations`
                FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
            CONSTRAINT `fk_ap_role_id_roles`
                FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    )

    # --- Analytics view: earned-minus-spent points balance ---------------
    op.execute(
        """
        CREATE OR REPLACE VIEW `user_points_balance` AS
        SELECT
            u.`id` AS `user_id`,
            COALESCE(earned.`pts`, 0) - COALESCE(spent.`pts`, 0) AS `balance`
        FROM `users` u
        LEFT JOIN (
            SELECT `to_user_id` AS `uid`, SUM(`points`) AS `pts`
            FROM `posts` GROUP BY `to_user_id`
        ) earned ON earned.`uid` = u.`id`
        LEFT JOIN (
            SELECT `user_id` AS `uid`, SUM(`points_spent`) AS `pts`
            FROM `redemptions` WHERE `status` <> 'cancelled'
            GROUP BY `user_id`
        ) spent ON spent.`uid` = u.`id`;
        """
    )


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS `user_points_balance`;")
    op.execute("DROP TABLE IF EXISTS `allowance_periods`;")
    op.execute("DROP TABLE IF EXISTS `organization_role_allowances`;")
    op.execute("DROP TABLE IF EXISTS `organization_recognition_values`;")
    op.execute("DROP TABLE IF EXISTS `redemptions`;")
    op.execute("DROP TABLE IF EXISTS `posts`;")

    # Restore the users.role enum from the roles FK, then drop the new columns.
    op.execute(
        """
        ALTER TABLE `users`
            ADD COLUMN `role` ENUM('admin','principal','teacher','secretary')
                NOT NULL DEFAULT 'teacher' AFTER `full_name`;
        """
    )
    op.execute(
        """
        UPDATE `users` u
        JOIN `roles` r ON r.`id` = u.`role_id`
        SET u.`role` = r.`name`
        WHERE r.`name` IN ('admin','principal','teacher','secretary');
        """
    )
    op.execute(
        """
        ALTER TABLE `users`
            DROP FOREIGN KEY `fk_users_role_id_roles`,
            DROP FOREIGN KEY `fk_users_organization_id_organizations`,
            DROP COLUMN `role_id`,
            DROP COLUMN `organization_id`,
            DROP COLUMN `points_balance`,
            DROP COLUMN `phone`,
            DROP COLUMN `avatar_emoji`;
        """
    )

    op.execute("DROP TABLE IF EXISTS `rewards`;")
    op.execute("DROP TABLE IF EXISTS `recognition_values`;")
    op.execute("DROP TABLE IF EXISTS `roles`;")
    op.execute("DROP TABLE IF EXISTS `organizations`;")
