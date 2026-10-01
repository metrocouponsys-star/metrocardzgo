"""
Loyalty Tier System, Visit Streaks, Challenges, and Points Expiry API router.
Loyalty V2 feature set.
"""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.models.member import Member
from app.models.tiers import (
    TierConfig, MemberTier, VisitStreak, Challenge,
    ChallengeProgress, PointsExpiryRule, MemberReview,
)
from app.models.loyalty import LoyaltyTransaction

tiers_router = APIRouter(prefix="/tiers", tags=["tiers"])
challenges_router = APIRouter(prefix="/challenges", tags=["challenges"])
reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])


# ─────────────────────── Pydantic Schemas ────────────────────────────────────

class TierConfigCreate(BaseModel):
    name: str
    slug: str
    color_hex: Optional[str] = None
    icon: Optional[str] = None
    min_points: Decimal = 0
    min_visits: Optional[int] = None
    bonus_points_multiplier: Decimal = Decimal("1.0")
    benefits: Optional[list] = None
    display_order: int = 0

class TierConfigOut(TierConfigCreate):
    id: str
    merchant_id: str
    is_active: bool
    class Config: from_attributes = True

class MemberTierOut(BaseModel):
    id: str
    member_id: str
    tier_name: str
    tier_slug: str
    next_tier_points_needed: Optional[Decimal]
    achieved_at: Optional[datetime]
    class Config: from_attributes = True

class StreakOut(BaseModel):
    member_id: str
    current_streak: int
    longest_streak: int
    last_visit_week: Optional[str]
    class Config: from_attributes = True

class ChallengeCreate(BaseModel):
    title: str
    description: str
    challenge_type: str = Field(..., pattern="^(visit_count|spend_amount|referral_count|redemption_count)$")
    target_value: Decimal
    reward_type: str = "points"
    reward_value: Decimal
    start_date: date
    end_date: date
    image_url: Optional[str] = None

class ChallengeOut(ChallengeCreate):
    id: str
    merchant_id: str
    is_active: bool
    class Config: from_attributes = True

class ChallengeProgressOut(BaseModel):
    challenge_id: str
    challenge_title: str
    current_value: Decimal
    target_value: Decimal
    progress_pct: float
    is_completed: bool
    reward_issued: bool
    class Config: from_attributes = True

class PointsExpiryRuleCreate(BaseModel):
    inactivity_days: int = 180
    warning_days_before: int = 30
    is_active: bool = True

class ReviewCreate(BaseModel):
    redemption_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewOut(ReviewCreate):
    id: str
    member_id: str
    merchant_id: str
    points_earned: Decimal
    created_at: datetime
    class Config: from_attributes = True


# ─────────────────────── Tier Config CRUD ────────────────────────────────────

