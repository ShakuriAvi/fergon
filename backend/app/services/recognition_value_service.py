"""Recognition value catalog admin business logic (#30).

CRUD for the global ``recognition_values`` catalog, admin-only. Enforces a
unique ``key``. Deletes are soft (``is_active = 0``).
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.logging import store_log
from app.db import recognition_values as values_db
from app.schemas.recognition_value import (
    RecognitionValueCreate,
    RecognitionValueUpdate,
)
from app.translations.translator import t


def _get_or_404(value_id: int) -> dict[str, Any]:
    value = values_db.get_value_by_id(value_id)
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )
    return value


def _ensure_key_free(key: str, *, exclude_id: int | None = None) -> None:
    existing = values_db.get_value_by_key(key)
    if existing is not None and existing["id"] != exclude_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=t("recognition_value.key_taken")
        )


def list_values(
    *, q: str | None, include_inactive: bool, limit: int, offset: int
) -> tuple[list[dict[str, Any]], int]:
    return values_db.list_values_page(
        q_text=q, include_inactive=include_inactive, limit=limit, offset=offset
    )


def get_value(value_id: int) -> dict[str, Any]:
    return _get_or_404(value_id)


def create_value(
    payload: RecognitionValueCreate, *, actor_id: int | None = None
) -> dict[str, Any]:
    _ensure_key_free(payload.key)
    new_id = values_db.create_value(
        key=payload.key, emoji=payload.emoji, tone=payload.tone
    )
    store_log(
        "admin_recognition_value_create", level=logging.INFO, user_id=actor_id,
        details=f"recognition_value {new_id}",
    )
    return _get_or_404(new_id)


def update_value(
    value_id: int, payload: RecognitionValueUpdate, *, actor_id: int | None = None
) -> dict[str, Any]:
    _get_or_404(value_id)
    _ensure_key_free(payload.key, exclude_id=value_id)
    values_db.update_value(
        value_id, key=payload.key, emoji=payload.emoji, tone=payload.tone
    )
    store_log(
        "admin_recognition_value_update", level=logging.INFO, user_id=actor_id,
        details=f"recognition_value {value_id}",
    )
    return _get_or_404(value_id)


def deactivate_value(value_id: int, *, actor_id: int | None = None) -> dict[str, Any]:
    _get_or_404(value_id)
    values_db.set_value_active(value_id, is_active=False)
    store_log(
        "admin_recognition_value_delete", level=logging.INFO, user_id=actor_id,
        details=f"recognition_value {value_id} deactivated",
    )
    return _get_or_404(value_id)


def reactivate_value(value_id: int, *, actor_id: int | None = None) -> dict[str, Any]:
    _get_or_404(value_id)
    values_db.set_value_active(value_id, is_active=True)
    store_log(
        "admin_recognition_value_reactivate", level=logging.INFO, user_id=actor_id,
        details=f"recognition_value {value_id} reactivated",
    )
    return _get_or_404(value_id)
