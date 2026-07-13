"""Migration 003: Industry-grade feature columns.

Adds:
  - merchant_users.email (Google OAuth — already in 002, idempotent)
  - merchants.approval_status (merchant approval workflow)
  - members.notes (customer notes)
  - members.total_visits (visit-based reward counter)
  - members.referral_code (unique 8-char code for refer-a-friend)
  - members.referred_by_member_id (FK to referrer)
  - offer_templates.min_visits (visit threshold to unlock offer)
  - offer_templates.min_purchase_amount (spend threshold to unlock offer)

Revision ID: 003_industry_features
Revises: 002_email_google_auth
Create Date: 2026-07-14
"""
from alembic import op
import sqlalchemy as sa

revision = "003_industry_features"
down_revision = "002_email_google_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── merchants: approval workflow ─────────────────────────────────────────
    op.add_column(
        "merchants",
        sa.Column(
            "approval_status",
            sa.Enum("pending", "approved", "rejected", name="merchant_approval_status"),
            nullable=False,
            server_default="approved",   # existing merchants stay approved
        ),
    )

    # ── members: notes ───────────────────────────────────────────────────────
    op.add_column("members", sa.Column("notes", sa.Text(), nullable=True))

    # ── members: visit counter ────────────────────────────────────────────────
    op.add_column(
        "members",
        sa.Column("total_visits", sa.Integer(), nullable=False, server_default="0"),
    )

    # ── members: referral system ──────────────────────────────────────────────
    op.add_column("members", sa.Column("referral_code", sa.Text(), nullable=True))
    op.create_index("ix_members_referral_code", "members", ["referral_code"], unique=True)

    op.add_column(
        "members",
        sa.Column(
            "referred_by_member_id",
            sa.Text(),
            sa.ForeignKey("members.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    # points_per_referral on merchant (how many points to give referrer)
    op.add_column(
        "merchants",
        sa.Column("referral_bonus_points", sa.Numeric(precision=10, scale=2), nullable=True, server_default="50"),
    )

    # ── offer_templates: threshold-based unlocks ──────────────────────────────
    op.add_column(
        "offer_templates",
        sa.Column("min_visits", sa.Integer(), nullable=True),
    )
    op.add_column(
        "offer_templates",
        sa.Column("min_purchase_amount", sa.Numeric(precision=10, scale=2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("offer_templates", "min_purchase_amount")
    op.drop_column("offer_templates", "min_visits")
    op.drop_column("merchants", "referral_bonus_points")
    op.drop_column("members", "referred_by_member_id")
    op.drop_index("ix_members_referral_code", table_name="members")
    op.drop_column("members", "referral_code")
    op.drop_column("members", "total_visits")
    op.drop_column("members", "notes")
    op.drop_column("merchants", "approval_status")
