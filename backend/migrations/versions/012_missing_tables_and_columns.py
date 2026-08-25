from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = '012_missing_tables_and_columns'
down_revision = '011_members_missing_columns'
branch_labels = None
depends_on = None


def _tbl(bind, t):
    return t in inspect(bind).get_table_names()


def _col(bind, t, c):
    if not _tbl(bind, t):
        return False
    return c in [x['name'] for x in inspect(bind).get_columns(t)]


def upgrade():
    bind = op.get_bind()

    # merchants: card_design_url
    if not _col(bind, 'merchants', 'card_design_url'):
        op.add_column('merchants', sa.Column('card_design_url', sa.Text(), nullable=True))

    # merchant_wallet_classes
    if not _tbl(bind, 'merchant_wallet_classes'):
        op.create_table('merchant_wallet_classes',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('merchant_id', sa.String(), nullable=False),
            sa.Column('google_class_id', sa.Text(), nullable=False),
            sa.Column('logo_url', sa.Text(), nullable=True),
            sa.Column('background_color', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('google_class_id'),
            sa.UniqueConstraint('merchant_id'),
            sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ondelete='CASCADE'),
        )

    # member_wallet_passes
    if not _tbl(bind, 'member_wallet_passes'):
        op.create_table('member_wallet_passes',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('member_id', sa.String(), nullable=False),
            sa.Column('wallet_class_id', sa.String(), nullable=False),
            sa.Column('google_object_id', sa.Text(), nullable=False),
            sa.Column('status', sa.Text(), nullable=False, server_default='not_added'),
            sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('google_object_id'),
            sa.UniqueConstraint('member_id'),
            sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['wallet_class_id'], ['merchant_wallet_classes.id'], ondelete='CASCADE'),
        )

    # member_feedback
    if not _tbl(bind, 'member_feedback'):
        op.create_table('member_feedback',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('member_id', sa.String(), nullable=False),
            sa.Column('merchant_id', sa.String(), nullable=False),
            sa.Column('rating', sa.Integer(), nullable=False),
            sa.Column('comment', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['member_id'], ['members.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ondelete='CASCADE'),
        )

    # event_logs
    if not _tbl(bind, 'event_logs'):
        op.create_table('event_logs',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('merchant_id', sa.String(), nullable=False),
            sa.Column('member_id', sa.String(), nullable=True),
            sa.Column('event_type', sa.String(), nullable=False),
            sa.Column('payload', sa.JSON(), nullable=False, server_default='{}'),
            sa.Column('actor_id', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
        )

    # idempotency_records
    if not _tbl(bind, 'idempotency_records'):
        op.create_table('idempotency_records',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('key', sa.String(), nullable=False),
            sa.Column('response_code', sa.Integer(), nullable=False),
            sa.Column('response_body', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('key'),
        )

    # admin_audit_log
    if not _tbl(bind, 'admin_audit_log'):
        op.create_table('admin_audit_log',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('admin_user_id', sa.String(), nullable=True),
            sa.Column('action', sa.String(), nullable=False),
            sa.Column('target_type', sa.String(), nullable=True),
            sa.Column('target_id', sa.String(), nullable=True),
            sa.Column('details', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.PrimaryKeyConstraint('id'),
        )


def downgrade():
    pass

