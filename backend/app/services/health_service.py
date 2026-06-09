"""Trivial business logic for the health endpoint (#1).

Routes do only HTTP concerns; even this trivial status is produced by a service
to keep the View & Service separation consistent.
"""
from __future__ import annotations


def get_health_status() -> dict[str, str]:
    return {"status": "ok"}
