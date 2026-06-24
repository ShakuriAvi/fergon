"""TEMPORARY dev-only email login route (#39).

!!! TEMPORARY — REMOVE LATER (see app/services/dev_auth_service.py) !!!
"""
from __future__ import annotations

from fastapi import APIRouter, Response
from starlette.requests import Request

from app.core.auth_cookies import set_session_cookies
from app.core.rate_limit import limiter
from app.schemas.auth import DevLoginRequest, Token
from app.services import dev_auth_service

router = APIRouter(prefix="/auth", tags=["auth:dev"])


@router.post("/dev-login", response_model=Token)
@limiter.limit("10/minute")
def dev_login(request: Request, response: Response, payload: DevLoginRequest) -> Token:
    """Dev-only: identify a user by email and return a session token."""
    result = dev_auth_service.login_with_email(payload.email)
    # Web reads the HttpOnly cookie; native reads the token from the body.
    set_session_cookies(response, result["access_token"])
    return Token(**result)
