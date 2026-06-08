"""Tests for the DB layer context manager (#3)."""
from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from app.db import connection


def test_commit_on_success(monkeypatch):
    conn = MagicMock()
    monkeypatch.setattr(connection, "_connect", lambda: conn)

    with connection.get_connection() as c:
        assert c is conn

    conn.commit.assert_called_once()
    conn.rollback.assert_not_called()
    conn.close.assert_called_once()


def test_rollback_on_error(monkeypatch):
    conn = MagicMock()
    monkeypatch.setattr(connection, "_connect", lambda: conn)

    with pytest.raises(ValueError):
        with connection.get_connection():
            raise ValueError("boom")

    conn.rollback.assert_called_once()
    conn.commit.assert_not_called()
    conn.close.assert_called_once()


def test_insert_builds_parameterized_query(monkeypatch):
    cur = MagicMock()
    cur.lastrowid = 42
    conn = MagicMock()
    conn.cursor.return_value = cur
    monkeypatch.setattr(connection, "_connect", lambda: conn)

    new_id = connection.insert("users", {"email": "a@b.com", "full_name": "A"})

    assert new_id == 42
    query, params = cur.execute.call_args[0]
    assert query == "INSERT INTO `users` (`email`, `full_name`) VALUES (%s, %s)"
    assert params == ("a@b.com", "A")
    conn.commit.assert_called_once()


def test_fetch_one_passes_params(monkeypatch):
    cur = MagicMock()
    cur.fetchone.return_value = {"id": 1}
    conn = MagicMock()
    conn.cursor.return_value = cur
    monkeypatch.setattr(connection, "_connect", lambda: conn)

    row = connection.fetch_one("SELECT * FROM users WHERE id = %s", (1,))

    assert row == {"id": 1}
    cur.execute.assert_called_once_with("SELECT * FROM users WHERE id = %s", (1,))
