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
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings.

    Values are populated from the environment (and, in ``dev``, from ``.env``).
    """

    # Environment selection.
    APP_ENV: str = "dev"
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"

    # Database (discrete MySQL params; DATABASE_URL is derived for Alembic).
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "fergon"
    MYSQL_PASSWORD: str = "fergon"
    MYSQL_DB: str = "fergon"

    # Google OAuth 2.0.
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    # Session / JWT.
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    DEFAULT_USER_ROLE: str = "teacher"

    model_config = SettingsConfigDict(extra="ignore", case_sensitive=True)

    @property
    def database_url(self) -> str:
        """SQLAlchemy/Alembic-style URL derived from discrete MySQL params."""
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        )


@lru_cache
def get_settings() -> Settings:
    """Return cached settings.

    In ``dev`` the ``.env`` file is loaded; in ``prod`` it is ignored and values
    come exclusively from the process environment (cloud-injected secrets).
    """
    app_env = os.getenv("APP_ENV", "dev").lower()
    if app_env == "dev":
        return Settings(_env_file=".env", _env_file_encoding="utf-8")
    # prod (or any non-dev env): never read .env.
    return Settings(_env_file=None)
