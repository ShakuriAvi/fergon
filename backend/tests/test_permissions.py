"""Tests for permission enforcement (#8)."""
from __future__ import annotations

from unittest.mock import patch

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.middleware.permissions import require_roles
from app.schemas.user import Role

_ACTIVE_USER = {"id": 1, "role": "teacher", "is_active": True}
_INACTIVE_USER = {"id": 1, "role": "teacher", "is_active": False}


def _app() -> FastAPI:
    app = FastAPI()

    @app.get("/admin-only")
    def admin_only(user=Depends(require_roles(Role.ADMIN))):
        return {"ok": True}

    @app.get("/staff")
    def staff(user=Depends(require_roles(Role.ADMIN, Role.PRINCIPAL))):
        return {"ok": True}

    return app


def _auth(role: str) -> dict[str, str]:
    token = create_access_token(user_id=1, role=role)
    return {"Authorization": f"Bearer {token}"}


def test_allowed_role_passes():
    with TestClient(_app()) as client:
        assert client.get("/admin-only", headers=_auth("admin")).status_code == 200


def test_wrong_role_forbidden_403():
    with TestClient(_app()) as client:
        resp = client.get("/admin-only", headers=_auth("teacher"))
    assert resp.status_code == 403


def test_missing_token_unauthorized_401():
    with TestClient(_app()) as client:
        assert client.get("/admin-only").status_code == 401


def test_multiple_allowed_roles():
    with TestClient(_app()) as client:
        assert client.get("/staff", headers=_auth("principal")).status_code == 200
        assert client.get("/staff", headers=_auth("secretary")).status_code == 403


def test_permissions_middleware_blocks_protected_route():
    """The middleware returns 401 for an unauthenticated non-public route."""
    from app.middleware.permissions import PermissionsMiddleware

    app = FastAPI()
    app.add_middleware(PermissionsMiddleware)

    @app.get("/secret")
    def secret():
        return {"ok": True}

    with patch("app.db.users.get_user_by_id", return_value=_ACTIVE_USER):
        with TestClient(app) as client:
            assert client.get("/secret").status_code == 401
            assert client.get("/secret", headers=_auth("teacher")).status_code == 200
        # /health is allowlisted as public.
    app2 = FastAPI()
    app2.add_middleware(PermissionsMiddleware)

    @app2.get("/health")
    def health():
        return {"status": "ok"}

    with TestClient(app2) as client:
        assert client.get("/health").status_code == 200


def test_middleware_rejects_inactive_user_401():
    """A valid token for a deactivated (is_active=0) user is rejected."""
    from app.middleware.permissions import PermissionsMiddleware

    app = FastAPI()
    app.add_middleware(PermissionsMiddleware)

    @app.get("/secret")
    def secret():
        return {"ok": True}

    with patch("app.db.users.get_user_by_id", return_value=_INACTIVE_USER):
        with TestClient(app) as client:
            resp = client.get("/secret", headers=_auth("teacher"))
    assert resp.status_code == 401


# --- Cookie auth + CSRF (web transport) ------------------------------------

def _cookie_app() -> FastAPI:
    from app.middleware.permissions import PermissionsMiddleware

    app = FastAPI()
    app.add_middleware(PermissionsMiddleware)

    @app.get("/secret")
    def secret():
        return {"ok": True}

    @app.post("/secret")
    def secret_write():
        return {"ok": True}

    return app


def test_cookie_auth_get_no_csrf_required():
    """A GET authenticated via the access cookie needs no CSRF token."""
    from app.core.auth_cookies import ACCESS_COOKIE

    app = _cookie_app()
    token = create_access_token(user_id=1, role="teacher")
    with patch("app.db.users.get_user_by_id", return_value=_ACTIVE_USER):
        with TestClient(app) as client:
            client.cookies.set(ACCESS_COOKIE, token)
            assert client.get("/secret").status_code == 200


def test_cookie_auth_post_without_csrf_403():
    """A cookie-authenticated unsafe request without a CSRF token is rejected."""
    from app.core.auth_cookies import ACCESS_COOKIE

    app = _cookie_app()
    token = create_access_token(user_id=1, role="teacher")
    with patch("app.db.users.get_user_by_id", return_value=_ACTIVE_USER):
        with TestClient(app) as client:
            client.cookies.set(ACCESS_COOKIE, token)
            assert client.post("/secret").status_code == 403


def test_cookie_auth_post_with_matching_csrf_passes():
    """Double-submit: matching CSRF cookie + header allows the unsafe request."""
    from app.core.auth_cookies import ACCESS_COOKIE, CSRF_COOKIE, CSRF_HEADER

    app = _cookie_app()
    token = create_access_token(user_id=1, role="teacher")
    with patch("app.db.users.get_user_by_id", return_value=_ACTIVE_USER):
        with TestClient(app) as client:
            client.cookies.set(ACCESS_COOKIE, token)
            client.cookies.set(CSRF_COOKIE, "csrf-abc")
            resp = client.post("/secret", headers={CSRF_HEADER: "csrf-abc"})
    assert resp.status_code == 200


def test_cookie_auth_post_with_mismatched_csrf_403():
    from app.core.auth_cookies import ACCESS_COOKIE, CSRF_COOKIE, CSRF_HEADER

    app = _cookie_app()
    token = create_access_token(user_id=1, role="teacher")
    with patch("app.db.users.get_user_by_id", return_value=_ACTIVE_USER):
        with TestClient(app) as client:
            client.cookies.set(ACCESS_COOKIE, token)
            client.cookies.set(CSRF_COOKIE, "csrf-abc")
            resp = client.post("/secret", headers={CSRF_HEADER: "wrong"})
    assert resp.status_code == 403


def test_bearer_post_exempt_from_csrf():
    """Header (Bearer) auth needs no CSRF token even on unsafe methods."""
    app = _cookie_app()
    with patch("app.db.users.get_user_by_id", return_value=_ACTIVE_USER):
        with TestClient(app) as client:
            resp = client.post("/secret", headers=_auth("teacher"))
    assert resp.status_code == 200
