"""Tests for permission enforcement (#8)."""
from __future__ import annotations

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.middleware.permissions import require_roles
from app.schemas.user import Role


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
