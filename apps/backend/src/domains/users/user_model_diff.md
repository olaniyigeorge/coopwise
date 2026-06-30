User model changes (apply to src/domains/users/models.py):

1. DELETE the password column entirely:

    # password is nullable so Crossmint-only users don't need one
    password = Column(String, nullable=True)

   There is no "Crossmint-only users" distinction anymore — ALL users are
   Crossmint-only. This column, and everything that ever wrote to it
   (register_user, change_password), is gone. Dropping a nullable column
   that's already unused in practice is low-risk; see migration below.

2. KEEP unchanged: crossmint_user_id, flow_address, wallet_provider,
   is_email_verified, is_phone_verified, is_video_verified,
   wallet_activated, is_verified, and all onboarding/preference fields
   (target_savings_amount, savings_purpose, income_range, saving_frequency).
   These are exactly right for the new design — crossmint_user_id is the
   immutable join key, flow_address/wallet_provider describe the wallet
   Crossmint provisioned silently, and the KYC/onboarding fields are
   informational (see AuthService._onboarding_status).

3. RECOMMEND (separate migration, not auth-domain-blocking): make
   crossmint_user_id NOT NULL once the old password-registered users (if
   any exist in your current DB) have been migrated/backfilled. Until
   then it must stay nullable to avoid breaking existing rows. This is a
   data migration concern, not a code change — flagging so it doesn't get
   forgotten.

4. username stays unique/required. It's still useful as a stable,
   human-readable handle independent of email/phone, and AuthService now
   generates one automatically on first provisioning
   (_generate_unique_username), so nothing about the signup flow requires
   the user to choose one up front — onboarding can let them change it
   later if you want that as a profile-setup step.

---
Alembic migration (new revision, drops password column):

"""drop password column - crossmint is sole identity provider

Revision ID: <generate>
Revises: 58ba0874e5a3  (the KYC fields migration — latest head per your tree)
"""
from alembic import op
import sqlalchemy as sa

revision = "<generate>"
down_revision = "58ba0874e5a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("users", "password")


def downgrade() -> None:
    op.add_column("users", sa.Column("password", sa.String(), nullable=True))