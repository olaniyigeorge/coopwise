"""add membership_votes table

Votes on pending applications for cooperatives that admit members by vote.

Revision ID: c4d8e1f7a2b9
Revises: b1e5f2a9c4d7
Create Date: 2026-09-29 15:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c4d8e1f7a2b9"
down_revision: Union[str, None] = "b1e5f2a9c4d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The app's startup create_all() may already have created this table in a
    # dev database that hasn't been migrated yet, so don't fail on that.
    if "membership_votes" in sa.inspect(op.get_bind()).get_table_names():
        return
    op.create_table(
        "membership_votes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("membership_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("voter_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("approve", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["membership_id"], ["group_memberships.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["voter_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "membership_id", "voter_id", name="uq_membership_votes_pair"
        ),
    )
    op.create_index(
        "ix_membership_votes_membership_id", "membership_votes", ["membership_id"]
    )


def downgrade() -> None:
    if "membership_votes" not in sa.inspect(op.get_bind()).get_table_names():
        return
    op.drop_index("ix_membership_votes_membership_id", table_name="membership_votes")
    op.drop_table("membership_votes")
