"""Shared pytest fixtures.

Tests never touch a real MySQL or Google — the DB layer and HTTP calls are
mocked. We point logging at a temp dir and reset the settings cache so each test
gets clean configuration.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Ensure the backend package root is importable when running `pytest` from
# either the repo root or the backend directory.
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import get_settings  # noqa: E402


@pytest.fixture(autouse=True)
def _isolate_settings(tmp_path, monkeypatch):
    """Reset cached settings and route logs to a temp directory per test."""
    monkeypatch.setenv("APP_ENV", "prod")  # avoid reading a developer .env
    monkeypatch.setenv("LOG_DIR", str(tmp_path / "logs"))
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
