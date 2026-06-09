"""Tests for the ORM models (#11)."""
from __future__ import annotations

from app.models import ActionLog, Base, User


def test_user_table_mapping():
    assert User.__tablename__ == "users"
    cols = set(User.__table__.columns.keys())
    assert cols == {
        "id",
        "email",
        "full_name",
        "role",
        "oauth_id",
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
    """Both models share one Base.metadata (used by Alembic autogenerate)."""
    assert {"users", "actions_logs"} <= set(Base.metadata.tables.keys())
