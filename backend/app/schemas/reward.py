"""Pydantic schemas for the Reward resource (#17)."""
from __future__ import annotations

import enum
from datetime import datetime

from pydantic import BaseModel, Field


class RewardCategory(str, enum.Enum):
    """Catalog category of a reward."""

    BOOKS = "books"
    FOOD = "food"
    SHOP = "shop"
    FUN = "fun"


REWARD_CATEGORIES = tuple(c.value for c in RewardCategory)


class RewardCreate(BaseModel):
    """Payload to create a reward."""

    provider: str = Field(min_length=1, max_length=255)
    title: str = Field(min_length=1, max_length=255)
    category: RewardCategory
    cost: int = Field(ge=0)
    emoji: str | None = None
    color: str | None = None
    blurb: str | None = None
    in_stock: bool = True


class RewardUpdate(BaseModel):
    """Payload to update a reward."""

    provider: str = Field(min_length=1, max_length=255)
    title: str = Field(min_length=1, max_length=255)
    category: RewardCategory
    cost: int = Field(ge=0)
    emoji: str | None = Field(default=None, max_length=16)
    color: str | None = Field(default=None, max_length=32)
    blurb: str | None = None
    in_stock: bool = True


class RewardRead(BaseModel):
    """Reward representation returned to the frontend."""

    id: int
    provider: str
    title: str
    category: RewardCategory
    cost: int
    emoji: str | None = None
    color: str | None = None
    blurb: str | None = None
    in_stock: bool = True
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None
