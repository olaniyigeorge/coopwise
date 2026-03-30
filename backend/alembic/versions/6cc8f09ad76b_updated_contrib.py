"""updated contrib

Revision ID: 6cc8f09ad76b
Revises: 745f0c45e4c3
Create Date: 2026-03-25 08:45:37.590262

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6cc8f09ad76b'
down_revision: Union[str, None] = '745f0c45e4c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
