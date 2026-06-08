"""Tests for configuration/environment management (#2)."""
from __future__ import annotations

from app.core.config import Settings, get_settings


def test_dev_loads_from_env_file(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text("MYSQL_DB=from_dotenv\nJWT_SECRET=dotenv-secret\n")
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("APP_ENV", "dev")
    # Ensure the value isn't already present in the process environment.
    monkeypatch.delenv("MYSQL_DB", raising=False)
    get_settings.cache_clear()

    settings = get_settings()
    assert settings.MYSQL_DB == "from_dotenv"


def test_prod_ignores_env_file(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text("MYSQL_DB=should_be_ignored\n")
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("APP_ENV", "prod")
    monkeypatch.setenv("MYSQL_DB", "from_environment")
    get_settings.cache_clear()

    settings = get_settings()
    assert settings.MYSQL_DB == "from_environment"


def test_database_url_derived_from_parts():
    settings = Settings(
        MYSQL_USER="u", MYSQL_PASSWORD="p", MYSQL_HOST="h", MYSQL_PORT=3307,
        MYSQL_DB="d", _env_file=None,
    )
    assert settings.database_url == "mysql+pymysql://u:p@h:3307/d"
