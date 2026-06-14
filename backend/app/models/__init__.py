"""ORM models package.

Importing this package registers every model on ``Base.metadata`` so Alembic
autogenerate (and ``create_all`` in tests) can see the full schema.
"""
from app.models.action_log import ActionLog
from app.models.allowance_period import AllowancePeriod
from app.models.base import Base, TimestampMixin
from app.models.organization import Organization
from app.models.organization_recognition_value import OrganizationRecognitionValue
from app.models.organization_role_allowance import OrganizationRoleAllowance
from app.models.post import Post
from app.models.recognition_value import RecognitionValue
from app.models.redemption import Redemption
from app.models.reward import Reward
from app.models.role import Role
from app.models.user import User

__all__ = [
    "Base",
    "TimestampMixin",
    "User",
    "ActionLog",
    "Organization",
    "Role",
    "RecognitionValue",
    "Post",
    "Reward",
    "Redemption",
    "OrganizationRecognitionValue",
    "OrganizationRoleAllowance",
    "AllowancePeriod",
]
