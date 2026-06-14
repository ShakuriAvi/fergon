"""Tests for the ORM models (#11, extended #12-#24)."""
from __future__ import annotations

from app.models import ActionLog, Base, User


def test_user_table_mapping():
    assert User.__tablename__ == "users"
    cols = set(User.__table__.columns.keys())
    assert cols == {
        "id",
        "email",
        "full_name",
        "role_id",
        "organization_id",
        "oauth_id",
        "points_balance",
        "phone",
        "avatar_emoji",
        "is_active",
        "created_at",
        "updated_at",
    }
    assert User.__table__.c.email.unique is True
    assert User.__table__.c.oauth_id.unique is True


def test_action_log_table_mapping():
    assert ActionLog.__tablename__ == "actions_logs"
    cols = set(ActionLog.__table__.columns.keys())
    assert cols == {
        "id",
        "action_name",
        "school_id",
        "user_id",
        "page",
        "payload",
        "success",
        "details",
        "http_method",
        "path",
        "status_code",
        "ip_address",
        "duration_ms",
        "created_at",
    }


def test_models_registered_on_shared_base():
    """All models share one Base.metadata (used by Alembic autogenerate)."""
    assert {
        "users",
        "actions_logs",
        "organizations",
        "roles",
        "recognition_values",
        "posts",
        "rewards",
        "redemptions",
        "organization_recognition_values",
        "organization_role_allowances",
        "allowance_periods",
    } <= set(Base.metadata.tables.keys())


def test_timestamp_columns_present_on_every_domain_table():
    """Per project requirement, every domain table carries created_at/updated_at."""
    domain_tables = [
        "users",
        "organizations",
        "roles",
        "recognition_values",
        "posts",
        "rewards",
        "redemptions",
        "organization_recognition_values",
        "organization_role_allowances",
        "allowance_periods",
    ]
    for name in domain_tables:
        cols = set(Base.metadata.tables[name].columns.keys())
        assert {"created_at", "updated_at"} <= cols, name
