"""Tests for the monthly allowance reset + rollover service (#24)."""
from __future__ import annotations

from datetime import date

from app.db import allowance_periods as periods_db
from app.db import organization_role_allowances as ora_db
from app.db import organizations as orgs_db
from app.db import users as users_db
from app.services import allowance_service

JUNE = date(2026, 6, 1)
JULY = date(2026, 7, 1)


def _org_with_users(orm_db):
    oid = orgs_db.create_organization(name="Org")
    ora_db.set_allowance(
        organization_id=oid, role_id=orm_db["teacher"], monthly_points=100
    )
    ora_db.set_allowance(
        organization_id=oid, role_id=orm_db["principal"], monthly_points=50
    )
    teacher = users_db.create_user(
        email="t@o.il", full_name="T", role="teacher", organization_id=oid
    )
    principal = users_db.create_user(
        email="p@o.il", full_name="P", role="principal", organization_id=oid
    )
    return oid, teacher, principal


def test_initial_reset_grants_from_config(orm_db):
    oid, teacher, principal = _org_with_users(orm_db)
    summary = allowance_service.reset_monthly_allowances(oid, JUNE)
    assert summary["periods_created"] == 2
    assert summary["rolled_over_pool"] == 0

    t_period = periods_db.get_current_period(teacher, JUNE)
    p_period = periods_db.get_current_period(principal, JUNE)
    assert t_period["total_granted"] == 100
    assert p_period["total_granted"] == 50


def test_unused_points_roll_up_to_manager(orm_db):
    oid, teacher, principal = _org_with_users(orm_db)
    allowance_service.reset_monthly_allowances(oid, JUNE)

    # Teacher used only 30 of 100 in June -> 70 should roll up to principal.
    periods_db.add_used_points(teacher, JUNE, 30)

    summary = allowance_service.reset_monthly_allowances(
        oid, JULY, previous_period_month=JUNE
    )
    assert summary["rolled_over_pool"] == 70
    assert principal in summary["manager_user_ids"]

    t_july = periods_db.get_current_period(teacher, JULY)
    p_july = periods_db.get_current_period(principal, JULY)
    # Teacher resets to base; principal gets base + rolled-up pool.
    assert t_july["total_granted"] == 100
    assert t_july["used_points"] == 0
    assert p_july["carried_in_points"] == 70
    assert p_july["total_granted"] == 120


def test_reset_zeroes_used_points(orm_db):
    oid, teacher, _ = _org_with_users(orm_db)
    allowance_service.reset_monthly_allowances(oid, JUNE)
    periods_db.add_used_points(teacher, JUNE, 40)
    # Re-running for the same month refreshes the grant and zeroes usage.
    allowance_service.reset_monthly_allowances(oid, JUNE)
    assert periods_db.get_current_period(teacher, JUNE)["used_points"] == 0
