"""Add email column to merchant_users for Google OAuth login.

Revision ID: 002_email_google_auth
Revises: 001_loyalty_and_reminder_timing
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "002_email_google_auth"
down_revision = "001_loyalty_and_reminder_timing"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add email column — nullable so existing users are not broken
    op.add_column(
        "merchant_users",
        sa.Column("email", sa.Text(), nullable=True),
    )
    # Add unique index so two users can't share the same Google account
    op.create_index(
        "ix_merchant_users_email",
        "merchant_users",
        ["email"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_merchant_users_email", table_name="merchant_users")
    op.drop_column("merchant_users", "email")
