"""Shared admin-route helpers (#26).

* ``admin_required`` — the dependency every admin router mounts so only users
  whose role ``access_level`` is ``admin`` may reach the endpoint (403 for an
  authenticated non-admin, 401 for an anonymous request).
* ``ListParams`` / ``list_params`` — the common pagination + search + active
  filter query parameters reused by every admin list endpoint.

All values are validated/bounded by FastAPI ``Query`` before reaching the db
layer, and the db layer only ever passes them as bound SQL parameters, so the
``q`` search term can never be used for SQL injection.
"""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Query

from app.middleware.permissions import require_access_level
from app.schemas.role import AccessLevel

# A single shared admin guard instance reused as a router-level dependency.
admin_required = require_access_level(AccessLevel.ADMIN)


@dataclass
class ListParams:
    """Normalized list query parameters."""

    q: str | None
    limit: int
    offset: int
    include_inactive: bool


def list_params(
    q: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    include_inactive: bool = Query(default=False),
) -> ListParams:
    """Build :class:`ListParams` from the request query string."""
    return ListParams(
        q=(q.strip() or None) if q else None,
        limit=limit,
        offset=offset,
        include_inactive=include_inactive,
    )


def admin_dep() -> list:
    """Router-level dependency list enforcing admin access on every route."""
    return [Depends(admin_required)]
