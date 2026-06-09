"""Tests for the /health view (#1)."""
from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import create_app


def test_health_returns_ok():
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_health_is_public_no_auth_required():
    """/health must be reachable without a token and must not be action-logged."""
    app = create_app()
    with patch("app.middleware.action_log.insert_action_log") as insert:
        with TestClient(app) as client:
            resp = client.get("/health")
    assert resp.status_code == 200
    insert.assert_not_called()


def test_security_headers_present_on_responses():
    """Hardening headers are attached to every response."""
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/health")
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "DENY"
    assert "max-age" in resp.headers["Strict-Transport-Security"]
    assert resp.headers["Content-Security-Policy"]
