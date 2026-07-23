"""Tests for configuration/environment management (#2)."""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import (
    Settings,
    escape_percent_for_configparser,
    get_settings,
    init_settings,
    reset_settings,
)


def test_jwt_secret_is_required_no_insecure_default(monkeypatch):
    """JWT_SECRET must come from the environment; there is no baked-in default."""
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setenv("MYSQL_PASSWORD", "p")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_mysql_password_is_required_no_default(monkeypatch):
    """MYSQL_PASSWORD must be supplied by the environment, not hardcoded."""
    monkeypatch.delenv("MYSQL_PASSWORD", raising=False)
    monkeypatch.setenv("JWT_SECRET", "s")
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_dev_loads_from_env_file(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "MYSQL_DB=from_dotenv\nJWT_SECRET=dotenv-secret\nMYSQL_PASSWORD=dotenv-pass\n"
    )
    # The dev loader reads the absolute ENV_FILE path (independent of cwd), so
    # point it at the temp file for this test.
    monkeypatch.setattr("app.core.config.ENV_FILE", env_file)
    monkeypatch.setenv("APP_ENV", "dev")
    # Ensure the value isn't already present in the process environment.
    monkeypatch.delenv("MYSQL_DB", raising=False)
    reset_settings()

    settings = get_settings()
    assert settings.MYSQL_DB == "from_dotenv"


def test_prod_ignores_env_file(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text("MYSQL_DB=should_be_ignored\n")
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("APP_ENV", "prod")
    monkeypatch.setenv("MYSQL_DB", "from_environment")
    reset_settings()

    settings = get_settings()
    assert settings.MYSQL_DB == "from_environment"


def test_database_url_derived_from_parts():
    settings = Settings(
        MYSQL_USER="u", MYSQL_PASSWORD="p", MYSQL_HOST="h", MYSQL_PORT=3307,
        MYSQL_DB="d", _env_file=None,
    )
    assert settings.database_url == "mysql+pymysql://u:p@h:3307/d"


def test_database_url_uses_cloud_sql_unix_socket_when_set():
    """On Cloud Run, INSTANCE_UNIX_SOCKET takes over from host/port."""
    settings = Settings(
        MYSQL_USER="u", MYSQL_PASSWORD="p", MYSQL_DB="d",
        INSTANCE_UNIX_SOCKET="/cloudsql/proj:us-central1:fergoni-mysql",
        _env_file=None,
    )
    assert settings.database_url == (
        "mysql+pymysql://u:p@/d?unix_socket=/cloudsql/proj:us-central1:fergoni-mysql"
    )


def test_database_url_percent_encodes_special_characters_in_credentials():
    """A password with URL-reserved characters must not corrupt the DSN."""
    settings = Settings(
        MYSQL_USER="u", MYSQL_PASSWORD="p@ss:w/ord?#", MYSQL_HOST="h",
        MYSQL_PORT=3307, MYSQL_DB="d", _env_file=None,
    )
    assert settings.database_url == "mysql+pymysql://u:p%40ss%3Aw%2Ford%3F%23@h:3307/d"


def test_escape_percent_for_configparser_doubles_percent_signs():
    """A raw URL-encoded password (e.g. %2F) must round-trip through ConfigParser."""
    import configparser

    url = "mysql+pymysql://u:Q4TEKaA%2F4PYU4HlKVAX9f%2BLce@h:3306/d"
    escaped = escape_percent_for_configparser(url)

    parser = configparser.ConfigParser()
    parser.add_section("alembic")
    parser.set("alembic", "sqlalchemy.url", escaped)  # must not raise
    assert parser.get("alembic", "sqlalchemy.url") == url


def test_settings_is_a_singleton():
    """get_settings/init_settings return the same instance until reset."""
    reset_settings()
    first = init_settings()
    assert get_settings() is first
    assert init_settings() is first
    reset_settings()
    assert get_settings() is not first
