"""Rewards, Coupons, Gift Vouchers, Points Rules, Scratch Cards, Lucky Draws ORM models."""
import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, DateTime, Date, ForeignKey, func, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class RewardCatalog(Base):
    """Merchant-defined rewards that members can claim using loyalty points."""
    __tablename__ = "reward_catalog"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text, default="")
    points_cost = Column(Numeric, nullable=False)
    quantity_available = Column(Integer, nullable=True)   # None = unlimited
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant")
    claims = relationship("RewardClaim", back_populates="reward", cascade="all, delete-orphan")


class RewardClaim(Base):
    """Tracks when a member claims a reward from the catalog."""
    __tablename__ = "reward_claims"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reward_id = Column(String, ForeignKey("reward_catalog.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    points_spent = Column(Numeric, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reward = relationship("RewardCatalog", back_populates="claims")
    member = relationship("Member")


class CouponCode(Base):
    """Merchant-generated coupon codes for discounts at checkout."""
    __tablename__ = "coupon_codes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=False)
    discount_type = Column(Enum("flat", "percent", name="discount_type"), nullable=False)
    value = Column(Numeric, nullable=False)
    min_purchase = Column(Numeric, default=0)
    max_uses = Column(Integer, nullable=True)    # None = unlimited
    used_count = Column(Integer, default=0, nullable=False)
    expires_at = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant")


class GiftVoucher(Base):
    """Pre-loaded gift vouchers that can be redeemed by any member."""
    __tablename__ = "gift_vouchers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    code = Column(Text, nullable=False, unique=True)
    value = Column(Numeric, nullable=False)
    is_redeemed = Column(Boolean, default=False, nullable=False)
    redeemed_by_member_id = Column(String, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant")
    redeemed_by = relationship("Member", foreign_keys=[redeemed_by_member_id])


class PointsRule(Base):
    """Merchant-level global points earning rules (per visit, per rupee spent, etc.)."""
    __tablename__ = "points_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    rule_type = Column(Enum("per_visit", "per_rupee", name="points_rule_type"), nullable=False)
    points_value = Column(Numeric, nullable=False)    # points earned per visit OR per ₹ spent
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant")


class ScratchCard(Base):
    """Scratch-and-win cards issued to members on milestones."""
    __tablename__ = "scratch_cards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    reward_type = Column(Enum("points", "voucher", "coupon", "gift", name="scratch_reward_type"), nullable=False)
    reward_value = Column(Text, nullable=False)      # points amount OR voucher code OR description
    is_revealed = Column(Boolean, default=False, nullable=False)
    revealed_at = Column(DateTime(timezone=True), nullable=True)
    trigger_visit = Column(Integer, nullable=True)   # which visit number triggered this
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant")
    member = relationship("Member")


class LuckyDraw(Base):
    """Merchant-run lucky draws with eligibility criteria."""
    __tablename__ = "lucky_draws"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    prize = Column(Text, nullable=False)
    draw_date = Column(Date, nullable=False)
    min_points = Column(Numeric, default=0)          # minimum loyalty points to enter
    min_visits = Column(Integer, default=0)          # minimum visits to enter
    status = Column(Enum("open", "closed", "drawn", name="lucky_draw_status"), default="open", nullable=False)
    winner_member_id = Column(String, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant")
    winner = relationship("Member", foreign_keys=[winner_member_id])
    entries = relationship("LuckyDrawEntry", back_populates="draw", cascade="all, delete-orphan")


class LuckyDrawEntry(Base):
    """Members who have entered a lucky draw."""
    __tablename__ = "lucky_draw_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    draw_id = Column(String, ForeignKey("lucky_draws.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    entered_at = Column(DateTime(timezone=True), server_default=func.now())

    draw = relationship("LuckyDraw", back_populates="entries")
    member = relationship("Member")
