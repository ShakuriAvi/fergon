"""Tests for the recognition-domain DB layers (#12-#24)."""
from __future__ import annotations

from datetime import date

import pytest

from app.db import allowance_periods as periods_db
from app.db import organization_recognition_values as orv_db
from app.db import organization_role_allowances as ora_db
from app.db import organizations as orgs_db
from app.db import posts as posts_db
from app.db import recognition_values as values_db
from app.db import redemptions as redemptions_db
from app.db import rewards as rewards_db
from app.db import roles as roles_db
from app.db import users as users_db


def _org() -> int:
    return orgs_db.create_organization(name="Org", short_name="O", city="TLV")


def test_organization_roundtrip(orm_db):
    oid = _org()
    org = orgs_db.get_organization_by_id(oid)
    assert org["name"] == "Org"
    assert org["is_active"] is True
    assert oid in {o["id"] for o in orgs_db.list_organizations()}


def test_roles_seeded_and_readable(orm_db):
    teacher = roles_db.get_role_by_name("teacher")
    assert teacher["access_level"] == "member"
    assert teacher["rolls_up"] is True
    principal = roles_db.get_role_by_name("principal")
    assert principal["is_manager"] is True
    assert {"admin", "teacher", "principal"} <= {r["name"] for r in roles_db.list_roles()}


def test_recognition_value_roundtrip(orm_db):
    vid = values_db.create_value(key="חדשנות", emoji="💡", tone="gold")
    value = values_db.get_value_by_id(vid)
    assert value["key"] == "חדשנות"


def test_reward_roundtrip(orm_db):
    rid = rewards_db.create_reward(
        provider="סטימצקי", title="שובר", category="books", cost=120
    )
    reward = rewards_db.get_reward_by_id(rid)
    assert reward["category"] == "books"
    assert reward["cost"] == 120


def test_org_recognition_value_link(orm_db):
    oid = _org()
    vid = values_db.create_value(key="מנהיגות")
    orv_db.add_value(organization_id=oid, recognition_value_id=vid)
    assert orv_db.enabled_value_ids(oid) == {vid}


def test_org_role_allowance_upsert(orm_db):
    oid = _org()
    ora_db.set_allowance(
        organization_id=oid, role_id=orm_db["teacher"], monthly_points=100
    )
    assert ora_db.get_monthly_points(oid, orm_db["teacher"]) == 100
    # Upsert updates in place.
    ora_db.set_allowance(
        organization_id=oid, role_id=orm_db["teacher"], monthly_points=80
    )
    assert ora_db.get_monthly_points(oid, orm_db["teacher"]) == 80
    assert len(ora_db.list_for_organization(oid)) == 1


def test_post_roundtrip_and_feed(orm_db):
    oid = _org()
    giver = users_db.create_user(
        email="g@o.il", full_name="G", role="teacher", organization_id=oid
    )
    recipient = users_db.create_user(
        email="r@o.il", full_name="R", role="teacher", organization_id=oid
    )
    pid = posts_db.create_post(
        from_user_id=giver,
        to_user_id=recipient,
        organization_id=oid,
        points=8,
        message="כל הכבוד",
        recognition_value_ids=[1, 2],
        data_date=date(2026, 6, 1),
    )
    post = posts_db.get_post_by_id(pid)
    assert post["recognition_value_ids"] == [1, 2]
    assert posts_db.list_feed(organization_id=oid)[0]["id"] == pid
    assert posts_db.list_for_user(recipient, direction="received")[0]["id"] == pid


def test_redemption_roundtrip(orm_db):
    uid = users_db.create_user(email="u@o.il", full_name="U", role="teacher")
    rid = rewards_db.create_reward(
        provider="ארומה", title="קפה", category="food", cost=90
    )
    red_id = redemptions_db.create_redemption(
        user_id=uid, reward_id=rid, points_spent=90
    )
    red = redemptions_db.get_redemption_by_id(red_id)
    assert red["status"] == "pending"
    assert redemptions_db.list_for_user(uid)[0]["id"] == red_id


def test_allowance_period_used_points(orm_db):
    oid = _org()
    uid = users_db.create_user(
        email="p@o.il", full_name="P", role="teacher", organization_id=oid
    )
    # Create a period directly via the model through a session.
    from app.db.session import get_session
    from app.models.allowance_period import AllowancePeriod

    month = date(2026, 6, 1)
    with get_session() as session:
        session.add(
            AllowancePeriod(
                user_id=uid,
                organization_id=oid,
                role_id=orm_db["teacher"],
                period_month=month,
                base_points=100,
                total_granted=100,
            )
        )
    periods_db.add_used_points(uid, month, 30)
    current = periods_db.get_current_period(uid, month)
    assert current["used_points"] == 30
    assert current["remaining"] == 70
