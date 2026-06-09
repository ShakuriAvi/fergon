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


def test_me_returns_404_when_user_missing():
    """A valid token whose user vanishes between auth and handler yields 404.

    The permissions middleware looks the user up first (sees an active row), then
    the /me handler looks it up again and finds nothing — a 404, never a 500.
    """
    from fastapi.testclient import TestClient

    from app.main import create_app

    token = create_access_token(user_id=42, role="teacher")
    app = create_app()
    # 1st lookup = middleware (active user passes auth); 2nd = handler (gone).
    with patch(
        "app.db.users.get_user_by_id",
        side_effect=[{"id": 42, "role": "teacher", "is_active": True}, None],
    ), patch("app.middleware.action_log.insert_action_log"):
        with TestClient(app) as client:
            resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 404


def test_register_is_rate_limited():
    """The public /auth/register endpoint is throttled (5/minute) to curb abuse."""
    from fastapi.testclient import TestClient

    from app.core.rate_limit import limiter
    from app.main import create_app

    limiter.reset()  # isolate from any prior in-memory counters
    app = create_app()
    body = {"email": "t@school.il", "full_name": "Teacher", "role": "teacher"}
    with patch("app.db.users.get_user_by_email", return_value=None), \
         patch("app.db.users.create_user", return_value=1), \
         patch("app.db.users.get_user_by_id", return_value=_USER_ROW), \
         patch("app.middleware.action_log.insert_action_log"):
        with TestClient(app) as client:
            statuses = [
                client.post("/auth/register", json=body).status_code
                for _ in range(6)
            ]

    assert statuses[:5] == [201, 201, 201, 201, 201]
    assert statuses[5] == 429
