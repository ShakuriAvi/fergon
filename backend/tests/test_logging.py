"""Tests for structured JSON logging + dated file (#6)."""
from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path

from app.core.config import get_settings
from app.core.logging import store_log, setup_logging


def test_action_log_written_to_dated_json_file():
    setup_logging()
    store_log(
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


def test_log_action_persists_row_to_actions_logs(orm_db):
    """Every action is also written to the actions_logs table."""
    from sqlalchemy import text

    from app.db.session import get_session

    setup_logging()
    store_log("redeem", user_id=7, details="redeemed reward 3")
    logging.shutdown()

    with get_session() as session:
        row = (
            session.execute(
                text(
                    "SELECT action_name, user_id, details, success, http_method "
                    "FROM actions_logs WHERE action_name = :a"
                ),
                {"a": "redeem"},
            )
            .mappings()
            .first()
        )
    assert row is not None
    assert row["user_id"] == 7
    assert row["details"] == "redeemed reward 3"
    assert bool(row["success"]) is True
    # Internal action has no HTTP context -> defaulted.
    assert row["http_method"] == "-"


def test_log_action_persist_db_false_skips_table(orm_db):
    from sqlalchemy import text

    from app.db.session import get_session

    store_log("http_request", details="GET /ping", persist_db=False)

    with get_session() as session:
        count = session.execute(
            text("SELECT COUNT(*) FROM actions_logs WHERE action_name = :a"),
            {"a": "http_request"},
        ).scalar()
    assert count == 0


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
