"""Tests for the TEMPORARY dev-only email login (#39)."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.core.config import reset_settings
from app.core.security import decode_token
from app.db import users as users_db
from app.services import dev_auth_service


def _enable_dev(monkeypatch):
    monkeypatch.setenv("APP_ENV", "dev")
    reset_settings()


def test_disabled_outside_dev(orm_db):
    # conftest sets APP_ENV=prod, so the endpoint is inert (404).
    with pytest.raises(HTTPException) as exc:
        dev_auth_service.login_with_email("admin@fergoni.dev")
    assert exc.value.status_code == 404


@pytest.mark.parametrize("role", ["admin", "principal", "teacher", "secretary"])
def test_success_per_role(orm_db, monkeypatch, role):
    _enable_dev(monkeypatch)
    users_db.create_user(email=f"{role}@fergoni.dev", full_name=role, role=role)
    result = dev_auth_service.login_with_email(f"{role}@fergoni.dev")
    payload = decode_token(result["access_token"])
    assert payload["role"] == role
    assert result["user"].email == f"{role}@fergoni.dev"


def test_unknown_email_404(orm_db, monkeypatch):
    _enable_dev(monkeypatch)
    with pytest.raises(HTTPException) as exc:
        dev_auth_service.login_with_email("nobody@fergoni.dev")
    assert exc.value.status_code == 404


def test_inactive_user_404(orm_db, monkeypatch):
    _enable_dev(monkeypatch)
    uid = users_db.create_user(email="t@fergoni.dev", full_name="T", role="teacher")
    users_db.set_user_active(uid, is_active=False)
    with pytest.raises(HTTPException) as exc:
        dev_auth_service.login_with_email("t@fergoni.dev")
    assert exc.value.status_code == 404


def test_route_issues_token(orm_db, monkeypatch):
    _enable_dev(monkeypatch)
    users_db.create_user(email="teacher@fergoni.dev", full_name="T", role="teacher")

    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded

    from app.api.routes import dev_auth
    from app.core.rate_limit import limiter

    app = FastAPI()
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.include_router(dev_auth.router)

    resp = TestClient(app).post("/auth/dev-login", json={"email": "teacher@fergoni.dev"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["user"]["email"] == "teacher@fergoni.dev"
    # Native transport: the token is in the body.
    assert body["access_token"]
    # Web transport: an HttpOnly access cookie + a readable CSRF cookie are set.
    set_cookie = resp.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie and "httponly" in set_cookie.lower()
    assert "csrf_token=" in set_cookie
