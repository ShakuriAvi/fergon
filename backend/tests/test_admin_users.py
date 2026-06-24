"""Tests for the admin users API (#29)."""
from __future__ import annotations


def _create(client, headers, orm_db, email="t1@org.il", org_id=None):
    return client.post(
        "/admin/users",
        headers=headers,
        json={
            "email": email,
            "full_name": "מורה אחת",
            "role_id": orm_db["teacher"],
            "organization_id": org_id,
        },
    )


def test_non_admin_forbidden(admin_client, member_headers):
    assert admin_client.get("/admin/users", headers=member_headers).status_code == 403


def test_crud_filters_and_soft_delete(admin_client, admin_headers, orm_db):
    from app.db import organizations as orgs_db

    oid = orgs_db.create_organization(name="Org")
    resp = _create(admin_client, admin_headers, orm_db, org_id=oid)
    assert resp.status_code == 201, resp.text
    user = resp.json()
    uid = user["id"]
    # sensitive field never exposed
    assert "oauth_id" not in user

    # duplicate email -> 409
    assert _create(admin_client, admin_headers, orm_db, org_id=oid).status_code == 409

    # invalid role id -> 400
    bad = admin_client.post(
        "/admin/users",
        headers=admin_headers,
        json={"email": "x@org.il", "full_name": "X", "role_id": 9999},
    )
    assert bad.status_code == 400

    # filter by organization
    filtered = admin_client.get(
        f"/admin/users?organization_id={oid}", headers=admin_headers
    ).json()
    assert filtered["total"] == 1

    # soft delete -> revoked + excluded
    deleted = admin_client.delete(f"/admin/users/{uid}", headers=admin_headers)
    assert deleted.json()["is_active"] is False
    assert admin_client.get("/admin/users", headers=admin_headers).json()["total"] == 0
    # reactivate
    assert admin_client.post(
        f"/admin/users/{uid}/reactivate", headers=admin_headers
    ).json()["is_active"] is True
