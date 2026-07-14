"""added kyc models and removed kyc related fields from users

Revision ID: fd876294ea52
Revises: 55d8f8933df5
Create Date: 2026-07-14 14:00:47.601639

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd876294ea52'
down_revision: Union[str, None] = '55d8f8933df5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
