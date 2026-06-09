"""Authentication views (#7). HTTP only — delegates to the auth service."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from starlette.requests import Request

from app.core.rate_limit import limiter
from app.core.security import get_current_user
from app.db import users as users_db
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserRead
from app.services import auth_service
from app.translations.translator import t

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/login")
def google_login() -> RedirectResponse:
    """Redirect the user to Google's consent screen."""
    return RedirectResponse(url=auth_service.build_google_authorize_url())


@router.get("/google/callback", response_model=Token)
@limiter.limit("10/minute")
def google_callback(request: Request, code: str) -> Token:
    """Handle Google's redirect: exchange the code and issue a session token."""
    result = auth_service.login_with_google(code)
    return Token(**result)


@router.post("/register", response_model=Token, status_code=201)
@limiter.limit("5/minute")
def register(request: Request, payload: UserCreate) -> Token:
    """Register a new user and return an access token."""
    result = auth_service.register_user(payload)
    return Token(**result)


@router.get("/me", response_model=UserRead)
def me(current=Depends(get_current_user)) -> UserRead:
    """Return the currently authenticated user's identity claims."""
    user = users_db.get_user_by_id(current["id"])
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("common.not_found"),
        )
    return UserRead(**user)
