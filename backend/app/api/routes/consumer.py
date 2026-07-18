"""Consumer (non-admin) read views (#41). HTTP only — delegates to the service.

All endpoints require an authenticated user and are scoped to that user's
organization (tenant isolation via the session, never the client).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from starlette.requests import Request

from app.core.rate_limit import limiter
from app.core.security import get_current_user
from app.schemas.common import Page
from app.schemas.consumer import (
    FeedItem,
    LeaderboardEntry,
    OrgMember,
    OrgValueOption,
    WalletRead,
)
from app.schemas.post import PostCreate, PostRead
from app.schemas.redemption import RedemptionCreate, RedemptionRead
from app.schemas.reward import RewardRead
from app.services import consumer_service as svc
from app.services import post_service, redemption_service

router = APIRouter(tags=["consumer"])


@router.get("/feed", response_model=Page[FeedItem])
@limiter.limit("60/minute")
def get_feed(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    recognition_value_id: int | None = Query(default=None),
    current: dict = Depends(get_current_user),
) -> Page[FeedItem]:
    """Org-scoped recognition feed, optionally filtered by recognition value."""
    items, total = svc.get_feed(
        current.get("organization_id"),
        limit=limit,
        offset=offset,
        recognition_value_id=recognition_value_id,
    )
    return Page[FeedItem](items=items, total=total)


@router.get("/me/wallet", response_model=WalletRead)
def get_wallet(current: dict = Depends(get_current_user)) -> WalletRead:
    return WalletRead(**svc.get_wallet(current["id"]))


@router.get("/rewards", response_model=list[RewardRead])
def list_rewards(current: dict = Depends(get_current_user)) -> list[RewardRead]:
    return [RewardRead(**r) for r in svc.list_rewards()]


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(current: dict = Depends(get_current_user)) -> list[LeaderboardEntry]:
    return [LeaderboardEntry(**e) for e in svc.get_leaderboard(current.get("organization_id"))]


@router.get("/org/members", response_model=list[OrgMember])
def org_members(current: dict = Depends(get_current_user)) -> list[OrgMember]:
    return [
        OrgMember(**m)
        for m in svc.list_org_members(current.get("organization_id"), exclude_user_id=current["id"])
    ]


@router.get("/org/values", response_model=list[OrgValueOption])
def org_values(current: dict = Depends(get_current_user)) -> list[OrgValueOption]:
    return [OrgValueOption(**v) for v in svc.list_org_values(current.get("organization_id"))]


@router.post("/posts", response_model=PostRead, status_code=201)
def give_recognition(
    payload: PostCreate, current: dict = Depends(get_current_user)
) -> PostRead:
    """Create a recognition; giver + org come from the session, not the client."""
    post_id = post_service.create_recognition(
        payload,
        from_user_id=current["id"],
        organization_id=current.get("organization_id"),
    )
    from app.db import posts as posts_db

    return PostRead(**posts_db.get_post_by_id(post_id))


@router.post("/redemptions", response_model=RedemptionRead, status_code=201)
def redeem_reward(
    payload: RedemptionCreate, current: dict = Depends(get_current_user)
) -> RedemptionRead:
    """Redeem a reward for the current user."""
    return RedemptionRead(**redemption_service.redeem(user_id=current["id"], reward_id=payload.reward_id))
