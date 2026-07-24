"""Migration 006: Add performance indexes for high-frequency query patterns.

Changes:
  - ix_members_merchant_status  : composite (merchant_id, status)
      Used by: every dashboard load — active member count, expiring counts
  - ix_members_merchant_phone   : composite (merchant_id, phone)
      Used by: member search ILIKE on phone; filters to merchant's rows first
  - ix_members_merchant_expiry  : composite (merchant_id, expiry_date)
      Used by: expiring_this_month + expiring_this_week dashboard queries (2x each load)
  - ix_members_public_token     : (public_token) unique
      Used by: /m/:token public member page — point lookup
  - ix_redemptions_created_at   : (created_at)
      Used by: redemptions_today filter + report time-range queries

Revision ID: 006_performance_indexes
Revises: 005_add_auto_renew
Create Date: 2026-07-24
"""
from alembic import op
import sqlalchemy as sa

revision = "006_performance_indexes"
down_revision = "005_add_auto_renew"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Dashboard: active members count — runs on every /dashboard/stats load.
    # Without this, Postgres does a full-table scan across ALL merchants' rows.
    op.create_index(
        "ix_members_merchant_status",
        "members",
        ["merchant_id", "status"],
        unique=False,
    )

    # Member search: filter by merchant first, then ILIKE on phone/name.
    # Reduces the ILIKE scan from all members to only the current merchant's rows.
    op.create_index(
        "ix_members_merchant_phone",
        "members",
        ["merchant_id", "phone"],
        unique=False,
    )

    # Expiry queries: WHERE merchant_id=X AND expiry_date BETWEEN a AND b.
    # Fires twice per dashboard load (expiring_this_month + expiring_this_week).
    op.create_index(
        "ix_members_merchant_expiry",
        "members",
        ["merchant_id", "expiry_date"],
        unique=False,
    )

    # Public member page: WHERE public_token = :token — point lookup.
    # Column has UNIQUE constraint but confirm index exists for lookup speed.
    try:
        op.create_index(
            "ix_members_public_token",
            "members",
            ["public_token"],
            unique=True,
        )
    except Exception:
        # Index may already exist from the initial schema migration; safe to skip.
        pass

    # Redemptions time-range: WHERE created_at >= today_start.
    # Used by dashboard today-count and all report time-range queries.
    op.create_index(
        "ix_redemptions_created_at",
        "redemption_log",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_redemptions_created_at", table_name="redemption_log")
    try:
        op.drop_index("ix_members_public_token", table_name="members")
    except Exception:
        pass
    op.drop_index("ix_members_merchant_expiry", table_name="members")
    op.drop_index("ix_members_merchant_phone", table_name="members")
    op.drop_index("ix_members_merchant_status", table_name="members")
