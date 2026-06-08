"""Tests for Google OAuth + registration (#7). Google + DB are mocked."""
from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi import HTTPException

from app.core.security import create_access_token, decode_token
from app.schemas.user import Role, UserCreate
from app.services import auth_service

_USER_ROW = {
    "id": 1,
    "email": "t@school.il",
    "full_name": "Teacher",
    "role": "teacher",
    "is_active": True,
    "created_at": None,
    "updated_at": None,
}


def test_google_callback_creates_user_and_returns_token():
    profile = {"sub": "g-123", "email": "t@school.il", "name": "Teacher"}
    with patch.object(auth_service, "exchange_code_for_token", return_value={"access_token": "ax"}), \
         patch.object(auth_service, "fetch_google_profile", return_value=profile), \
         patch("app.db.users.get_user_by_oauth_id", return_value=None), \
         patch("app.db.users.get_user_by_email", return_value=None), \
         patch("app.db.users.create_user", return_value=1) as create, \
         patch("app.db.users.get_user_by_id", return_value=_USER_ROW):
        result = auth_service.login_with_google("the-code")

    create.assert_called_once()
    payload = decode_token(result["access_token"])
    assert payload["sub"] == "1"
    assert payload["role"] == "teacher"


def test_register_creates_user():
    payload = UserCreate(email="t@school.il", full_name="Teacher", role=Role.TEACHER)
    with patch("app.db.users.get_user_by_email", return_value=None), \
         patch("app.db.users.create_user", return_value=1) as create, \
         patch("app.db.users.get_user_by_id", return_value=_USER_ROW):
        result = auth_service.register_user(payload)

    create.assert_called_once()
    assert result["user"].email == "t@school.il"


def test_register_duplicate_raises_409():
    payload = UserCreate(email="t@school.il", full_name="Teacher")
    with patch("app.db.users.get_user_by_email", return_value=_USER_ROW):
        with pytest.raises(HTTPException) as exc:
            auth_service.register_user(payload)
    assert exc.value.status_code == 409


def test_invalid_token_rejected():
    with pytest.raises(HTTPException) as exc:
        decode_token("not-a-jwt")
    assert exc.value.status_code == 401


def test_valid_token_roundtrip():
    token = create_access_token(user_id=5, role="admin")
    payload = decode_token(token)
    assert payload["sub"] == "5"
    assert payload["role"] == "admin"
