"""Shared rate limiter (#9 security).

A single ``Limiter`` instance keyed by client IP, imported by both the app
factory (to register state + the 429 handler) and the routes that apply limits.
Auth endpoints (registration / OAuth callback) are throttled to slow brute-force
and account-spam attempts.
"""
from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