@tiers_router.get("/config", response_model=List[TierConfigOut])
def list_tier_configs(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    return (
        db.query(TierConfig)
        .filter(TierConfig.merchant_id == merchant_id)
        .order_by(TierConfig.display_order)
        .all()
    )


@tiers_router.post("/config", response_model=TierConfigOut, status_code=201)
def create_tier_config(
    payload: TierConfigCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    tier = TierConfig(
        merchant_id=merchant_id,
        **payload.model_dump(),
    )
    db.add(tier)
    db.commit()
    db.refresh(tier)
    return tier


@tiers_router.patch("/config/{tier_id}", response_model=TierConfigOut)
def update_tier_config(
    tier_id: str,
    payload: TierConfigCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    tier = db.query(TierConfig).filter(
        TierConfig.id == tier_id,
        TierConfig.merchant_id == merchant_id,
    ).first()
    if not tier:
        raise HTTPException(404, "Tier config not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(tier, k, v)
    db.commit()
    db.refresh(tier)
    return tier


@tiers_router.delete("/config/{tier_id}", status_code=204)
def delete_tier_config(
    tier_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    tier = db.query(TierConfig).filter(
        TierConfig.id == tier_id,
        TierConfig.merchant_id == merchant_id,
    ).first()
    if not tier:
        raise HTTPException(404, "Tier config not found")
    db.delete(tier)
    db.commit()


# ─────────────────────── Member Tier (read) ───────────────────────────────────

@tiers_router.get("/member/{member_id}", response_model=MemberTierOut)
def get_member_tier(
    member_id: str,
    db: Session = Depends(get_db),
):
    """Public: get the current tier for a member (used on the QR card page)."""
    mt = db.query(MemberTier).filter(MemberTier.member_id == member_id).first()
    if not mt:
        raise HTTPException(404, "Member tier not found")
    return mt


@tiers_router.get("/member/{member_id}/streak", response_model=StreakOut)
def get_member_streak(
    member_id: str,
    db: Session = Depends(get_db),
):
    """Get visit streak for a member."""
    streak = db.query(VisitStreak).filter(VisitStreak.member_id == member_id).first()
    if not streak:
        # Return zero-state
        return {"member_id": member_id, "current_streak": 0, "longest_streak": 0, "last_visit_week": None}
    return streak


@tiers_router.post("/member/{member_id}/recalculate", response_model=MemberTierOut)
def recalculate_member_tier(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Recalculate and update the tier for a member based on current loyalty_points.
    Called after each redemption/earn event or manually from admin.
    """
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.merchant_id == merchant_id,
    ).first()
    if not member:
        raise HTTPException(404, "Member not found")

    # Get all active tiers ordered by min_points desc (highest first)
    tiers = (
        db.query(TierConfig)
        .filter(TierConfig.merchant_id == merchant_id, TierConfig.is_active == True)
        .order_by(TierConfig.min_points.desc())
        .all()
    )

    current_tier = None
    next_tier_points = None

    for i, tier in enumerate(tiers):
        if float(member.loyalty_points or 0) >= float(tier.min_points):
            current_tier = tier
            # Next tier is the one above (lower index since sorted desc)
            if i > 0:
                next_tier_points = float(tiers[i - 1].min_points) - float(member.loyalty_points or 0)
            break

    if not current_tier and tiers:
        # Below all tiers — assign lowest
        current_tier = tiers[-1]
        next_tier_points = float(tiers[-2].min_points if len(tiers) > 1 else tiers[-1].min_points) - float(member.loyalty_points or 0)

    mt = db.query(MemberTier).filter(MemberTier.member_id == member_id).first()
    if not mt:
        mt = MemberTier(
            member_id=member_id,
            merchant_id=merchant_id,
        )
        db.add(mt)

    if current_tier:
        old_slug = mt.tier_slug
        mt.tier_config_id = current_tier.id
        mt.tier_name = current_tier.name
        mt.tier_slug = current_tier.slug
        mt.next_tier_points_needed = next_tier_points
        if old_slug != current_tier.slug:
            mt.achieved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(mt)
    return mt


# ─────────────────────── Challenges ──────────────────────────────────────────

@challenges_router.get("", response_model=List[ChallengeOut])
def list_challenges(
    active_only: bool = True,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    q = db.query(Challenge).filter(Challenge.merchant_id == merchant_id)
    if active_only:
        today = date.today()
        q = q.filter(Challenge.is_active == True, Challenge.start_date <= today, Challenge.end_date >= today)
    return q.order_by(Challenge.end_date).all()


@challenges_router.post("", response_model=ChallengeOut, status_code=201)
def create_challenge(
    payload: ChallengeCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    if payload.end_date < payload.start_date:
        raise HTTPException(400, "end_date must be >= start_date")
    ch = Challenge(merchant_id=merchant_id, **payload.model_dump())
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ch


@challenges_router.get("/member/{member_id}", response_model=List[ChallengeProgressOut])
def get_member_challenges(
    member_id: str,
    merchant_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Get all active challenges and this member's progress toward them."""
    today = date.today()
    q = db.query(Challenge).filter(
        Challenge.is_active == True,
        Challenge.start_date <= today,
        Challenge.end_date >= today,
    )
    if merchant_id:
        q = q.filter(Challenge.merchant_id == merchant_id)
    challenges = q.all()

    result = []
    for ch in challenges:
        progress = db.query(ChallengeProgress).filter(
            ChallengeProgress.challenge_id == ch.id,
            ChallengeProgress.member_id == member_id,
        ).first()
        current_val = float(progress.current_value) if progress else 0.0
        target_val = float(ch.target_value)
        result.append(ChallengeProgressOut(
            challenge_id=ch.id,
            challenge_title=ch.title,
            current_value=Decimal(str(current_val)),
            target_value=ch.target_value,
            progress_pct=min(100.0, (current_val / target_val * 100) if target_val else 0),
            is_completed=progress.is_completed if progress else False,
            reward_issued=progress.reward_issued if progress else False,
        ))
    return result


# ─────────────────────── Reviews ─────────────────────────────────────────────

@reviews_router.post("", response_model=ReviewOut, status_code=201)
def submit_review(
    payload: ReviewCreate,
    user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Member submits a rating + optional comment after redemption. Earns 10 points."""
    REVIEW_POINTS = 10

    # Find member
    member = db.query(Member).filter(Member.id == user.id).first()
    if not member:
        raise HTTPException(404, "Member not found")

    review = MemberReview(
        member_id=user.id,
        merchant_id=member.merchant_id,
        redemption_id=payload.redemption_id,
        rating=payload.rating,
        comment=payload.comment,
        points_earned=REVIEW_POINTS,
    )
    db.add(review)

    # Award review points
    member.loyalty_points = (member.loyalty_points or 0) + REVIEW_POINTS
    new_balance = float(member.loyalty_points)

    lt = LoyaltyTransaction(
        member_id=user.id,
        merchant_id=member.merchant_id,
        type="earn",
        points=REVIEW_POINTS,
        balance_after=new_balance,
        note=f"Review bonus — {payload.rating}★ rating",
    )
    db.add(lt)
    db.commit()
    db.refresh(review)
    return review


@reviews_router.get("/merchant/{merchant_id}", response_model=List[ReviewOut])
def get_merchant_reviews(
    merchant_id: str,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    return (
        db.query(MemberReview)
        .filter(MemberReview.merchant_id == merchant_id, MemberReview.is_visible == True)
        .order_by(MemberReview.created_at.desc())
        .limit(limit)
        .all()
    )
