"""Tests for the per-org recognition values (#31) and role allowances (#32) APIs."""
from __future__ import annotations

import pytest


@pytest.fixture
def org_id():
    from app.db import organizations as orgs_db

    return orgs_db.create_organization(name="ארגון")


@pytest.fixture
def value_id():
    from app.db import recognition_values as values_db

    return values_db.create_value(key="הקשבה", emoji="👂")


# --- Organization recognition values (#31) --------------------------------

def test_org_values_add_remove_reactivate(admin_client, admin_headers, org_id, value_id):
    base = f"/admin/organizations/{org_id}/recognition-values"

    # available before adding
    avail = admin_client.get(f"{base}/available", headers=admin_headers).json()
    assert any(v["id"] == value_id for v in avail)

    # add
    added = admin_client.post(
        base, headers=admin_headers, json={"recognition_value_id": value_id}
    )
    assert added.status_code == 201, added.text
    assert added.json()["is_active"] is True
    assert added.json()["key"] == "הקשבה"

    # listed as active; no longer available
    assert admin_client.get(base, headers=admin_headers).json()[0]["is_active"] is True
    assert all(
        v["id"] != value_id
        for v in admin_client.get(f"{base}/available", headers=admin_headers).json()
    )

    # remove = soft delete
    removed = admin_client.delete(f"{base}/{value_id}", headers=admin_headers)
    assert removed.json()["is_active"] is False
    assert admin_client.get(base, headers=admin_headers).json() == []

    # re-add reactivates the same row (no duplicate / no error)
    again = admin_client.post(
        base, headers=admin_headers, json={"recognition_value_id": value_id}
    )
    assert again.status_code == 201
    # include_inactive shows exactly one row for that value
    rows = admin_client.get(
        f"{base}?include_inactive=true", headers=admin_headers
    ).json()
    assert len([r for r in rows if r["recognition_value_id"] == value_id]) == 1


def test_org_values_requires_admin(admin_client, member_headers, org_id):
    assert admin_client.get(
        f"/admin/organizations/{org_id}/recognition-values", headers=member_headers
    ).status_code == 403


# --- Organization role allowances (#32) -----------------------------------

def test_role_allowances_set_update_remove(admin_client, admin_headers, org_id, orm_db):
    base = f"/admin/organizations/{org_id}/role-allowances"
    teacher = orm_db["teacher"]

    # every active role listed; teacher unset initially
    rows = admin_client.get(base, headers=admin_headers).json()
    teacher_row = next(r for r in rows if r["role_id"] == teacher)
    assert teacher_row["monthly_points"] is None

    # set (upsert)
    resp = admin_client.put(
        base, headers=admin_headers, json={"role_id": teacher, "monthly_points": 30}
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["monthly_points"] == 30

    # update reactivates/updates same row
    resp2 = admin_client.put(
        base, headers=admin_headers, json={"role_id": teacher, "monthly_points": 45}
    )
    assert resp2.json()["monthly_points"] == 45

    # negative points rejected
    assert admin_client.put(
        base, headers=admin_headers, json={"role_id": teacher, "monthly_points": -1}
    ).status_code == 422

    # remove = soft delete; teacher back to unset in the list
    admin_client.delete(f"{base}/{teacher}", headers=admin_headers)
    rows2 = admin_client.get(base, headers=admin_headers).json()
    assert next(r for r in rows2 if r["role_id"] == teacher)["monthly_points"] is None
