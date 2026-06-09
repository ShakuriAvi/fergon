"""Tests for the User schema / role constraint (#5)."""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.user import ROLE_VALUES, Role, UserCreate


def test_role_values_are_the_four_roles():
    assert set(ROLE_VALUES) == {"admin", "principal", "teacher", "secretary"}


def test_user_create_accepts_valid_role():
    user = UserCreate(email="a@b.com", full_name="A", role=Role.PRINCIPAL)
    assert user.role is Role.PRINCIPAL


def test_user_create_rejects_invalid_role():
    with pytest.raises(ValidationError):
        UserCreate(email="a@b.com", full_name="A", role="superuser")


def test_migration_constrains_roles():
    """The hand-written migration must constrain role to the four values."""
    from pathlib import Path

    sql = Path(
        "alembic/versions/0001_initial_users_actions_logs.py"
    ).read_text()
    assert "ENUM('admin','principal','teacher','secretary')" in sql
