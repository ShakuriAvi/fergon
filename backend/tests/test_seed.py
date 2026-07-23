"""Tests for the dev-only mock-mirroring seed (#40)."""
from __future__ import annotations

from app.core.config import reset_settings
from app import seed
from app.db import organizations as orgs_db
from app.db import posts as posts_db
from app.db import rewards as rewards_db
from app.db import users as users_db


def _users_count() -> int:
    return users_db.list_users_page(include_inactive=True, limit=200)[1]


def test_seed_is_noop_outside_dev(orm_db):
    # conftest sets APP_ENV=prod.
    seed.seed_all()
    assert orgs_db.list_organizations() == []


def test_seed_populates_and_is_idempotent(orm_db, monkeypatch):
    monkeypatch.setenv("APP_ENV", "dev")
    reset_settings()

    seed.seed_all()
    assert len(orgs_db.list_organizations()) == 4
    assert _users_count() == 14  # 10 mock + 4 role-coverage
    assert len(rewards_db.list_rewards()) == 8
    assert len(posts_db.list_feed(limit=100)) == 17

    # Re-running creates no duplicates.
    seed.seed_all()
    assert len(orgs_db.list_organizations()) == 4
    assert _users_count() == 14
    assert len(rewards_db.list_rewards()) == 8
    assert len(posts_db.list_feed(limit=100)) == 17


def test_seed_covers_all_roles_and_dev_login_emails(orm_db, monkeypatch):
    monkeypatch.setenv("APP_ENV", "dev")
    reset_settings()
    seed.seed_all()

    for email in [
        "admin@fergoni.dev", "secretary@fergoni.dev", "student@fergoni.dev",
        "server@fergoni.dev", "yael@fergoni.dev", "avi@fergoni.dev",
    ]:
        u = users_db.get_user_by_email(email)
        assert u is not None and u["is_active"] is True

    roles_present = {
        users_db.get_user_by_email(f"{k}@fergoni.dev")["role"]
        for k in ["admin", "avi", "yael", "secretary", "student", "server"]
    }
    assert {"admin", "principal", "teacher", "secretary", "student", "server"} <= roles_present
