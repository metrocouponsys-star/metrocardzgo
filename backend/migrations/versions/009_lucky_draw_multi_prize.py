from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text

revision = "009_lucky_draw_multi_prize"
down_revision = "008_fix_points_rule_type"
branch_labels = None
depends_on = None


def _column_exists(table, column):
    bind = op.get_bind()
    insp = inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table)]
    return column in cols


def upgrade():
    if not _column_exists("lucky_draws", "prizes"):
        op.add_column("lucky_draws", sa.Column("prizes", sa.JSON(), nullable=True))
    if not _column_exists("lucky_draws", "winner_member_ids"):
        op.add_column("lucky_draws", sa.Column("winner_member_ids", sa.JSON(), nullable=True))
    bind = op.get_bind()
    rows = bind.execute(text("SELECT id, prize, winner_member_id FROM lucky_draws WHERE prizes IS NULL")).fetchall()
    import json
    for row in rows:
        draw_id, prize, winner_id = row[0], row[1], row[2]
        bind.execute(text("UPDATE lucky_draws SET prizes = :p, winner_member_ids = :w WHERE id = :id"),
            {"p": json.dumps([prize] if prize else []), "w": json.dumps([winner_id] if winner_id else []), "id": draw_id})


def downgrade():
    bind = op.get_bind()
    if bind.dialect.name != "sqlite":
        if _column_exists("lucky_draws", "prizes"):
            op.drop_column("lucky_draws", "prizes")
        if _column_exists("lucky_draws", "winner_member_ids"):
            op.drop_column("lucky_draws", "winner_member_ids")
