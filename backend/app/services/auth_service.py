"""Authentication business logic (#7).

Handles Google OAuth token exchange, profile fetch, user registration and the
find-or-create flow. All DB access goes through the db layer; no logic lives in
the route handlers. Google network calls are isolated in small functions so they
can be mocked in unit tests.
"""
from __future__ import annotations

import logging
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.logging import store_log
from app.core.security import create_access_token
from app.db import users as users_db
from app.schemas.user import ROLE_VALUES, Role, UserCreate, UserRead
from app.translations.translator import t

logger = logging.getLogger("fergon.auth")


def build_google_authorize_url() -> str:
    """Construct the Google consent-screen URL to redirect the user to."""
    settings = get_settings()
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{settings.GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_token(code: str) -> dict:
    """Exchange an authorization code for Google tokens."""
    settings = get_settings()
    response = httpx.post(
        settings.GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        timeout=10.0,
    )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=t("auth.invalid_google_token"),
        )
    return response.json()


def fetch_google_profile(access_token: str) -> dict:
    """Fetch the user's Google profile (sub, email, name)."""
    settings = get_settings()
    response = httpx.get(
        settings.GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10.0,
    )
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=t("auth.invalid_google_token"),
        )
    return response.json()


def _find_or_create_from_profile(profile: dict) -> dict:
    """Return the existing user for a Google profile or create a new one."""
    settings = get_settings()
    oauth_id = profile.get("sub")
    email = profile.get("email")
    full_name = profile.get("name") or email

    existing = None
    if oauth_id:
        existing = users_db.get_user_by_oauth_id(oauth_id)
    if existing is None and email:
        existing = users_db.get_user_by_email(email)
    if existing is not None:
        return existing

    user_id = users_db.create_user(
        email=email,
        full_name=full_name,
        role=settings.DEFAULT_USER_ROLE,
        oauth_id=oauth_id,
    )
    return users_db.get_user_by_id(user_id)


def login_with_google(code: str) -> dict:
    """Full callback flow: exchange code, fetch profile, find-or-create, issue JWT."""
    tokens = exchange_code_for_token(code)
    profile = fetch_google_profile(tokens["access_token"])
    user = _find_or_create_from_profile(profile)
    token = create_access_token(
        user_id=user["id"],
        role=user["role"],
        access_level=user.get("access_level"),
        organization_id=user.get("organization_id"),
    )
    store_log(
        "login",
        user_id=user["id"],
        details="google login",
    )
    return {"access_token": token, "user": UserRead(**user)}


def register_user(payload: UserCreate) -> dict:
    """Register a new user explicitly (non-OAuth) and issue a JWT."""
    if payload.role.value not in ROLE_VALUES:
        raise HTTPException(status_code=422, detail="auth.invalid_role")

    if users_db.get_user_by_email(payload.email) is not None:
        store_log(
            "register",
            level=logging.WARNING,
            details="duplicate registration attempt",
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=t("auth.user_exists"),
        )

    user_id = users_db.create_user(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role.value,
        oauth_id=payload.oauth_id,
    )
    user = users_db.get_user_by_id(user_id)
    token = create_access_token(
        user_id=user["id"],
        role=user["role"],
        access_level=user.get("access_level"),
        organization_id=user.get("organization_id"),
    )
    store_log("register", user_id=user["id"], details="user registered")
    return {"access_token": token, "user": UserRead(**user)}
