"""add kyc verification fields

Revision ID: 58ba0874e5a3
Revises: d8b8c900456e
Create Date: 2026-06-20 10:17:51.721823
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '58ba0874e5a3'
down_revision: Union[str, None] = 'd8b8c900456e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_video_verified', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('wallet_activated', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'wallet_activated')
    op.drop_column('users', 'is_video_verified')
