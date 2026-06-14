"""Tests for the ORM session layer + users db helpers (#11, #13).

A throwaway SQLite database (the shared ``orm_db`` fixture, with roles seeded)
stands in for MySQL so the Context Manager behavior and the users.py ORM queries
can be exercised without a live server.
"""
from __future__ import annotations

import pytest

from app.db import users as users_db
from app.db.session import get_session
from app.models import User


def test_create_and_fetch_user_roundtrip(orm_db):
    new_id = users_db.create_user(
        email="t@school.il", full_name="Teacher", role="teacher"
    )
    assert isinstance(new_id, int)

    by_id = users_db.get_user_by_id(new_id)
    assert by_id["email"] == "t@school.il"
    assert by_id["role"] == "teacher"  # resolved from the roles table
    assert by_id["role_id"] == orm_db["teacher"]
    assert by_id["access_level"] == "member"
    assert by_id["is_active"] is True
    assert by_id["created_at"] is not None

    assert users_db.get_user_by_email("t@school.il")["id"] == new_id


def test_get_user_by_id_returns_none_when_absent(orm_db):
    assert users_db.get_user_by_id(999) is None


def test_get_session_rolls_back_on_error(orm_db):
    with pytest.raises(ValueError):
        with get_session() as session:
            session.add(
                User(email="x@y.il", full_name="X", role_id=orm_db["teacher"])
            )
            raise ValueError("boom")

    # The failed transaction must not have persisted anything.
    with get_session() as session:
        assert session.query(User).count() == 0


def test_get_session_commits_on_success(orm_db):
    with get_session() as session:
        session.add(User(email="ok@y.il", full_name="OK", role_id=orm_db["admin"]))

    with get_session() as session:
        assert session.query(User).count() == 1
