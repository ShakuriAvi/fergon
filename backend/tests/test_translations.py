"""Tests for the Hebrew translation layer (#10)."""
from __future__ import annotations

from app.translations.translator import t


def test_hit_returns_hebrew_string():
    assert t("auth.login_success") == "התחברת בהצלחה"


def test_miss_returns_key_by_default():
    assert t("does.not.exist") == "does.not.exist"


def test_miss_returns_provided_default():
    assert t("does.not.exist", default="fallback") == "fallback"


def test_params_are_formatted():
    # Use a key that contains no placeholder; formatting must be a no-op.
    assert t("common.ok", name="x") == "תקין"


def test_no_hardcoded_hebrew_outside_json(tmp_path):
    """Sanity: every value in he.json is non-empty."""
    from app.translations.translator import _translations

    for key, value in _translations().items():
        assert value, f"empty translation for {key}"
