"""Admin per-organization recognition value views (#31). HTTP only."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.routes.admin._common import admin_dep, admin_required
from app.schemas.organization_recognition_value import (
    OrgRecognitionValueAdd,
    OrgRecognitionValueRow,
)
from app.schemas.recognition_value import RecognitionValueRead
from app.services import organization_recognition_value_service as svc

router = APIRouter(
    prefix="/admin/organizations/{org_id}/recognition-values",
    tags=["admin:org-recognition-values"],
    dependencies=admin_dep(),
)


@router.get("", response_model=list[OrgRecognitionValueRow])
def list_org_values(
    org_id: int, include_inactive: bool = Query(default=False)
) -> list[OrgRecognitionValueRow]:
    rows = svc.list_org_values(org_id, include_inactive=include_inactive)
    return [OrgRecognitionValueRow(**r) for r in rows]


@router.get("/available", response_model=list[RecognitionValueRead])
def list_available_values(org_id: int) -> list[RecognitionValueRead]:
    return [RecognitionValueRead(**v) for v in svc.list_available_values(org_id)]


@router.post("", response_model=OrgRecognitionValueRow, status_code=201)
def add_value(
    org_id: int, payload: OrgRecognitionValueAdd, current: dict = Depends(admin_required)
) -> OrgRecognitionValueRow:
    row = svc.add_value(
        org_id, payload.recognition_value_id, actor_id=current.get("id")
    )
    return OrgRecognitionValueRow(**row)


@router.delete("/{recognition_value_id}", response_model=OrgRecognitionValueRow)
def remove_value(
    org_id: int, recognition_value_id: int, current: dict = Depends(admin_required)
) -> OrgRecognitionValueRow:
    """Soft delete: deactivates the (org, value) link."""
    row = svc.remove_value(org_id, recognition_value_id, actor_id=current.get("id"))
    return OrgRecognitionValueRow(**row)
