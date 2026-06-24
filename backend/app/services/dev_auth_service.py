"""TEMPORARY dev-only email login (#39).

!!! TEMPORARY — REMOVE LATER !!!
This module exists ONLY to validate the end-to-end flow locally without Google
OAuth, so each seeded role can be simulated by typing an email. Real auth is
Google/Gmail (see ``auth_service``). When OAuth becomes the sole auth path,
delete:
  * this file
  * ``app/api/routes/dev_auth.py``
  * its registration in ``app/main.py``
  * ``DevLoginRequest`` in ``app/schemas/auth.py``
  * ``/auth/dev-login`` from ``PUBLIC_PATHS`` in ``app/middleware/permissions.py``

It is gated to ``APP_ENV == "dev"`` and returns 404 otherwise, so it is inert in
prod even if accidentally left registered.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.logging import store_log
from app.core.security import create_access_token
from app.db import users as users_db
from app.schemas.user import UserRead
from app.translations.translator import t


def dev_login_enabled() -> bool:
    """True only in the dev environment."""
    return get_settings().APP_ENV.lower() == "dev"


def login_with_email(email: str) -> dict[str, Any]:
    """Issue a JWT for an existing active user identified solely by email."""
    if not dev_login_enabled():
        # Inert outside dev: behave as if the route does not exist.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("common.not_found")
        )

    user = users_db.get_user_by_email(email)
    if user is None or not user.get("is_active", False):
        store_log(
            "dev_login",
            level=logging.WARNING,
            details=f"unknown or inactive email: {email}",
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=t("auth.user_not_found")
        )

    token = create_access_token(
        user_id=user["id"],
        role=user["role"],
        access_level=user.get("access_level"),
        organization_id=user.get("organization_id"),
    )
    store_log("dev_login", user_id=user["id"], details="dev email login")
    return {"access_token": token, "user": UserRead(**user)}
