"""Tests for structured JSON logging + dated file (#6)."""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path

from app.core.config import get_settings
from app.core.logging import log_action, setup_logging


def test_action_log_written_to_dated_json_file():
    setup_logging()
    log_action(
        "book",
        user_id=11,
        school_id=22,
        details="booked appointment",
    )
    logging.shutdown()

    settings = get_settings()
    log_path = Path(settings.LOG_DIR) / f"{date.today().isoformat()}.log"
    assert log_path.exists()

    lines = [l for l in log_path.read_text(encoding="utf-8").splitlines() if l.strip()]
    record = json.loads(lines[-1])
    for field in ("timestamp", "level", "action", "user_id", "school_id", "details"):
        assert field in record
    assert record["action"] == "book"
    assert record["user_id"] == 11
    assert record["school_id"] == 22


def test_request_logging_records_fields(monkeypatch):
    """A request through the middleware produces a structured log record."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.middleware.request_logging import RequestLoggingMiddleware

    setup_logging()
    app = FastAPI()
    app.add_middleware(RequestLoggingMiddleware)

    @app.get("/ping")
    def ping():
        return {"pong": True}

    with TestClient(app) as client:
        assert client.get("/ping").status_code == 200
    logging.shutdown()

    settings = get_settings()
    log_path = Path(settings.LOG_DIR) / f"{date.today().isoformat()}.log"
    content = log_path.read_text(encoding="utf-8")
    assert "/ping" in content
    assert '"status_code": 200' in content
