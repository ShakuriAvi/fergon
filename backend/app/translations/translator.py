"""English-key -> Hebrew translation layer for API responses (#10).

Application code uses English message *keys*; this helper resolves them to the
Hebrew strings returned to the frontend. No Hebrew is hardcoded in the code.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_HE_PATH = Path(__file__).with_name("he.json")


@lru_cache
def _translations() -> dict[str, str]:
    with _HE_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


def t(key: str, *, default: str | None = None, **params: Any) -> str:
    """Resolve a message key to its Hebrew string.

    Fallback behavior for a missing key: return ``default`` if provided,
    otherwise return the key itself. ``params`` are applied via ``str.format``
    so messages may contain ``{name}``-style placeholders.
    """
    template = _translations().get(key)
    if template is None:
        template = default if default is not None else key
    if params:
        try:
            return template.format(**params)
        except (KeyError, IndexError):
            return template
    return template
