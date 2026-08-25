from alembic import op
from sqlalchemy import text

revision = '010_enum_to_text'
down_revision = '009_lucky_draw_multi_prize'
branch_labels = None
depends_on = None


def _is_enum(bind, table, col):
    row = bind.execute(text('SELECT data_type FROM information_schema.columns WHERE table_name = :t AND column_name = :c'), {'t': table, 'c': col}).fetchone()
    return row is not None and row[0] == 'USER-DEFINED'


def _to_text(bind, table, col):
    if _is_enum(bind, table, col):
        bind.execute(text('ALTER TABLE ' + table + ' ALTER COLUMN ' + col + ' TYPE TEXT USING ' + col + '::TEXT'))


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name != 'postgresql':
        return
    for tbl, col in [('members','status'),('member_offer_state','status'),('merchants','status'),('merchants','approval_status'),('merchant_users','role'),('offer_templates','offer_type'),('loyalty_transactions','type'),('card_inventory','status'),('reminder_rules','trigger_type'),('reminder_rules','channel'),('campaigns','target_audience'),('campaigns','channel'),('campaigns','status'),('message_log','status')]:
        _to_text(bind, tbl, col)
    for et in ['member_status','offer_state_status','merchant_status','merchant_approval_status','user_role','offer_type','loyalty_tx_type','card_status','reminder_trigger','message_channel','campaign_audience','campaign_channel','campaign_status','message_delivery_status']:
        try:
            bind.execute(text('DROP TYPE IF EXISTS ' + et))
        except Exception:
            pass


def downgrade():
    pass

