"""Health view (#1). HTTP only — delegates to the health service."""
from __future__ import annotations

from fastapi import APIRouter

from app.services import health_service

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness probe used by local tooling and orchestration."""
    return health_service.get_health_status()
