"""Tests for the admin recognition values catalog API (#30)."""
from __future__ import annotations


def _create(client, headers, key="אמפתיה"):
    return client.post(
        "/admin/recognition-values",
        headers=headers,
        json={"key": key, "emoji": "💗", "tone": "green"},
    )


def test_non_admin_forbidden(admin_client, member_headers):
    assert (
        admin_client.get("/admin/recognition-values", headers=member_headers).status_code
        == 403
    )


def test_crud_unique_key_and_soft_delete(admin_client, admin_headers):
    resp = _create(admin_client, admin_headers)
    assert resp.status_code == 201, resp.text
    vid = resp.json()["id"]

    # unique key -> 409
    assert _create(admin_client, admin_headers).status_code == 409

    # update
    upd = admin_client.put(
        f"/admin/recognition-values/{vid}",
        headers=admin_headers,
        json={"key": "אמפתיה", "emoji": "❤️", "tone": "terra"},
    )
    assert upd.json()["emoji"] == "❤️"

    # soft delete + reactivate
    assert admin_client.delete(
        f"/admin/recognition-values/{vid}", headers=admin_headers
    ).json()["is_active"] is False
    assert admin_client.post(
        f"/admin/recognition-values/{vid}/reactivate", headers=admin_headers
    ).json()["is_active"] is True
