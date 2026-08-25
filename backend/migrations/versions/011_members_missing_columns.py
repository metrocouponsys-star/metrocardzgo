from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '011_members_missing_columns'
down_revision = '010_enum_to_text'
branch_labels = None
depends_on = None


def _col(bind, table, col):
    insp = inspect(bind)
    return table in insp.get_table_names() and col in [c['name'] for c in insp.get_columns(table)]


def upgrade():
    bind = op.get_bind()
    if not _col(bind, 'members', 'anniversary_date'):
        op.add_column('members', sa.Column('anniversary_date', sa.Date(), nullable=True))
    if not _col(bind, 'members', 'family_dob_1'):
        op.add_column('members', sa.Column('family_dob_1', sa.Date(), nullable=True))
    if not _col(bind, 'members', 'family_dob_2'):
        op.add_column('members', sa.Column('family_dob_2', sa.Date(), nullable=True))
    if not _col(bind, 'members', 'family_dob_3'):
        op.add_column('members', sa.Column('family_dob_3', sa.Date(), nullable=True))
    if not _col(bind, 'members', 'physical_card_number'):
        op.add_column('members', sa.Column('physical_card_number', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('members', 'physical_card_number')
    op.drop_column('members', 'family_dob_3')
    op.drop_column('members', 'family_dob_2')
    op.drop_column('members', 'family_dob_1')
    op.drop_column('members', 'anniversary_date')

