"""store wallet and ledger money as integer minor units

Balances and ledger amounts move from NUMERIC (which surfaced as '0E-8' and
carried rounding noise from FX multiplication) to BIGINT whole minor units:
  * stable coin -> micro-units (x 1_000_000)
  * local fiat  -> kobo/cents  (x 100)
Existing rows are converted with SQL ROUND(); the downgrade converts back.

Revision ID: b1e5f2a9c4d7
Revises: 7a1c9e5f0b2d
Create Date: 2026-09-29 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1e5f2a9c4d7"
down_revision: Union[str, None] = "7a1c9e5f0b2d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # wallets ---------------------------------------------------------------
    op.add_column(
        "wallets",
        sa.Column("stable_coin_balance_micro", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "wallets", sa.Column("stable_coin_locked_micro", sa.BigInteger(), nullable=True)
    )
    op.execute(
        "UPDATE wallets SET "
        "stable_coin_balance_micro = ROUND(stable_coin_balance * 1000000)::bigint, "
        "stable_coin_locked_micro = ROUND(stable_coin_locked * 1000000)::bigint"
    )
    op.alter_column("wallets", "stable_coin_balance_micro", nullable=False)
    op.alter_column("wallets", "stable_coin_locked_micro", nullable=False)
    op.drop_column("wallets", "stable_coin_balance")
    op.drop_column("wallets", "stable_coin_locked")

    # wallet_ledger ---------------------------------------------------------
    op.add_column(
        "wallet_ledger",
        sa.Column("stable_amount_micro", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "wallet_ledger", sa.Column("local_amount_minor", sa.BigInteger(), nullable=True)
    )
    op.execute(
        "UPDATE wallet_ledger SET "
        "stable_amount_micro = ROUND(stable_amount * 1000000)::bigint, "
        "local_amount_minor = ROUND(local_amount * 100)::bigint"
    )
    op.alter_column("wallet_ledger", "stable_amount_micro", nullable=False)
    op.alter_column("wallet_ledger", "local_amount_minor", nullable=False)
    op.drop_column("wallet_ledger", "stable_amount")
    op.drop_column("wallet_ledger", "local_amount")


def downgrade() -> None:
    """Downgrade schema."""
    # wallet_ledger ---------------------------------------------------------
    op.add_column(
        "wallet_ledger",
        sa.Column("stable_amount", sa.Numeric(precision=20, scale=8), nullable=True),
    )
    op.add_column(
        "wallet_ledger",
        sa.Column("local_amount", sa.Numeric(precision=20, scale=2), nullable=True),
    )
    op.execute(
        "UPDATE wallet_ledger SET "
        "stable_amount = stable_amount_micro::numeric / 1000000, "
        "local_amount = local_amount_minor::numeric / 100"
    )
    op.alter_column("wallet_ledger", "stable_amount", nullable=False)
    op.alter_column("wallet_ledger", "local_amount", nullable=False)
    op.drop_column("wallet_ledger", "stable_amount_micro")
    op.drop_column("wallet_ledger", "local_amount_minor")

    # wallets ---------------------------------------------------------------
    op.add_column(
        "wallets",
        sa.Column(
            "stable_coin_balance", sa.Numeric(precision=20, scale=8), nullable=True
        ),
    )
    op.add_column(
        "wallets",
        sa.Column(
            "stable_coin_locked", sa.Numeric(precision=20, scale=8), nullable=True
        ),
    )
    op.execute(
        "UPDATE wallets SET "
        "stable_coin_balance = stable_coin_balance_micro::numeric / 1000000, "
        "stable_coin_locked = stable_coin_locked_micro::numeric / 1000000"
    )
    op.alter_column("wallets", "stable_coin_balance", nullable=False)
    op.alter_column("wallets", "stable_coin_locked", nullable=False)
    op.drop_column("wallets", "stable_coin_balance_micro")
    op.drop_column("wallets", "stable_coin_locked_micro")
