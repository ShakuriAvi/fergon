"""Tests for the admin organizations API + the admin guard (#26, #27)."""
from __future__ import annotations


def _create(client, headers, name="בית ספר א"):
    return client.post("/admin/organizations", headers=headers, json={"name": name})


def test_anon_unauthorized_401(admin_client):
    assert admin_client.get("/admin/organizations").status_code == 401


def test_non_admin_forbidden_403(admin_client, member_headers):
    assert (
        admin_client.get("/admin/organizations", headers=member_headers).status_code
        == 403
    )


def test_admin_can_crud_and_soft_delete(admin_client, admin_headers):
    # create
    resp = _create(admin_client, admin_headers, name="ארגון בדיקה")
    assert resp.status_code == 201, resp.text
    org = resp.json()
    oid = org["id"]
    assert org["is_active"] is True

    # get
    assert admin_client.get(f"/admin/organizations/{oid}", headers=admin_headers).json()["name"] == "ארגון בדיקה"

    # list envelope
    listed = admin_client.get("/admin/organizations", headers=admin_headers).json()
    assert set(listed) == {"items", "total"}
    assert listed["total"] == 1

    # update
    upd = admin_client.put(
        f"/admin/organizations/{oid}",
        headers=admin_headers,
        json={"name": "ארגון מעודכן", "city": "חיפה"},
    )
    assert upd.status_code == 200
    assert upd.json()["name"] == "ארגון מעודכן"
    assert upd.json()["city"] == "חיפה"

    # soft delete -> is_active False, excluded from default list
    deleted = admin_client.delete(f"/admin/organizations/{oid}", headers=admin_headers)
    assert deleted.status_code == 200
    assert deleted.json()["is_active"] is False
    assert admin_client.get("/admin/organizations", headers=admin_headers).json()["total"] == 0
    # still present with include_inactive
    assert admin_client.get(
        "/admin/organizations?include_inactive=true", headers=admin_headers
    ).json()["total"] == 1

    # reactivate
    re = admin_client.post(
        f"/admin/organizations/{oid}/reactivate", headers=admin_headers
    )
    assert re.json()["is_active"] is True


def test_get_missing_404(admin_client, admin_headers):
    assert admin_client.get("/admin/organizations/999", headers=admin_headers).status_code == 404


def test_create_validation_error_422(admin_client, admin_headers):
    # empty name violates min_length
    assert admin_client.post(
        "/admin/organizations", headers=admin_headers, json={"name": ""}
    ).status_code == 422


def test_search_is_injection_safe(admin_client, admin_headers):
    _create(admin_client, admin_headers, name="Safe Org")
    # A SQL-injection-style search term is treated as a literal LIKE value: no
    # error, no rows dropped — the table still exists afterwards.
    resp = admin_client.get(
        "/admin/organizations", headers=admin_headers, params={"q": "'; DROP TABLE organizations;--"}
    )
    assert resp.status_code == 200
    assert resp.json()["total"] == 0
    # table intact
    assert admin_client.get("/admin/organizations", headers=admin_headers).json()["total"] == 1
