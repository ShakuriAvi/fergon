"""Tests for the recognition post service (#15)."""
from __future__ import annotations

from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy import text

from app.db import allowance_periods as periods_db
from app.db import organization_recognition_values as orv_db
from app.db import organizations as orgs_db
from app.db import posts as posts_db
from app.db import recognition_values as values_db
from app.db import users as users_db
from app.db.queries import allowance_periods as periods_q
from app.db.session import get_session
from app.schemas.post import PostCreate
from app.services import post_service


def _grant(user_id, oid, role_id, month, points):
    """Seed an allowance period so the giver can spend ``points`` that month."""
    with get_session() as session:
        session.execute(
            text(periods_q.INSERT),
            {
                "user_id": user_id,
                "organization_id": oid,
                "role_id": role_id,
                "period_month": month.isoformat(),
                "base_points": points,
                "carried_in_points": 0,
                "total_granted": points,
                "used_points": 0,
            },
        )


def _setup(orm_db):
    oid = orgs_db.create_organization(name="Org")
    giver = users_db.create_user(
        email="g@o.il", full_name="G", role="teacher", organization_id=oid
    )
    recipient = users_db.create_user(
        email="r@o.il", full_name="R", role="teacher", organization_id=oid
    )
    v1 = values_db.create_value(key="שיתוף פעולה")
    v2 = values_db.create_value(key="חדשנות")
    orv_db.add_value(organization_id=oid, recognition_value_id=v1)
    orv_db.add_value(organization_id=oid, recognition_value_id=v2)
    return oid, giver, recipient, v1, v2


def test_self_recognition_rejected(orm_db):
    oid, giver, _, _, _ = _setup(orm_db)
    with pytest.raises(HTTPException) as exc:
        post_service.create_recognition(
            PostCreate(to_user_id=giver), from_user_id=giver, organization_id=oid
        )
    assert exc.value.status_code == 400


def test_multi_value_post_credits_recipient(orm_db):
    oid, giver, recipient, v1, v2 = _setup(orm_db)
    _grant(giver, oid, orm_db["teacher"], date(2026, 6, 1), 100)
    pid = post_service.create_recognition(
        PostCreate(
            to_user_id=recipient,
            points=8,
            message="תודה",
            recognition_value_ids=[v1, v2],
            data_date=date(2026, 6, 1),
        ),
        from_user_id=giver,
        organization_id=oid,
    )
    post = posts_db.get_post_by_id(pid)
    assert sorted(post["recognition_value_ids"]) == sorted([v1, v2])
    # Recipient's earned balance grew by the points.
    assert users_db.get_user_by_id(recipient)["points_balance"] == 8
    # Giver's monthly allowance was debited.
    period = periods_db.get_current_period(giver, date(2026, 6, 1))
    assert period["used_points"] == 8


def test_invalid_value_rejected(orm_db):
    oid, giver, recipient, v1, _ = _setup(orm_db)
    with pytest.raises(HTTPException) as exc:
        post_service.create_recognition(
            PostCreate(
                to_user_id=recipient,
                recognition_value_ids=[v1, 9999],  # 9999 not enabled
            ),
            from_user_id=giver,
            organization_id=oid,
        )
    assert exc.value.status_code == 400


def test_insufficient_allowance_rejected(orm_db):
    oid, giver, recipient, _, _ = _setup(orm_db)
    _grant(giver, oid, orm_db["teacher"], date(2026, 6, 1), 5)
    with pytest.raises(HTTPException) as exc:
        post_service.create_recognition(
            PostCreate(to_user_id=recipient, points=8, data_date=date(2026, 6, 1)),
            from_user_id=giver,
            organization_id=oid,
        )
    assert exc.value.status_code == 400
    # Nothing credited and nothing spent (transaction rolled back).
    assert users_db.get_user_by_id(recipient)["points_balance"] == 0


def test_no_allowance_period_rejected(orm_db):
    oid, giver, recipient, _, _ = _setup(orm_db)
    with pytest.raises(HTTPException) as exc:
        post_service.create_recognition(
            PostCreate(to_user_id=recipient, points=3, data_date=date(2026, 6, 1)),
            from_user_id=giver,
            organization_id=oid,
        )
    assert exc.value.status_code == 400


def test_recipient_from_other_org_rejected(orm_db):
    oid, giver, _, _, _ = _setup(orm_db)
    other_oid = orgs_db.create_organization(name="Other")
    outsider = users_db.create_user(
        email="x@o.il", full_name="X", role="teacher", organization_id=other_oid
    )
    with pytest.raises(HTTPException) as exc:
        post_service.create_recognition(
            PostCreate(to_user_id=outsider),
            from_user_id=giver,
            organization_id=oid,
        )
    assert exc.value.status_code == 400
