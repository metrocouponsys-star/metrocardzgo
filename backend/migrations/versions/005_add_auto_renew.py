"""Migration 005: Add auto_renew boolean column to members.

Changes:
  - members.auto_renew: nullable=False, server_default=false
    Allows merchant to flag a member for automatic annual renewal.
    Previously the UI toggle sent this field but the DB column did not exist,
    causing silent failures (backend ignored the unknown field).

Revision ID: 005_add_auto_renew
Revises: 004_loyalty_tx_fixes
Create Date: 2026-07-21
"""
from alembic import op
import sqlalchemy as sa

revision = "005_add_auto_renew"
down_revision = "004_loyalty_tx_fixes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "members",
        sa.Column(
            "auto_renew",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("members", "auto_renew")
