"""add notification delivery tracking fields

Revision ID: 9c2d1f6a8b3e
Revises: 58ba0874e5a3
Create Date: 2026-06-20

This replaces the bundled autogenerate output that failed with
NotNullViolation on idempotency_key. The fix: add columns nullable
first, backfill existing rows with sensible values, THEN tighten to
NOT NULL / unique. Each step is valid on its own against a populated
table; doing all three in a single ALTER (what autogenerate produced)
only works on an empty table.

idempotency_key backfill uses each row's own id (cast to text) — this
is guaranteed unique since `id` already is, which satisfies the unique
index added at the end. New rows going forward will get a real
idempotency key assigned by the application layer.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '9c2d1f6a8b3e'
down_revision: Union[str, None] = '58ba0874e5a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Step 1: add everything nullable, no constraints yet ---
    op.add_column('notifications', sa.Column('idempotency_key', sa.String(length=255), nullable=True))
    op.add_column(
        'notifications',
        sa.Column(
            'channel',
            sa.Enum('push', 'sms', 'email', 'in_app', name='notificationchannel'),
            nullable=True,
        ),
    )
    op.add_column(
        'notifications',
        sa.Column(
            'priority',
            sa.Enum('critical', 'normal', 'marketing', name='notificationpriority'),
            nullable=True,
        ),
    )
    op.add_column('notifications', sa.Column('template_id', sa.String(length=100), nullable=True))
    op.add_column('notifications', sa.Column('payload', sa.JSON(), nullable=True))
    op.add_column('notifications', sa.Column('provider', sa.String(length=100), nullable=True))
    op.add_column('notifications', sa.Column('provider_ref', sa.String(length=255), nullable=True))
    op.add_column('notifications', sa.Column('attempts', sa.Integer(), nullable=True))
    op.add_column('notifications', sa.Column('last_attempted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('notifications', sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True))

    op.alter_column(
        'notifications', 'read_at',
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
    )
    op.alter_column(
        'notifications', 'created_at',
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
    )
    op.alter_column(
        'notifications', 'updated_at',
        existing_type=postgresql.TIMESTAMP(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
    )

    # --- Step 2: backfill existing rows ---
    op.execute("UPDATE notifications SET idempotency_key = id::text WHERE idempotency_key IS NULL")
    op.execute("UPDATE notifications SET channel = 'in_app' WHERE channel IS NULL")
    op.execute("UPDATE notifications SET priority = 'normal' WHERE priority IS NULL")
    op.execute("UPDATE notifications SET attempts = 0 WHERE attempts IS NULL")

    # --- Step 3: now safe to tighten constraints ---
    op.alter_column('notifications', 'idempotency_key', nullable=False)
    op.alter_column('notifications', 'channel', nullable=False)
    op.alter_column('notifications', 'priority', nullable=False)
    op.alter_column('notifications', 'attempts', nullable=False)

    op.create_index(
        op.f('ix_notifications_idempotency_key'),
        'notifications',
        ['idempotency_key'],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_idempotency_key'), table_name='notifications')
    op.alter_column(
        'notifications', 'updated_at',
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        existing_nullable=True,
    )
    op.alter_column(
        'notifications', 'created_at',
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        existing_nullable=True,
    )
    op.alter_column(
        'notifications', 'read_at',
        existing_type=sa.DateTime(timezone=True),
        type_=postgresql.TIMESTAMP(),
        existing_nullable=True,
    )
    op.drop_column('notifications', 'delivered_at')
    op.drop_column('notifications', 'last_attempted_at')
    op.drop_column('notifications', 'attempts')
    op.drop_column('notifications', 'provider_ref')
    op.drop_column('notifications', 'provider')
    op.drop_column('notifications', 'payload')
    op.drop_column('notifications', 'template_id')
    op.drop_column('notifications', 'priority')
    op.drop_column('notifications', 'channel')
    op.drop_column('notifications', 'idempotency_key')