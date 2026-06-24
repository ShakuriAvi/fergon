"""Admin recognition value catalog views (#30). HTTP only."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.routes.admin._common import ListParams, admin_dep, admin_required, list_params
from app.schemas.common import Page
from app.schemas.recognition_value import (
    RecognitionValueCreate,
    RecognitionValueRead,
    RecognitionValueUpdate,
)
from app.services import recognition_value_service as svc

router = APIRouter(
    prefix="/admin/recognition-values",
    tags=["admin:recognition-values"],
    dependencies=admin_dep(),
)


@router.get("", response_model=Page[RecognitionValueRead])
def list_values(params: ListParams = Depends(list_params)) -> Page[RecognitionValueRead]:
    items, total = svc.list_values(
        q=params.q,
        include_inactive=params.include_inactive,
        limit=params.limit,
        offset=params.offset,
    )
    return Page[RecognitionValueRead](items=items, total=total)


@router.get("/{value_id}", response_model=RecognitionValueRead)
def get_value(value_id: int) -> RecognitionValueRead:
    return RecognitionValueRead(**svc.get_value(value_id))


@router.post("", response_model=RecognitionValueRead, status_code=201)
def create_value(
    payload: RecognitionValueCreate, current: dict = Depends(admin_required)
) -> RecognitionValueRead:
    return RecognitionValueRead(**svc.create_value(payload, actor_id=current.get("id")))


@router.put("/{value_id}", response_model=RecognitionValueRead)
def update_value(
    value_id: int,
    payload: RecognitionValueUpdate,
    current: dict = Depends(admin_required),
) -> RecognitionValueRead:
    return RecognitionValueRead(
        **svc.update_value(value_id, payload, actor_id=current.get("id"))
    )


@router.delete("/{value_id}", response_model=RecognitionValueRead)
def deactivate_value(
    value_id: int, current: dict = Depends(admin_required)
) -> RecognitionValueRead:
    """Soft delete: sets ``is_active = 0``."""
    return RecognitionValueRead(
        **svc.deactivate_value(value_id, actor_id=current.get("id"))
    )


@router.post("/{value_id}/reactivate", response_model=RecognitionValueRead)
def reactivate_value(
    value_id: int, current: dict = Depends(admin_required)
) -> RecognitionValueRead:
    return RecognitionValueRead(
        **svc.reactivate_value(value_id, actor_id=current.get("id"))
    )
