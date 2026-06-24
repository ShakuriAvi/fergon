"""Tests for the admin rewards ("providers") API (#33)."""
from __future__ import annotations


def _create(client, headers, title="ספר", category="books"):
    return client.post(
        "/admin/rewards",
        headers=headers,
        json={"provider": "סטימצקי", "title": title, "category": category, "cost": 50},
    )


def test_non_admin_forbidden(admin_client, member_headers):
    assert admin_client.get("/admin/rewards", headers=member_headers).status_code == 403


def test_crud_invalid_category_and_soft_delete(admin_client, admin_headers):
    resp = _create(admin_client, admin_headers)
    assert resp.status_code == 201, resp.text
    reward = resp.json()
    rid = reward["id"]
    assert reward["is_active"] is True and reward["in_stock"] is True

    # invalid category -> 422
    assert _create(admin_client, admin_headers, category="nope").status_code == 422

    # filter by category + provider
    _create(admin_client, admin_headers, title="עוגה", category="food")
    by_cat = admin_client.get(
        "/admin/rewards?category=food", headers=admin_headers
    ).json()
    assert by_cat["total"] == 1

    # soft delete keeps row but flips is_active (distinct from in_stock)
    deleted = admin_client.delete(f"/admin/rewards/{rid}", headers=admin_headers)
    assert deleted.json()["is_active"] is False
    assert admin_client.get(f"/admin/rewards/{rid}", headers=admin_headers).status_code == 200
    assert admin_client.post(
        f"/admin/rewards/{rid}/reactivate", headers=admin_headers
    ).json()["is_active"] is True
