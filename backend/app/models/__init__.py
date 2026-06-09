"""ORM models package.

Importing this package registers every model on ``Base.metadata`` so Alembic
autogenerate (and ``create_all`` in tests) can see the full schema.
"""
from app.models.action_log import ActionLog
from app.models.base import Base
from app.models.user import User

__all__ = ["Base", "User", "ActionLog"]
