"""Tests for the action-logging middleware (#9)."""
from __future__ import annotations

from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.action_log import ActionLogMiddleware


def _app() -> FastAPI:
    app = FastAPI()
    app.add_middleware(ActionLogMiddleware)

    @app.get("/ok")
    def ok():
        return {"ok": True}

    @app.get("/boom")
    def boom():
        raise RuntimeError("kaboom")

    return app


def test_successful_request_logs_one_success_row():
    with patch("app.middleware.action_log.insert_action_log") as insert:
        with TestClient(app=_app()) as client:
            assert client.get("/ok").status_code == 200
    insert.assert_called_once()
    kwargs = insert.call_args.kwargs
    assert kwargs["success"] is True
    assert kwargs["status_code"] == 200
    assert kwargs["path"] == "/ok"


def test_failed_request_logs_failure_row_with_details():
    with patch("app.middleware.action_log.insert_action_log") as insert:
        client = TestClient(app=_app(), raise_server_exceptions=False)
        resp = client.get("/boom")
    assert resp.status_code == 500
    insert.assert_called_once()
    kwargs = insert.call_args.kwargs
    assert kwargs["success"] is False
    assert "kaboom" in kwargs["details"]


def test_db_write_failure_is_swallowed():
    """If persisting the log raises, the request must still return normally."""
    with patch(
        "app.middleware.action_log.insert_action_log",
        side_effect=Exception("db down"),
    ):
        with TestClient(app=_app()) as client:
            resp = client.get("/ok")
    assert resp.status_code == 200


def test_health_is_excluded():
    app = FastAPI()
    app.add_middleware(ActionLogMiddleware)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    with patch("app.middleware.action_log.insert_action_log") as insert:
        with TestClient(app=app) as client:
            client.get("/health")
    insert.assert_not_called()
