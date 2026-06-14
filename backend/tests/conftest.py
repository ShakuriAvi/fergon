"""Shared pytest fixtures.

Tests never touch a real MySQL or Google — the DB layer and HTTP calls are
mocked. We point logging at a temp dir and reset the settings cache so each test
gets clean configuration.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Ensure the backend package root is importable when running `pytest` from
# either the repo root or the backend directory.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import reset_settings  # noqa: E402
from app.db.session import get_engine, init_engine, reset_engine  # noqa: E402


@pytest.fixture(autouse=True)
def _isolate_settings(tmp_path, monkeypatch):
    """Reset the settings + engine singletons and route logs to a temp dir."""
    monkeypatch.setenv("APP_ENV", "prod")  # avoid reading a developer .env
    monkeypatch.setenv("LOG_DIR", str(tmp_path / "logs"))
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    monkeypatch.setenv("MYSQL_PASSWORD", "test-pass")
    reset_settings()
    reset_engine()
    yield
    reset_settings()
    reset_engine()


# Seed mirrors the roles inserted by migration 0002.
_SEED_ROLES = [
    ("admin", "מנהל מערכת", "admin", False, False),
    ("principal", "מנהל", "manager", True, False),
    ("secretary", "מזכיר/ה", "member", False, False),
    ("teacher", "מורה", "member", False, True),
    ("student", "תלמיד/ה", "member", False, True),
    ("server", "עובד/ת", "member", False, True),
]


@pytest.fixture
def orm_db(tmp_path):
    """Point the engine singleton at a fresh SQLite DB with the full schema +
    seeded roles. Returns a dict mapping role name -> role id."""
    from app.db.session import get_session
    from app.models import Base, Role
    from app.schemas.role import AccessLevel

    reset_engine()
    init_engine(f"sqlite:///{tmp_path / 'orm.db'}")
    Base.metadata.create_all(get_engine())

    role_ids: dict[str, int] = {}
    with get_session() as session:
        for name, name_he, access, is_manager, rolls_up in _SEED_ROLES:
            role = Role(
                name=name,
                name_he=name_he,
                access_level=AccessLevel(access),
                is_manager=is_manager,
                rolls_up=rolls_up,
            )
            session.add(role)
            session.flush()
            role_ids[name] = role.id
    yield role_ids
    reset_engine()
