"""add join_policy to cooperative_groups

Revision ID: e7f8a9b0c1d2
Revises: d8b8c900456e
Create Date: 2026-04-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7f8a9b0c1d2"
down_revision: Union[str, None] = "d8b8c900456e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "cooperative_groups",
        sa.Column(
            "join_policy",
            sa.String(length=32),
            nullable=False,
            server_default="invite_only",
        ),
    )


def downgrade() -> None:
    op.drop_column("cooperative_groups", "join_policy")
