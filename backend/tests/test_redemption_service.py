"""Tests for the redemption service (#18)."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.db import rewards as rewards_db
from app.db import users as users_db
from app.db.session import get_session
from app.models.user import User
from app.services import redemption_service


def _user_with_balance(balance: int) -> int:
    uid = users_db.create_user(email="u@o.il", full_name="U", role="teacher")
    with get_session() as session:
        session.get(User, uid).points_balance = balance
    return uid


def test_redeem_success_debits_balance(orm_db):
    uid = _user_with_balance(200)
    rid = rewards_db.create_reward(
        provider="שופרסל", title="שובר", category="shop", cost=120
    )
    result = redemption_service.redeem(user_id=uid, reward_id=rid)
    assert result["points_spent"] == 120
    assert result["status"] == "pending"
    assert users_db.get_user_by_id(uid)["points_balance"] == 80


def test_redeem_insufficient_balance_rejected(orm_db):
    uid = _user_with_balance(50)
    rid = rewards_db.create_reward(
        provider="FOX", title="שובר", category="shop", cost=200
    )
    with pytest.raises(HTTPException) as exc:
        redemption_service.redeem(user_id=uid, reward_id=rid)
    assert exc.value.status_code == 400
    # Balance untouched after a failed redemption.
    assert users_db.get_user_by_id(uid)["points_balance"] == 50


def test_redeem_missing_reward_404(orm_db):
    uid = _user_with_balance(100)
    with pytest.raises(HTTPException) as exc:
        redemption_service.redeem(user_id=uid, reward_id=4242)
    assert exc.value.status_code == 404


def test_redeem_soft_deleted_reward_rejected(orm_db):
    """A soft-deleted reward (is_active=0) cannot be redeemed by id."""
    uid = _user_with_balance(500)
    rid = rewards_db.create_reward(
        provider="שופרסל", title="שובר", category="shop", cost=100
    )
    rewards_db.set_reward_active(rid, is_active=False)
    with pytest.raises(HTTPException) as exc:
        redemption_service.redeem(user_id=uid, reward_id=rid)
    assert exc.value.status_code == 400
    # Balance untouched: no points debited for an unavailable reward.
    assert users_db.get_user_by_id(uid)["points_balance"] == 500


def test_redeem_out_of_stock_reward_rejected(orm_db):
    """An out-of-stock reward (in_stock=0) cannot be redeemed by id."""
    uid = _user_with_balance(500)
    rid = rewards_db.create_reward(
        provider="FOX", title="שובר", category="shop", cost=100, in_stock=False
    )
    with pytest.raises(HTTPException) as exc:
        redemption_service.redeem(user_id=uid, reward_id=rid)
    assert exc.value.status_code == 400
    assert users_db.get_user_by_id(uid)["points_balance"] == 500
