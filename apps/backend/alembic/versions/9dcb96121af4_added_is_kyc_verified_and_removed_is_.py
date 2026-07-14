"""added is_kyc_verified and removed is video verified

Revision ID: 9dcb96121af4
Revises: fd876294ea52
Create Date: 2026-07-14 14:59:47.910748

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9dcb96121af4'
down_revision: Union[str, None] = 'fd876294ea52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove old columns
    op.drop_column("users", "is_verified")
    op.drop_column("users", "is_video_verified")

    # Add new column
    op.add_column(
        "users",
        sa.Column(
            "is_kyc_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove new column
    op.drop_column("users", "is_kyc_verified")

    # Restore old columns
    op.add_column(
        "users",
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "is_video_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )