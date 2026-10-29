"""add wallet withdrawal records

Revision ID: e2f4a1b7c9d0
Revises: c4d8e1f7a2b9
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e2f4a1b7c9d0"
down_revision: Union[str, None] = "c4d8e1f7a2b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    withdrawal_status = postgresql.ENUM(
        "pending",
        "processing",
        "completed",
        "failed",
        "reversed",
        name="withdrawalstatus",
    )
    withdrawal_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "wallet_withdrawals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reference", sa.String(length=128), nullable=False),
        sa.Column("wallet_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("local_amount_minor", sa.BigInteger(), nullable=False),
        sa.Column("stable_amount_micro", sa.BigInteger(), nullable=False),
        sa.Column(
            "local_currency",
            postgresql.ENUM(
                "NGN", "GHS", "KES", name="localcurrency", create_type=False
            ),
            nullable=False,
        ),
        sa.Column("status", withdrawal_status, nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("provider_reference", sa.String(), nullable=True),
        sa.Column("recipient_code", sa.String(), nullable=True),
        sa.Column("bank_name", sa.String(), nullable=False),
        sa.Column("bank_code", sa.String(), nullable=False),
        sa.Column("account_number_last4", sa.String(length=4), nullable=False),
        sa.Column("failure_reason", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["wallet_id"], ["wallets.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference"),
        sa.UniqueConstraint("provider_reference"),
    )
    op.create_index("ix_wallet_withdrawals_id", "wallet_withdrawals", ["id"])
    op.create_index(
        "ix_wallet_withdrawals_reference", "wallet_withdrawals", ["reference"]
    )
    op.create_index(
        "ix_wallet_withdrawals_wallet_id", "wallet_withdrawals", ["wallet_id"]
    )
    op.create_index(
        "ix_wallet_withdrawals_provider_reference",
        "wallet_withdrawals",
        ["provider_reference"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_wallet_withdrawals_provider_reference", table_name="wallet_withdrawals"
    )
    op.drop_index("ix_wallet_withdrawals_wallet_id", table_name="wallet_withdrawals")
    op.drop_index("ix_wallet_withdrawals_reference", table_name="wallet_withdrawals")
    op.drop_index("ix_wallet_withdrawals_id", table_name="wallet_withdrawals")
    op.drop_table("wallet_withdrawals")
    postgresql.ENUM(name="withdrawalstatus").drop(op.get_bind(), checkfirst=True)
