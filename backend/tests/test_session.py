"""Tests for the ORM session layer + users db helpers (#11).

A throwaway SQLite database stands in for MySQL so the Context Manager behavior
and the users.py ORM queries can be exercised without a live server.
"""
from __future__ import annotations

import pytest

from app.db import users as users_db
from app.db.session import get_engine, get_session, init_engine, reset_engine
from app.models import Base, User


@pytest.fixture
def sqlite_db(tmp_path):
    """Point the engine singleton at a fresh SQLite file with the schema built."""
    reset_engine()
    init_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(get_engine())
    yield
    reset_engine()


def test_create_and_fetch_user_roundtrip(sqlite_db):
    new_id = users_db.create_user(
        email="t@school.il", full_name="Teacher", role="teacher"
    )
    assert isinstance(new_id, int)

    by_id = users_db.get_user_by_id(new_id)
    assert by_id["email"] == "t@school.il"
    assert by_id["role"] == "teacher"  # serialized to the enum value (string)
    assert by_id["is_active"] is True
    assert by_id["created_at"] is not None

    assert users_db.get_user_by_email("t@school.il")["id"] == new_id


def test_get_user_by_id_returns_none_when_absent(sqlite_db):
    assert users_db.get_user_by_id(999) is None


def test_get_session_rolls_back_on_error(sqlite_db):
    with pytest.raises(ValueError):
        with get_session() as session:
            session.add(User(email="x@y.il", full_name="X", role="teacher"))
            raise ValueError("boom")

    # The failed transaction must not have persisted anything.
    with get_session() as session:
        assert session.query(User).count() == 0


def test_get_session_commits_on_success(sqlite_db):
    with get_session() as session:
        session.add(User(email="ok@y.il", full_name="OK", role="admin"))

    with get_session() as session:
        assert session.query(User).count() == 1
