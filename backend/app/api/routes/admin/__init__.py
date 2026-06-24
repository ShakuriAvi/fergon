"""Admin API router group (#26).

Aggregates every admin entity router under ``/admin``. Each sub-router mounts the
``admin_required`` dependency, so all admin endpoints are admin-only (403 for an
authenticated non-admin, 401 for an anonymous request).
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api.routes.admin import (
    organizations,
    recognition_values,
    roles,
    users,
)
from app.api.routes.admin import organization_recognition_values as org_values
from app.api.routes.admin import organization_role_allowances as org_allowances
from app.api.routes.admin import rewards

router = APIRouter()
router.include_router(organizations.router)
router.include_router(roles.router)
router.include_router(users.router)
router.include_router(recognition_values.router)
router.include_router(rewards.router)
router.include_router(org_values.router)
router.include_router(org_allowances.router)
