"""Tests for the admin roles API (#28)."""
from __future__ import annotations


def _create(client, headers, name="coordinator"):
    return client.post(
        "/admin/roles",
        headers=headers,
        json={"name": name, "name_he": "רכז/ת", "access_level": "member"},
    )


def test_non_admin_forbidden(admin_client, member_headers):
    assert admin_client.get("/admin/roles", headers=member_headers).status_code == 403


def test_crud_and_unique_name(admin_client, admin_headers):
    resp = _create(admin_client, admin_headers)
    assert resp.status_code == 201, resp.text
    role = resp.json()
    assert role["is_active"] is True

    # duplicate name -> 409
    assert _create(admin_client, admin_headers).status_code == 409

    # update
    upd = admin_client.put(
        f"/admin/roles/{role['id']}",
        headers=admin_headers,
        json={"name": "coordinator", "name_he": "רכז", "access_level": "manager",
              "is_manager": True, "rolls_up": False},
    )
    assert upd.status_code == 200
    assert upd.json()["access_level"] == "manager"


def test_soft_delete_keeps_references(admin_client, admin_headers, orm_db):
    # deactivate a seeded role that users may reference
    rid = orm_db["teacher"]
    deleted = admin_client.delete(f"/admin/roles/{rid}", headers=admin_headers)
    assert deleted.status_code == 200
    assert deleted.json()["is_active"] is False
    # excluded from default list, present with include_inactive
    listed = admin_client.get("/admin/roles", headers=admin_headers).json()
    assert all(r["id"] != rid for r in listed["items"])
    all_listed = admin_client.get(
        "/admin/roles?include_inactive=true", headers=admin_headers
    ).json()
    assert any(r["id"] == rid for r in all_listed["items"])
    # role row still exists (soft delete, not removed)
    assert admin_client.get(f"/admin/roles/{rid}", headers=admin_headers).status_code == 200
