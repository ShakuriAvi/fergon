"""Centralized application configuration loaded via pydantic-settings.

Two environments are supported, selected by the ``APP_ENV`` variable:

* ``dev``  -> configuration is read from a local ``.env`` file (python-dotenv).
* ``prod`` -> the ``.env`` file is ignored; configuration comes from the runtime
  environment, with secrets injected by Google Cloud (Cloud Secret Manager / GCR)
  as environment variables.

No secrets are hardcoded here.
"""
from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute path to backend/.env so loading does not depend on the working
# directory (PyCharm runs from the project root, uvicorn from backend/).
ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    """Application settings.

    Values are populated from the environment (and, in ``dev``, from ``.env``).
    """

    # Environment selection.
    APP_ENV: str = "dev"
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"

    # Database (discrete MySQL params; DATABASE_URL is derived for Alembic).
    # No password default: the credential must be supplied by the environment
    # (.env in dev, Secret Manager in prod) so none is baked into source.
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "fergoni"
    MYSQL_PASSWORD: str  # required; supplied via env/.env or Secret Manager
    MYSQL_DB: str = "fergoni"

    # Google OAuth 2.0. Endpoint URLs live here (overridable) instead of being
    # hardcoded in the service layer. Redirect URI has no default so each
    # environment must provide its own (dev/staging/prod differ).
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""
    GOOGLE_AUTH_URL: str = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL: str = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL: str = "https://www.googleapis.com/oauth2/v3/userinfo"

    # Session / JWT. No default secret: signing key must come from the
    # environment so a known placeholder can never be used to forge tokens.
    JWT_SECRET: str  # required; a known/guessable default would allow token forgery
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    DEFAULT_USER_ROLE: str = "teacher"

    # Browser origins allowed to call the API (comma-separated). Defaults to the
    # local dev frontends (Vite web + Expo web) so the SPA can call the backend.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8081"

    # Local dev server bind address (used only by the ``python -m`` / __main__
    # runner). In real deployments the process manager (gunicorn/uvicorn/Cloud
    # Run) sets host/port, so these are not read there.
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    model_config = SettingsConfigDict(extra="ignore", case_sensitive=True)

    @property
    def cors_origins(self) -> list[str]:
        """Parsed list of allowed CORS origins."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def database_url(self) -> str:
        """SQLAlchemy/Alembic-style URL derived from discrete MySQL params."""
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        )


# --- Settings singleton -----------------------------------------------------
# A single ``Settings`` instance is built once (at app startup via
# ``init_settings``) and reused for the whole process. ``get_settings`` returns
# that shared instance; it is never rebuilt per request.

_settings: Settings | None = None


def _build_settings() -> Settings:
    """Construct a ``Settings`` instance honoring the active environment.

    In ``dev`` the ``.env`` file is loaded; in ``prod`` it is ignored and values
    come exclusively from the process environment (cloud-injected secrets).
    """
    app_env = os.getenv("APP_ENV", "dev").lower()
    if app_env == "dev":
        return Settings(_env_file=ENV_FILE, _env_file_encoding="utf-8")
    # prod (or any non-dev env): never read .env.
    return Settings(_env_file=None)


def init_settings() -> Settings:
    """Build the settings singleton once. Called when the app is set up."""
    global _settings
    if _settings is None:
        _settings = _build_settings()
    return _settings


def get_settings() -> Settings:
    """Return the shared settings singleton (initializing it on first use)."""
    return init_settings()


def reset_settings() -> None:
    """Drop the cached singleton so the next call rebuilds it (tests only)."""
    global _settings
    _settings = None
