"""Web session cookie + CSRF helpers (#34 security hardening).

Two auth transports share one JWT:

* **Web (browser)** — the JWT is delivered in an ``HttpOnly`` + ``Secure`` +
  ``SameSite=Lax`` cookie so an XSS in the SPA cannot read or exfiltrate it
  (``localStorage`` could). State-changing requests are additionally protected
  by a double-submit CSRF token: the same random value is set in a *non*-
  ``HttpOnly`` cookie and must be echoed back in the ``X-CSRF-Token`` header.
* **Native (mobile)** — keeps using the ``Authorization: Bearer`` header with
  the token from the login JSON body (mobile apps have no cookie jar). Header
  auth needs no CSRF token: a browser never attaches a custom header to a
  cross-site request, so it cannot be forged the way an ambient cookie can.

Login endpoints therefore both *return* the token in the body (native) and *set*
the cookies (web); each client uses whichever transport fits it.
"""
from __future__ import annotations

import secrets

from starlette.responses import Response

from app.core.config import get_settings

ACCESS_COOKIE = "access_token"
CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "x-csrf-token"

# Methods that mutate state and therefore require a CSRF token when the request
# is authenticated via the cookie.
UNSAFE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


def _secure_cookies() -> bool:
    """Secure cookies require HTTPS; dev runs over plain ``http://localhost``."""
    return get_settings().APP_ENV.lower() != "dev"


def set_session_cookies(response: Response, token: str) -> str:
    """Set the HttpOnly access cookie + the readable CSRF cookie on ``response``.

    Returns the issued CSRF token (useful for tests / callers); the SPA reads it
    from the ``csrf_token`` cookie rather than the response body.
    """
    settings = get_settings()
    max_age = settings.JWT_EXPIRE_MINUTES * 60
    secure = _secure_cookies()
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        ACCESS_COOKIE,
        token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        max_age=max_age,
        httponly=False,  # the SPA must read this to echo it back in the header
        secure=secure,
        samesite="lax",
        path="/",
    )
    return csrf_token


def clear_session_cookies(response: Response) -> None:
    """Remove both session cookies (logout)."""
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(CSRF_COOKIE, path="/")


def csrf_token_valid(*, cookie_value: str | None, header_value: str | None) -> bool:
    """Constant-time double-submit check: cookie value must match the header."""
    if not cookie_value or not header_value:
        return False
    return secrets.compare_digest(cookie_value, header_value)
