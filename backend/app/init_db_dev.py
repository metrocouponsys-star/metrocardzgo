from sqlalchemy import create_engine
from app.core.database import Base
# Make sure all models are imported so create_all knows about them
from app.models.merchant import Merchant, MerchantUser
from app.models.member import Member, MembershipType, MembershipTypeOffer, MemberOfferState
from app.models.offer import OfferTemplate
from app.models.campaign import Campaign, ReminderRule, MessageLog
from app.models.redemption import RedemptionLog
from app.models.loyalty import LoyaltyTransaction
from app.models.rewards import (
    RewardCatalog, RewardClaim, CouponCode, GiftVoucher,
    PointsRule, ScratchCard, LuckyDraw, LuckyDrawEntry,
)
from app.models.feedback import MemberFeedback
from app.models.wallet import MerchantWalletClass, MemberWalletPass
from app.models.event_log import EventLog
from app.models.idempotency import IdempotencyRecord

db_url = "sqlite:///test.db"
print(f"Creating all tables for SQLite database at {db_url}...")
engine = create_engine(db_url)
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")
