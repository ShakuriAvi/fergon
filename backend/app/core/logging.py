"""Structured JSON logging configuration (#6).

* Logs are emitted as JSON containing the fields required by CLAUDE.md:
  ``timestamp | level | action | user_id | school_id | details``.
* A **separate log file per day** is written; the file name is the date,
  e.g. ``logs/2026-06-08.log``.
* ``log_action`` is a reusable helper that emits an action log in the required
  shape so every user action can be tracked.
"""
from __future__ import annotations

import json
import logging
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from app.core.config import get_settings

_ACTION_LOGGER_NAME = "fergoni.action"


class JsonFormatter(logging.Formatter):
    """Render log records as single-line JSON with the required fields."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "action": getattr(record, "action", record.name),
            "user_id": getattr(record, "user_id", None),
            "school_id": getattr(record, "school_id", None),
            "details": getattr(record, "details", record.getMessage()),
        }
        # Surface any extra structured context that was attached to the record.
        for key in ("method", "path", "status_code", "duration_ms"):
            value = getattr(record, key, None)
            if value is not None:
                payload[key] = value
        if record.exc_info:
            payload["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def _dated_log_path() -> Path:
    """Return ``<LOG_DIR>/<today>.log`` (creating the directory)."""
    settings = get_settings()
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir / f"{date.today().isoformat()}.log"


def setup_logging() -> None:
    """Configure root logging with JSON output to a console + dated file handler."""
    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    root = logging.getLogger()
    root.setLevel(level)

    # Avoid duplicate handlers if called more than once (e.g. in tests).
    for handler in list(root.handlers):
        root.removeHandler(handler)

    formatter = JsonFormatter()

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    root.addHandler(console)

    file_handler = logging.FileHandler(_dated_log_path(), encoding="utf-8")
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)


def store_log(
    action: str,
    *,
    level: int = logging.INFO,
    user_id: Any | None = None,
    school_id: Any | None = None,
    details: Any | None = None,
    persist_db: bool = True,
    **extra: Any,
) -> None:
    """Emit an action log record in the required structured format.

    Besides the JSON file/console log, every action is persisted to the
    ``actions_logs`` table so user actions are auditable in the DB. Set
    ``persist_db=False`` for callers whose action is already written to the table
    elsewhere (e.g. the request-logging middleware, which the action-log
    middleware already records) to avoid duplicate rows.
    """
    logger = logging.getLogger(_ACTION_LOGGER_NAME)
    logger.log(
        level,
        details if details is not None else action,
        extra={
            "action": action,
            "user_id": user_id,
            "school_id": school_id,
            "details": details,
            **extra,
        },
    )
    if persist_db:
        _persist_store_log(
            action,
            level=level,
            user_id=user_id,
            school_id=school_id,
            details=details,
            extra=extra,
        )


def _persist_store_log(
    action: str,
    *,
    level: int,
    user_id: Any | None,
    school_id: Any | None,
    details: Any | None,
    extra: dict[str, Any],
) -> None:
    """Best-effort write of an action to the ``actions_logs`` table.

    A logging failure must never break the business action, so any DB error is
    swallowed (and itself logged at DEBUG). Imported lazily to avoid a circular
    import at module load.
    """
    try:
        from app.db.action_log import insert_action_log

        insert_action_log(
            action_name=action,
            user_id=user_id,
            school_id=school_id,
            details=None if details is None else str(details),
            success=level < logging.WARNING,
            http_method=extra.get("method"),
            path=extra.get("path"),
            status_code=extra.get("status_code"),
            duration_ms=extra.get("duration_ms"),
            page=extra.get("page"),
            payload=extra.get("payload"),
        )
    except Exception:  # pragma: no cover - audit write must never raise
        logging.getLogger(_ACTION_LOGGER_NAME).debug(
            "failed to persist action log to db", exc_info=True
        )
