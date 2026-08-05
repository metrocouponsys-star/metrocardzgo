"""Migration 008: Convert points_rules.rule_type column to VARCHAR.

Fixes:
  (psycopg.errors.DatatypeMismatch) column "rule_type" is of type points_rule_type
  but expression is of type character varying

Revision ID: 008_fix_points_rule_type
Revises: 007_missing_tables
Create Date: 2026-08-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "008_fix_points_rule_type"
down_revision = "007_missing_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        insp = inspect(bind)
        if "points_rules" in insp.get_table_names():
            cols = insp.get_columns("points_rules")
            rule_type_col = next((c for c in cols if c["name"] == "rule_type"), None)
            if rule_type_col:
                # Alter column type to VARCHAR safely using cast
                op.execute(
                    "ALTER TABLE points_rules ALTER COLUMN rule_type TYPE VARCHAR USING rule_type::VARCHAR;"
                )


def downgrade() -> None:
    pass
