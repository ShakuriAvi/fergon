"""Tests for the actions_logs DB layer (#5).

Writes go through the centralized ``get_session`` path (raw SQL, no ORM
querying), so they run against the SQLite schema created by the ``orm_db``
fixture and are read back to assert the row landed.
"""
from __future__ import annotations

import pytest

from app.db import action_log


def test_insert_action_log_writes_row(orm_db):
    new_id = action_log.insert_action_log(
        action_name="login",
        user_id=1,
        http_method="POST",
        path="/auth/register",
        status_code=201,
        success=True,
    )

    row = action_log.get_action_log_by_id(new_id)
    assert row is not None
    assert row["action_name"] == "login"
    assert row["user_id"] == 1
    assert row["http_method"] == "POST"
    assert row["path"] == "/auth/register"
    assert row["status_code"] == 201
    assert row["success"] is True


def test_insert_action_log_defaults_http_fields_for_internal_actions(orm_db):
    # A business action carries no HTTP method/path; NOT NULL columns default.
    new_id = action_log.insert_action_log(action_name="redeem", user_id=5)
    row = action_log.get_action_log_by_id(new_id)
    assert row["http_method"] == "-"
    assert row["path"] == "-"


def test_insert_action_log_ignores_unknown_columns(orm_db):
    new_id = action_log.insert_action_log(
        action_name="x", http_method="GET", path="/", bogus="nope"
    )
    row = action_log.get_action_log_by_id(new_id)
    assert row is not None
    assert "bogus" not in row


def test_insert_action_log_requires_action_name():
    with pytest.raises(ValueError):
        action_log.insert_action_log(http_method="GET", path="/")
