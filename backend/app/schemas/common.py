"""Shared response schemas for the admin API (#26).

``Page`` is the consistent list envelope every admin list endpoint returns:
``items`` plus the unfiltered ``total`` so the frontend can paginate.
"""
from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """A page of results plus the total count matching the (search) filter."""

    items: list[T]
    total: int
