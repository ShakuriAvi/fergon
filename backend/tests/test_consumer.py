"""Tests for the consumer read endpoints (#41), driven by the dev seed (#40)."""
from __future__ import annotations

import pytest

from app.core.config import reset_settings
from app.core.security import create_access_token
from app.db import users as users_db
from app.services import consumer_service as svc


@pytest.fixture
def seeded(orm_db, monkeypatch):
    monkeypatch.setenv("APP_ENV", "dev")
    reset_settings()
    from app import seed

    seed.seed_all()
    return {
        u: users_db.get_user_by_email(f"{u}@fergoni.dev")
        for u in ("yael", "noa", "itai", "michal")
    }


def _client():
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.api.routes import consumer

    app = FastAPI()
    app.include_router(consumer.router)
    return TestClient(app)


def _auth(user):
    token = create_access_token(
        user_id=user["id"], role=user["role"], access_level=user.get("access_level"),
        organization_id=user["organization_id"],
    )
    return {"Authorization": f"Bearer {token}"}


def test_feed_is_org_scoped(seeded):
    yael = seeded["yael"]
    items, total = svc.get_feed(yael["organization_id"], limit=50, offset=0)
    # herzl givers in the seed: michal(2) + avi(2) + yael(2) = 6 posts.
    assert total == 6
    assert all("from_name" in it and "to_name" in it for it in items)
    # a different org yields a different (isolated) feed: ort givers omer(1)+itai(1)=2
    itai = seeded["itai"]
    _, total_ort = svc.get_feed(itai["organization_id"], limit=50, offset=0)
    assert total_ort == 2


def test_feed_items_enriched_with_names_and_values(seeded):
    items, _ = svc.get_feed(seeded["yael"]["organization_id"], limit=1, offset=0)
    it = items[0]
    assert it["from_name"] and it["to_name"]
    assert it["values"] and "key" in it["values"][0]


def test_wallet(seeded):
    wallet = svc.get_wallet(seeded["yael"]["id"])
    assert wallet["points_balance"] == 340
    assert wallet["allowance_total"] == 100
    assert wallet["allowance_used"] == 60
    assert wallet["allowance_remaining"] == 40


def test_rewards_in_stock(seeded):
    assert len(svc.list_rewards()) == 8


def test_leaderboard_top_first(seeded):
    board = svc.get_leaderboard(seeded["yael"]["organization_id"])
    assert board[0]["points"] >= board[-1]["points"]
    assert board[0]["points"] == 420  # מיכל ברק (herzl) tops it


def test_feed_route_requires_auth_and_is_scoped(seeded):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.api.routes import consumer

    app = FastAPI()
    app.include_router(consumer.router)
    client = TestClient(app)

    assert client.get("/feed").status_code == 401

    yael = seeded["yael"]
    token = create_access_token(
        user_id=yael["id"], role="teacher", access_level="member",
        organization_id=yael["organization_id"],
    )
    resp = client.get("/feed", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["total"] == 6


def test_feed_filtered_by_recognition_value(orm_db):
    from app.db import organization_recognition_values as orv_db
    from app.db import organizations as orgs_db
    from app.db import posts as posts_db
    from app.db import recognition_values as values_db

    oid = orgs_db.create_organization(name="FilterOrg")
    giver = users_db.create_user(email="g2@o.il", full_name="G2", role="teacher", organization_id=oid)
    r1 = users_db.create_user(email="r1@o.il", full_name="R1", role="teacher", organization_id=oid)
    r2 = users_db.create_user(email="r2@o.il", full_name="R2", role="teacher", organization_id=oid)
    v1 = values_db.create_value(key="ערך א")
    v2 = values_db.create_value(key="ערך ב")
    orv_db.add_value(organization_id=oid, recognition_value_id=v1)
    orv_db.add_value(organization_id=oid, recognition_value_id=v2)

    posts_db.create_post(from_user_id=giver, to_user_id=r1, organization_id=oid, points=3, recognition_value_ids=[v1])
    posts_db.create_post(from_user_id=giver, to_user_id=r2, organization_id=oid, points=4, recognition_value_ids=[v2])
    posts_db.create_post(from_user_id=giver, to_user_id=r1, organization_id=oid, points=2, recognition_value_ids=[v1, v2])

    items_v1, total_v1 = svc.get_feed(oid, limit=50, offset=0, recognition_value_id=v1)
    assert total_v1 == 2
    assert all(any(v["id"] == v1 for v in it["values"]) for it in items_v1)

    items_v2, total_v2 = svc.get_feed(oid, limit=50, offset=0, recognition_value_id=v2)
    assert total_v2 == 2

    # No filter still returns everything, unaffected by the new param.
    _, total_all = svc.get_feed(oid, limit=50, offset=0)
    assert total_all == 3


def test_feed_route_accepts_recognition_value_filter(seeded):
    from app.db import recognition_values as values_db

    yael = seeded["yael"]
    value_id = values_db.get_value_by_key("שיתוף פעולה")["id"]
    client = _client()
    resp = client.get(
        "/feed", params={"recognition_value_id": value_id}, headers=_auth(yael)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] >= 1
    assert all(any(v["id"] == value_id for v in it["values"]) for it in body["items"])


def test_give_and_redeem_flow(seeded):
    from app.db import recognition_values as values_db

    client = _client()
    yael, michal = seeded["yael"], seeded["michal"]
    value_id = values_db.get_value_by_key("שיתוף פעולה")["id"]

    # give recognition (same org, within remaining allowance of 40)
    give = client.post(
        "/posts",
        headers=_auth(yael),
        json={"to_user_id": michal["id"], "points": 5, "message": "כל הכבוד",
              "recognition_value_ids": [value_id]},
    )
    assert give.status_code == 201, give.text

    # redeem a reward (yael balance 340; ארומה costs 90)
    rewards = client.get("/rewards", headers=_auth(yael)).json()
    aroma = next(r for r in rewards if r["provider"] == "ארומה")
    redeem = client.post("/redemptions", headers=_auth(yael), json={"reward_id": aroma["id"]})
    assert redeem.status_code == 201, redeem.text
    assert redeem.json()["points_spent"] == 90
