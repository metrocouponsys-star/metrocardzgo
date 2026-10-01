"""
Tier System, Visit Streaks, Challenges/Missions, and Points Expiry ORM models.
These form the Loyalty V2 feature set.

Tier levels: Bronze → Silver → Gold → Platinum
Streaks:    Consecutive visit tracking with bonus rewards
Challenges: Admin-defined time-limited missions for extra points
Expiry:     Points expiry rules with automated reminders
"""
import uuid
from sqlalchemy import (
    Column, String, Text, Numeric, Integer, Boolean,
    DateTime, Date, ForeignKey, func, JSON,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


# ── Tier Configuration (per merchant) ────────────────────────────────────────
class TierConfig(Base):
    """
    Merchant-defined loyalty tier configuration.
    Each tier has a minimum points threshold and a name/color/benefits JSON.
    
    Example tiers (merchant-configurable):
      Bronze  →  0 points
      Silver  →  500 points
      Gold    →  2,000 points
      Platinum → 5,000 points
    """
    __tablename__ = "tier_configs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)                    # e.g. "Gold"
    slug = Column(Text, nullable=False)                    # e.g. "gold"
    color_hex = Column(Text, nullable=True)                # e.g. "#FFD700" for Gold
    icon = Column(Text, nullable=True)                     # Material icon name or emoji
    min_points = Column(Numeric, nullable=False, default=0)  # points threshold to enter this tier
    min_visits = Column(Integer, nullable=True)            # alternative: visit-based threshold
    bonus_points_multiplier = Column(Numeric, nullable=False, default=1.0)  # earn multiplier
    benefits = Column(JSON, nullable=True)                 # list of benefit strings shown on card
    display_order = Column(Integer, nullable=False, default=0)  # 0=lowest, higher=better
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant")


# ── Member Tier (current tier per member) ────────────────────────────────────
class MemberTier(Base):
    """
    Tracks the current tier for each member.
    Updated by the tier_upgrade Celery task or on each redemption.
    """
    __tablename__ = "member_tiers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, unique=True)
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    tier_config_id = Column(String, ForeignKey("tier_configs.id", ondelete="SET NULL"), nullable=True)
    tier_name = Column(Text, nullable=False, default="Bronze")  # denormalized for fast reads
    tier_slug = Column(Text, nullable=False, default="bronze")
    achieved_at = Column(DateTime(timezone=True), nullable=True)
    next_tier_points_needed = Column(Numeric, nullable=True)   # points needed to reach next tier
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    member = relationship("Member")
    tier_config = relationship("TierConfig")


# ── Visit Streak ──────────────────────────────────────────────────────────────
class VisitStreak(Base):
    """
    Tracks consecutive weekly visit streaks for each member at a merchant.
    A "streak" = member visited at least once each consecutive week.
    
    Streak milestones (configurable) award bonus points:
      3 weeks  → 50 bonus points
      5 weeks  → 100 bonus points
      10 weeks → 250 bonus points
    """
    __tablename__ = "visit_streaks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    current_streak = Column(Integer, nullable=False, default=0)  # current consecutive weeks
    longest_streak = Column(Integer, nullable=False, default=0)  # all-time best
    last_visit_week = Column(Text, nullable=True)                 # ISO week string e.g. "2026-W39"
    streak_broken_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    member = relationship("Member")


# ── Challenge / Mission ───────────────────────────────────────────────────────
class Challenge(Base):
    """
    Admin-defined time-limited challenges that award bonus points.
    Examples:
      "Visit any 3 restaurants this October → 500 bonus points"
      "Make 5 purchases this week → Gold scratch card"
      "Refer 2 friends this month → 300 points"
    """
    __tablename__ = "challenges"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    challenge_type = Column(
        String, nullable=False
    )  # visit_count | spend_amount | referral_count | redemption_count
    target_value = Column(Numeric, nullable=False)          # e.g. 5 visits or ₹1000 spend
    reward_type = Column(String, nullable=False, default="points")  # points | scratch_card | tier_upgrade
    reward_value = Column(Numeric, nullable=False)           # bonus points or scratch card count
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    image_url = Column(Text, nullable=True)                 # challenge banner image
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    merchant = relationship("Merchant")
    member_progress = relationship("ChallengeProgress", back_populates="challenge", cascade="all, delete-orphan")


class ChallengeProgress(Base):
    """Tracks each member's progress towards completing a challenge."""
    __tablename__ = "challenge_progress"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    current_value = Column(Numeric, nullable=False, default=0)  # current progress
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    reward_issued = Column(Boolean, default=False, nullable=False)  # has the reward been given?
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    challenge = relationship("Challenge", back_populates="member_progress")
    member = relationship("Member")


# ── Points Expiry Rule ────────────────────────────────────────────────────────
class PointsExpiryRule(Base):
    """
    Merchant-level rule for when loyalty points expire.
    Celery beat task runs daily and checks for inactive members.
    
    Example: "Points expire after 180 days of inactivity"
    """
    __tablename__ = "points_expiry_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, unique=True)
    inactivity_days = Column(Integer, nullable=False, default=180)  # days without a redemption
    warning_days_before = Column(Integer, nullable=False, default=30)  # warn X days before expiry
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    merchant = relationship("Merchant")


# ── Member Review / Rating ────────────────────────────────────────────────────
class MemberReview(Base):
    """
    Members can rate their redemption experience (1–5 stars).
    Each review earns a small points bonus (configured per merchant).
    Reviews are shown on the merchant's offer detail page.
    """
    __tablename__ = "member_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    merchant_id = Column(String, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False)
    redemption_id = Column(String, ForeignKey("redemption_log.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Integer, nullable=False)            # 1–5 stars
    comment = Column(Text, nullable=True)
    points_earned = Column(Numeric, nullable=False, default=0)  # bonus for leaving review
    is_visible = Column(Boolean, default=True, nullable=False)  # admin can hide inappropriate reviews
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    member = relationship("Member")
