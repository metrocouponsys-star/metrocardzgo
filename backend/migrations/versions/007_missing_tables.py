"""Migration 007: Create missing reward/loyalty tables + fix loyalty_transactions.note.

This migration creates all reward-engine tables that existed only in the ORM
models but were never created via migration on the production database.

Tables created (idempotent — IF NOT EXISTS):
  - reward_catalog
  - reward_claims
  - coupon_codes
  - gift_vouchers
  - points_rules
  - scratch_cards
  - lucky_draws
  - lucky_draw_entries

Columns added (idempotent):
  - loyalty_transactions.note  (TEXT, nullable)

Enum values added (idempotent):
  - loyalty_tx_type: 'referral_bonus'

Revision ID: 007_missing_tables
Revises: 006_performance_indexes
Create Date: 2026-08-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "007_missing_tables"
down_revision = "006_performance_indexes"
branch_labels = None
depends_on = None


def _table_exists(bind, table_name: str) -> bool:
    """Check if a table already exists in the database."""
    insp = inspect(bind)
    return table_name in insp.get_table_names()


def _column_exists(bind, table_name: str, column_name: str) -> bool:
    """Check if a column already exists in a table."""
    insp = inspect(bind)
    if table_name not in insp.get_table_names():
        return False
    cols = [c["name"] for c in insp.get_columns(table_name)]
    return column_name in cols


def upgrade() -> None:
    bind = op.get_bind()
    is_pg = bind.dialect.name == "postgresql"

    # ── 1. loyalty_transactions.note ─────────────────────────────────────────
    if not _column_exists(bind, "loyalty_transactions", "note"):
        op.add_column(
            "loyalty_transactions",
            sa.Column("note", sa.Text(), nullable=True),
        )

    # ── 2. loyalty_tx_type enum: add 'referral_bonus' ────────────────────────
    if is_pg:
        op.execute(
            "ALTER TYPE loyalty_tx_type ADD VALUE IF NOT EXISTS 'referral_bonus'"
        )

    # ── 3. reward_catalog ────────────────────────────────────────────────────
    if not _table_exists(bind, "reward_catalog"):
        op.create_table(
            "reward_catalog",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("merchant_id", sa.String(), nullable=False),
            sa.Column("name", sa.Text(), nullable=False),
            sa.Column("description", sa.Text(), server_default=""),
            sa.Column("points_cost", sa.Numeric(), nullable=False),
            sa.Column("quantity_available", sa.Integer(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"], ondelete="CASCADE"),
        )

    # ── 4. reward_claims ─────────────────────────────────────────────────────
    if not _table_exists(bind, "reward_claims"):
        op.create_table(
            "reward_claims",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("reward_id", sa.String(), nullable=False),
            sa.Column("member_id", sa.String(), nullable=False),
            sa.Column("merchant_id", sa.String(), nullable=False),
            sa.Column("points_spent", sa.Numeric(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["reward_id"], ["reward_catalog.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"], ondelete="CASCADE"),
        )

    # ── 5. coupon_codes ──────────────────────────────────────────────────────
    if not _table_exists(bind, "coupon_codes"):
        op.create_table(
            "coupon_codes",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("merchant_id", sa.String(), nullable=False),
            sa.Column("code", sa.Text(), nullable=False),
            sa.Column("discount_type", sa.String(), nullable=False),
            sa.Column("value", sa.Numeric(), nullable=False),
            sa.Column("min_purchase", sa.Numeric(), server_default="0"),
            sa.Column("max_uses", sa.Integer(), nullable=True),
            sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("expires_at", sa.Date(), nullable=True),
            sa.Column("active_days", sa.Text(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"], ondelete="CASCADE"),
        )

    # ── 6. gift_vouchers ─────────────────────────────────────────────────────
    if not _table_exists(bind, "gift_vouchers"):
        op.create_table(
            "gift_vouchers",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("merchant_id", sa.String(), nullable=False),
            sa.Column("code", sa.Text(), nullable=False, unique=True),
            sa.Column("value", sa.Numeric(), nullable=False),
            sa.Column("is_redeemed", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("redeemed_by_member_id", sa.String(), nullable=True),
            sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("expires_at", sa.Date(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["redeemed_by_member_id"], ["members.id"], ondelete="SET NULL"),
        )

    # ── 7. points_rules ──────────────────────────────────────────────────────
    if not _table_exists(bind, "points_rules"):
        op.create_table(
            "points_rules",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("merchant_id", sa.String(), nullable=False),
            sa.Column("rule_type", sa.String(), nullable=False),
            sa.Column("points_value", sa.Numeric(), nullable=False),
            sa.Column("spend_unit", sa.Numeric(), nullable=True, server_default="1"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"], ondelete="CASCADE"),
        )

    # ── 8. scratch_cards ─────────────────────────────────────────────────────
    if not _table_exists(bind, "scratch_cards"):
        op.create_table(
            "scratch_cards",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("merchant_id", sa.String(), nullable=False),
            sa.Column("member_id", sa.String(), nullable=False),
            sa.Column("reward_type", sa.String(), nullable=False),
            sa.Column("reward_value", sa.Text(), nullable=False),
            sa.Column("is_revealed", sa.Boolean(), nullable=False, server_default="false"),
            sa.Column("revealed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("trigger_visit", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="CASCADE"),
        )

    # ── 9. lucky_draws ───────────────────────────────────────────────────────
    if not _table_exists(bind, "lucky_draws"):
        op.create_table(
            "lucky_draws",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("merchant_id", sa.String(), nullable=False),
            sa.Column("name", sa.Text(), nullable=False),
            sa.Column("prize", sa.Text(), nullable=False),
            sa.Column("draw_date", sa.Date(), nullable=False),
            sa.Column("min_points", sa.Numeric(), server_default="0"),
            sa.Column("min_visits", sa.Integer(), server_default="0"),
            sa.Column("status", sa.String(), nullable=False, server_default="open"),
            sa.Column("winner_member_id", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["winner_member_id"], ["members.id"], ondelete="SET NULL"),
        )

    # ── 10. lucky_draw_entries ───────────────────────────────────────────────
    if not _table_exists(bind, "lucky_draw_entries"):
        op.create_table(
            "lucky_draw_entries",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("draw_id", sa.String(), nullable=False),
            sa.Column("member_id", sa.String(), nullable=False),
            sa.Column("entered_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint("id"),
            sa.ForeignKeyConstraint(["draw_id"], ["lucky_draws.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="CASCADE"),
        )


def downgrade() -> None:
    op.drop_table("lucky_draw_entries")
    op.drop_table("lucky_draws")
    op.drop_table("scratch_cards")
    op.drop_table("points_rules")
    op.drop_table("gift_vouchers")
    op.drop_table("coupon_codes")
    op.drop_table("reward_claims")
    op.drop_table("reward_catalog")
    op.drop_column("loyalty_transactions", "note")
