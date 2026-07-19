"""Migration 004: Fix loyalty_tx_type enum + add note column.

Changes:
  - loyalty_transactions.type enum: adds 'referral_bonus' value
    (previously only 'earn' | 'redeem' — writing 'referral_bonus' caused a
     DB constraint violation on every member referral registration)
  - loyalty_transactions.note: optional text column for human-readable
    audit descriptions (e.g. "Reward claimed: Free Coffee",
    "Points rule: 10 pts per visit", "Gift voucher redeemed: ABCD1234")

Revision ID: 004_loyalty_tx_fixes
Revises: 003_industry_features
Create Date: 2026-07-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004_loyalty_tx_fixes"
down_revision = "003_industry_features"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── loyalty_transactions.note ────────────────────────────────────────────
    op.add_column(
        "loyalty_transactions",
        sa.Column("note", sa.Text(), nullable=True),
    )

    # ── loyalty_transactions.type: add 'referral_bonus' to enum ─────────────
    # PostgreSQL requires ALTER TYPE to add new enum values.
    # SQLite (used in tests) does not support ALTER TYPE — the model definition
    # is sufficient there since SQLite ignores CHECK constraints by default.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(
            "ALTER TYPE loyalty_tx_type ADD VALUE IF NOT EXISTS 'referral_bonus'"
        )
    # For SQLite: no-op — the enum is enforced at application level only.


def downgrade() -> None:
    op.drop_column("loyalty_transactions", "note")
    # Note: PostgreSQL does not support removing enum values.
    # If you need to revert the enum, drop and recreate the type (with downtime).
