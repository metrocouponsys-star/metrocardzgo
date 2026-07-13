"""Loyalty points program + merchant-configurable reminder timing

Revision ID: 001_loyalty_and_reminder_timing
Revises: (set to your previous head revision)
Create Date: 2026-07-12

Changes:
  1. members.wallet_balance  →  members.loyalty_points (rename)
  2. offer_templates: add loyalty_points_earn, is_points_redemption, loyalty_points_cost columns
  3. offer_type enum: add 'points_redemption' value
  4. CREATE TABLE loyalty_transactions
  5. reminder_rules: add send_time, days_before, timezone columns
     - expiry rules default to days_before=7, all others default to 0
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_loyalty_and_reminder_timing'
down_revision = None   # set to your current head revision ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Rename members.wallet_balance → members.loyalty_points ─────────────
    op.alter_column('members', 'wallet_balance', new_column_name='loyalty_points')

    # ── 2. offer_templates: add loyalty columns ───────────────────────────────
    op.add_column('offer_templates',
        sa.Column('loyalty_points_earn', sa.Numeric(), nullable=True))
    op.add_column('offer_templates',
        sa.Column('is_points_redemption', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('offer_templates',
        sa.Column('loyalty_points_cost', sa.Numeric(), nullable=True))

    # ── 3. offer_type enum: add points_redemption ─────────────────────────────
    # PostgreSQL ALTER TYPE ADD VALUE cannot run inside a transaction.
    # Alembic runs migrations in transactions by default, so we need to commit first.
    # Using execute with COMMIT workaround — safe because this is additive only.
    op.execute("COMMIT")
    op.execute("ALTER TYPE offer_type ADD VALUE IF NOT EXISTS 'points_redemption'")

    # ── 4. CREATE TABLE loyalty_transactions ──────────────────────────────────
    op.create_table(
        'loyalty_transactions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('member_id', sa.String(), nullable=False),
        sa.Column('merchant_id', sa.String(), nullable=False),
        sa.Column('type', sa.Enum('earn', 'redeem', name='loyalty_tx_type'), nullable=False),
        sa.Column('points', sa.Numeric(), nullable=False),
        sa.Column('source_redemption_id', sa.String(), nullable=True),
        sa.Column('source_offer_id', sa.String(), nullable=True),
        sa.Column('balance_after', sa.Numeric(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_redemption_id'], ['redemption_log.id']),
        sa.ForeignKeyConstraint(['source_offer_id'], ['offer_templates.id']),
    )
    op.create_index('ix_loyalty_tx_member_created', 'loyalty_transactions',
                    ['member_id', 'created_at'])
    op.create_index('ix_loyalty_tx_merchant_created', 'loyalty_transactions',
                    ['merchant_id', 'created_at'])

    # ── 5. reminder_rules: add timing columns ─────────────────────────────────
    op.add_column('reminder_rules',
        sa.Column('send_time', sa.Time(), nullable=True))
    op.add_column('reminder_rules',
        sa.Column('days_before', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('reminder_rules',
        sa.Column('timezone', sa.Text(), nullable=False, server_default="'Asia/Kolkata'"))

    # Set sensible defaults: expiry rules → 7 days before, others → 0 (on the day)
    op.execute(
        "UPDATE reminder_rules SET days_before = 7 WHERE trigger_type = 'expiry'"
    )
    # Set default send_time to 09:00 for all existing rules
    op.execute(
        "UPDATE reminder_rules SET send_time = '09:00:00' WHERE send_time IS NULL"
    )


def downgrade() -> None:
    # ── Remove timing columns from reminder_rules ─────────────────────────────
    op.drop_column('reminder_rules', 'timezone')
    op.drop_column('reminder_rules', 'days_before')
    op.drop_column('reminder_rules', 'send_time')

    # ── Drop loyalty_transactions table ───────────────────────────────────────
    op.drop_index('ix_loyalty_tx_merchant_created', table_name='loyalty_transactions')
    op.drop_index('ix_loyalty_tx_member_created', table_name='loyalty_transactions')
    op.drop_table('loyalty_transactions')

    # ── Remove loyalty columns from offer_templates ──────────────────────────
    op.drop_column('offer_templates', 'loyalty_points_cost')
    op.drop_column('offer_templates', 'is_points_redemption')
    op.drop_column('offer_templates', 'loyalty_points_earn')

    # ── Rename members.loyalty_points → members.wallet_balance ───────────────
    op.alter_column('members', 'loyalty_points', new_column_name='wallet_balance')

    # Note: Cannot easily remove enum values in PostgreSQL downgrade.
    # The 'points_redemption' value will remain in the enum type.
    # Ensure no rows use it before downgrading.
