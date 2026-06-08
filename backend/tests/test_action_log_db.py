"""Tests for the generic actions_logs insert helper (#5)."""
from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from app.db import action_log, connection


def test_insert_action_log_writes_row(monkeypatch):
    cur = MagicMock()
    cur.lastrowid = 7
    conn = MagicMock()
    conn.cursor.return_value = cur
    monkeypatch.setattr(connection, "_connect", lambda: conn)

    new_id = action_log.insert_action_log(
        action_name="login",
        user_id=1,
        http_method="POST",
        path="/auth/register",
        status_code=201,
        success=True,
    )

    assert new_id == 7
    query, params = cur.execute.call_args[0]
    assert query.startswith("INSERT INTO `actions_logs`")
    assert "login" in params


def test_insert_action_log_ignores_unknown_columns(monkeypatch):
    cur = MagicMock()
    conn = MagicMock()
    conn.cursor.return_value = cur
    monkeypatch.setattr(connection, "_connect", lambda: conn)

    action_log.insert_action_log(
        action_name="x", http_method="GET", path="/", bogus="nope"
    )
    query, _ = cur.execute.call_args[0]
    assert "bogus" not in query


def test_insert_action_log_requires_action_name():
    with pytest.raises(ValueError):
        action_log.insert_action_log(http_method="GET", path="/")
