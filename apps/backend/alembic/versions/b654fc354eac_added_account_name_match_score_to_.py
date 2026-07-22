"""added account_name_match_score to banking info step

Revision ID: b654fc354eac
Revises: 9dcb96121af4
Create Date: 2026-07-21 13:25:49.887336

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b654fc354eac'
down_revision: Union[str, None] = '9dcb96121af4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "kyc_banking_info",
        sa.Column("account_name_match_score", sa.Float, nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('kyc_banking_info', 'account_name_match_score')
