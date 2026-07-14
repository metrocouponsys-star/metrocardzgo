"""
Rewards, Coupons, Gift Vouchers, Points Rules, Scratch Cards, Lucky Draws, and Feedback routers.
"""
import uuid
import random
import string
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.core.rate_limit import public_rate_limit
from app.models.member import Member
from app.models.merchant import Merchant
from app.models.loyalty import LoyaltyTransaction
from app.models.rewards import (
    RewardCatalog, RewardClaim, CouponCode, GiftVoucher,
    PointsRule, ScratchCard, LuckyDraw, LuckyDrawEntry,
)
from app.models.feedback import MemberFeedback
from app.schemas import (
    RewardCatalogCreate, RewardCatalogUpdate, RewardCatalogOut, RewardClaimOut,
    CouponCodeCreate, CouponCodeUpdate, CouponCodeOut,
    CouponValidateRequest, CouponValidateOut,
    GiftVoucherCreate, GiftVoucherOut, GiftVoucherRedeemRequest,
    PointsRuleCreate, PointsRuleUpdate, PointsRuleOut,
    ScratchCardOut,
    LuckyDrawCreate, LuckyDrawUpdate, LuckyDrawOut,
    FeedbackCreate, FeedbackOut,
)

# ── Reward Catalog Router ──────────────────────────────────────────────────────
rewards_router = APIRouter(prefix="/rewards", tags=["rewards"])


@rewards_router.get("", response_model=List[RewardCatalogOut])
def list_rewards(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    return db.query(RewardCatalog).filter(RewardCatalog.merchant_id == merchant_id).order_by(RewardCatalog.created_at.desc()).all()


@rewards_router.post("", response_model=RewardCatalogOut, status_code=201)
def create_reward(
    payload: RewardCatalogCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    reward = RewardCatalog(merchant_id=merchant_id, **payload.model_dump())
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward


@rewards_router.patch("/{reward_id}", response_model=RewardCatalogOut)
def update_reward(
    reward_id: str,
    payload: RewardCatalogUpdate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    reward = db.query(RewardCatalog).filter(
        RewardCatalog.id == reward_id, RewardCatalog.merchant_id == merchant_id
    ).first()
    if not reward:
        raise HTTPException(404, "Reward not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(reward, k, v)
    db.commit()
    db.refresh(reward)
    return reward


@rewards_router.delete("/{reward_id}", status_code=204)
def delete_reward(
    reward_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    reward = db.query(RewardCatalog).filter(
        RewardCatalog.id == reward_id, RewardCatalog.merchant_id == merchant_id
    ).first()
    if not reward:
        raise HTTPException(404, "Reward not found")
    db.delete(reward)
    db.commit()


@rewards_router.post("/{reward_id}/claim", response_model=RewardClaimOut)
def claim_reward(
    reward_id: str,
    member_id: str = Query(...),
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    reward = db.query(RewardCatalog).filter(
        RewardCatalog.id == reward_id, RewardCatalog.merchant_id == merchant_id
    ).first()
    if not reward or not reward.is_active:
        raise HTTPException(404, "Reward not found or inactive")

    member = db.query(Member).filter(Member.id == member_id, Member.merchant_id == merchant_id).first()
    if not member:
        raise HTTPException(404, "Member not found")

    if float(member.loyalty_points or 0) < float(reward.points_cost):
        raise HTTPException(400, f"Insufficient points. Need {reward.points_cost}, have {member.loyalty_points}")

    if reward.quantity_available is not None and reward.quantity_available <= 0:
        raise HTTPException(400, "Reward is out of stock")

    # Deduct points
    member.loyalty_points = Decimal(str(member.loyalty_points or 0)) - reward.points_cost

    # Decrement stock
    if reward.quantity_available is not None:
        reward.quantity_available -= 1

    # Log loyalty transaction
    txn = LoyaltyTransaction(
        merchant_id=merchant_id,
        member_id=member_id,
        type="redeem",
        points=-reward.points_cost,
        description=f"Reward claimed: {reward.name}",
        balance_after=member.loyalty_points,
    )
    db.add(txn)

    claim = RewardClaim(
        reward_id=reward_id,
        member_id=member_id,
        merchant_id=merchant_id,
        points_spent=reward.points_cost,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


@rewards_router.get("/claims", response_model=List[RewardClaimOut])
def list_claims(
    member_id: Optional[str] = Query(default=None),
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    q = db.query(RewardClaim).filter(RewardClaim.merchant_id == merchant_id)
    if member_id:
        q = q.filter(RewardClaim.member_id == member_id)
    return q.order_by(RewardClaim.created_at.desc()).all()


# ── Coupon Codes Router ────────────────────────────────────────────────────────
coupons_router = APIRouter(prefix="/coupons", tags=["coupons"])


@coupons_router.get("", response_model=List[CouponCodeOut])
def list_coupons(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    return db.query(CouponCode).filter(CouponCode.merchant_id == merchant_id).order_by(CouponCode.created_at.desc()).all()


@coupons_router.post("", response_model=CouponCodeOut, status_code=201)
def create_coupon(
    payload: CouponCodeCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    # Check uniqueness
    existing = db.query(CouponCode).filter(
        CouponCode.merchant_id == merchant_id,
        CouponCode.code == payload.code.upper()
    ).first()
    if existing:
        raise HTTPException(409, "Coupon code already exists")
    coupon = CouponCode(merchant_id=merchant_id, **{**payload.model_dump(), "code": payload.code.upper()})
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


@coupons_router.patch("/{coupon_id}", response_model=CouponCodeOut)
def update_coupon(
    coupon_id: str,
    payload: CouponCodeUpdate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    coupon = db.query(CouponCode).filter(
        CouponCode.id == coupon_id, CouponCode.merchant_id == merchant_id
    ).first()
    if not coupon:
        raise HTTPException(404, "Coupon not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(coupon, k, v)
    db.commit()
    db.refresh(coupon)
    return coupon


@coupons_router.delete("/{coupon_id}", status_code=204)
def delete_coupon(
    coupon_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    coupon = db.query(CouponCode).filter(
        CouponCode.id == coupon_id, CouponCode.merchant_id == merchant_id
    ).first()
    if not coupon:
        raise HTTPException(404, "Coupon not found")
    db.delete(coupon)
    db.commit()


@coupons_router.post("/validate", response_model=CouponValidateOut)
def validate_coupon(
    payload: CouponValidateRequest,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    coupon = db.query(CouponCode).filter(
        CouponCode.merchant_id == merchant_id,
        CouponCode.code == payload.code.upper(),
        CouponCode.is_active == True,
    ).first()
    if not coupon:
        return CouponValidateOut(valid=False, message="Coupon not found or inactive")

    today = date.today()
    if coupon.expires_at and coupon.expires_at < today:
        return CouponValidateOut(valid=False, message="Coupon has expired")

    if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
        return CouponValidateOut(valid=False, message="Coupon usage limit reached")

    if float(payload.purchase_amount) < float(coupon.min_purchase):
        return CouponValidateOut(valid=False, message=f"Minimum purchase ₹{coupon.min_purchase} required")

    if coupon.discount_type == "flat":
        discount = min(coupon.value, payload.purchase_amount)
    else:
        discount = (payload.purchase_amount * coupon.value / 100).quantize(Decimal("0.01"))

    # Increment usage count
    coupon.used_count += 1
    db.commit()

    return CouponValidateOut(
        valid=True,
        coupon_id=coupon.id,
        discount_type=coupon.discount_type,
        value=coupon.value,
        discount_amount=discount,
        message=f"Coupon applied! You save ₹{discount}",
    )


# ── Gift Vouchers Router ───────────────────────────────────────────────────────
vouchers_router = APIRouter(prefix="/vouchers", tags=["vouchers"])

_VOUCHER_CHARS = string.ascii_uppercase + string.digits


def _generate_voucher_code(db: Session) -> str:
    for _ in range(20):
        code = "".join(random.choices(_VOUCHER_CHARS, k=12))
        if not db.query(GiftVoucher).filter(GiftVoucher.code == code).first():
            return code
    raise RuntimeError("Could not generate unique voucher code")


@vouchers_router.get("", response_model=List[GiftVoucherOut])
def list_vouchers(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    return db.query(GiftVoucher).filter(GiftVoucher.merchant_id == merchant_id).order_by(GiftVoucher.created_at.desc()).all()


@vouchers_router.post("/generate", response_model=List[GiftVoucherOut], status_code=201)
def generate_vouchers(
    payload: GiftVoucherCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    qty = min(payload.quantity, 100)  # cap at 100
    vouchers = []
    for _ in range(qty):
        v = GiftVoucher(
            merchant_id=merchant_id,
            code=_generate_voucher_code(db),
            value=payload.value,
            expires_at=payload.expires_at,
        )
        db.add(v)
        vouchers.append(v)
    db.commit()
    for v in vouchers:
        db.refresh(v)
    return vouchers


@vouchers_router.post("/redeem", response_model=GiftVoucherOut)
def redeem_voucher(
    payload: GiftVoucherRedeemRequest,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    voucher = db.query(GiftVoucher).filter(
        GiftVoucher.merchant_id == merchant_id,
        GiftVoucher.code == payload.code.upper(),
    ).first()
    if not voucher:
        raise HTTPException(404, "Voucher not found")
    if voucher.is_redeemed:
        raise HTTPException(400, "Voucher has already been redeemed")
    if voucher.expires_at and voucher.expires_at < date.today():
        raise HTTPException(400, "Voucher has expired")

    member = db.query(Member).filter(Member.id == payload.member_id, Member.merchant_id == merchant_id).first()
    if not member:
        raise HTTPException(404, "Member not found")

    voucher.is_redeemed = True
    voucher.redeemed_by_member_id = member.id
    voucher.redeemed_at = datetime.now(timezone.utc)

    # Credit points equivalent to voucher value to member
    member.loyalty_points = Decimal(str(member.loyalty_points or 0)) + voucher.value
    txn = LoyaltyTransaction(
        merchant_id=merchant_id,
        member_id=member.id,
        type="earn",
        points=voucher.value,
        description=f"Gift voucher redeemed: {voucher.code}",
        balance_after=member.loyalty_points,
    )
    db.add(txn)
    db.commit()
    db.refresh(voucher)
    return voucher


# ── Points Rules Router ────────────────────────────────────────────────────────
points_rules_router = APIRouter(prefix="/points-rules", tags=["points-rules"])


@points_rules_router.get("", response_model=List[PointsRuleOut])
def list_points_rules(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    return db.query(PointsRule).filter(PointsRule.merchant_id == merchant_id).all()


@points_rules_router.post("", response_model=PointsRuleOut, status_code=201)
def create_points_rule(
    payload: PointsRuleCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    rule = PointsRule(merchant_id=merchant_id, **payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@points_rules_router.patch("/{rule_id}", response_model=PointsRuleOut)
def update_points_rule(
    rule_id: str,
    payload: PointsRuleUpdate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    rule = db.query(PointsRule).filter(PointsRule.id == rule_id, PointsRule.merchant_id == merchant_id).first()
    if not rule:
        raise HTTPException(404, "Rule not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return rule


@points_rules_router.delete("/{rule_id}", status_code=204)
def delete_points_rule(
    rule_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    rule = db.query(PointsRule).filter(PointsRule.id == rule_id, PointsRule.merchant_id == merchant_id).first()
    if not rule:
        raise HTTPException(404, "Rule not found")
    db.delete(rule)
    db.commit()


# ── Scratch Cards Router ───────────────────────────────────────────────────────
scratch_router = APIRouter(prefix="/scratch-cards", tags=["scratch-cards"])

_SCRATCH_REWARDS = [
    ("points", "50"),
    ("points", "100"),
    ("points", "25"),
    ("points", "200"),
    ("gift", "Free hair wash"),
    ("gift", "10% discount on next visit"),
    ("points", "75"),
]


@scratch_router.get("", response_model=List[ScratchCardOut])
def list_scratch_cards(
    member_id: Optional[str] = Query(default=None),
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    q = db.query(ScratchCard).filter(ScratchCard.merchant_id == merchant_id)
    if member_id:
        q = q.filter(ScratchCard.member_id == member_id)
    return q.order_by(ScratchCard.created_at.desc()).all()


@scratch_router.post("/issue", response_model=ScratchCardOut, status_code=201)
def issue_scratch_card(
    member_id: str = Query(...),
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    member = db.query(Member).filter(Member.id == member_id, Member.merchant_id == merchant_id).first()
    if not member:
        raise HTTPException(404, "Member not found")

    reward_type, reward_value = random.choice(_SCRATCH_REWARDS)
    card = ScratchCard(
        merchant_id=merchant_id,
        member_id=member_id,
        reward_type=reward_type,
        reward_value=reward_value,
        trigger_visit=member.total_visits or 0,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@scratch_router.post("/{card_id}/reveal", response_model=ScratchCardOut)
def reveal_scratch_card(
    card_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    card = db.query(ScratchCard).filter(
        ScratchCard.id == card_id, ScratchCard.merchant_id == merchant_id
    ).first()
    if not card:
        raise HTTPException(404, "Scratch card not found")
    if card.is_revealed:
        raise HTTPException(400, "Card already revealed")

    card.is_revealed = True
    card.revealed_at = datetime.now(timezone.utc)

    # If reward is points, credit them
    if card.reward_type == "points":
        try:
            pts = Decimal(card.reward_value)
            member = db.query(Member).filter(Member.id == card.member_id).first()
            if member:
                member.loyalty_points = Decimal(str(member.loyalty_points or 0)) + pts
                txn = LoyaltyTransaction(
                    merchant_id=merchant_id,
                    member_id=member.id,
                    type="earn",
                    points=pts,
                    description=f"Scratch card reward: {pts} points",
                    balance_after=member.loyalty_points,
                )
                db.add(txn)
        except Exception:
            pass

    db.commit()
    db.refresh(card)
    return card


# ── Lucky Draw Router ──────────────────────────────────────────────────────────
lucky_draw_router = APIRouter(prefix="/lucky-draws", tags=["lucky-draws"])


@lucky_draw_router.get("", response_model=List[LuckyDrawOut])
def list_lucky_draws(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    draws = db.query(LuckyDraw).filter(LuckyDraw.merchant_id == merchant_id).order_by(LuckyDraw.draw_date.desc()).all()
    for draw in draws:
        draw.entry_count = db.query(LuckyDrawEntry).filter(LuckyDrawEntry.draw_id == draw.id).count()
    return draws


@lucky_draw_router.post("", response_model=LuckyDrawOut, status_code=201)
def create_lucky_draw(
    payload: LuckyDrawCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    draw = LuckyDraw(merchant_id=merchant_id, **payload.model_dump())
    db.add(draw)
    db.commit()
    db.refresh(draw)
    draw.entry_count = 0
    return draw


@lucky_draw_router.patch("/{draw_id}", response_model=LuckyDrawOut)
def update_lucky_draw(
    draw_id: str,
    payload: LuckyDrawUpdate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    draw = db.query(LuckyDraw).filter(LuckyDraw.id == draw_id, LuckyDraw.merchant_id == merchant_id).first()
    if not draw:
        raise HTTPException(404, "Lucky draw not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(draw, k, v)
    db.commit()
    db.refresh(draw)
    draw.entry_count = db.query(LuckyDrawEntry).filter(LuckyDrawEntry.draw_id == draw_id).count()
    return draw


@lucky_draw_router.post("/{draw_id}/enter")
def enter_lucky_draw(
    draw_id: str,
    member_id: str = Query(...),
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    draw = db.query(LuckyDraw).filter(LuckyDraw.id == draw_id, LuckyDraw.merchant_id == merchant_id).first()
    if not draw or draw.status != "open":
        raise HTTPException(400, "Draw is not open for entries")

    member = db.query(Member).filter(Member.id == member_id, Member.merchant_id == merchant_id).first()
    if not member:
        raise HTTPException(404, "Member not found")

    # Check eligibility
    if float(member.loyalty_points or 0) < float(draw.min_points):
        raise HTTPException(400, f"Member needs at least {draw.min_points} points to enter")
    if (member.total_visits or 0) < draw.min_visits:
        raise HTTPException(400, f"Member needs at least {draw.min_visits} visits to enter")

    # Check duplicate
    existing = db.query(LuckyDrawEntry).filter(
        LuckyDrawEntry.draw_id == draw_id, LuckyDrawEntry.member_id == member_id
    ).first()
    if existing:
        raise HTTPException(409, "Member already entered this draw")

    entry = LuckyDrawEntry(draw_id=draw_id, member_id=member_id)
    db.add(entry)
    db.commit()
    return {"message": "Entered successfully"}


@lucky_draw_router.post("/{draw_id}/run")
def run_lucky_draw(
    draw_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    draw = db.query(LuckyDraw).filter(LuckyDraw.id == draw_id, LuckyDraw.merchant_id == merchant_id).first()
    if not draw:
        raise HTTPException(404, "Draw not found")
    if draw.status == "drawn":
        raise HTTPException(400, "Draw already completed")

    entries = db.query(LuckyDrawEntry).filter(LuckyDrawEntry.draw_id == draw_id).all()
    if not entries:
        raise HTTPException(400, "No entries in this draw")

    winner_entry = random.choice(entries)
    draw.winner_member_id = winner_entry.member_id
    draw.status = "drawn"
    db.commit()

    winner = db.query(Member).filter(Member.id == winner_entry.member_id).first()
    return {
        "winner_member_id": winner_entry.member_id,
        "winner_name": winner.name if winner else "Unknown",
        "prize": draw.prize,
    }


@lucky_draw_router.delete("/{draw_id}", status_code=204)
def delete_lucky_draw(
    draw_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    draw = db.query(LuckyDraw).filter(LuckyDraw.id == draw_id, LuckyDraw.merchant_id == merchant_id).first()
    if not draw:
        raise HTTPException(404, "Draw not found")
    db.delete(draw)
    db.commit()


# ── Public Feedback Router ────────────────────────────────────────────────────
feedback_router = APIRouter(prefix="/public/feedback", tags=["feedback"])


@feedback_router.post("", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    payload: FeedbackCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    public_rate_limit(request)
    member = db.query(Member).filter(Member.id == payload.member_id).first()
    if not member:
        raise HTTPException(404, "Member not found")

    feedback = MemberFeedback(
        member_id=payload.member_id,
        merchant_id=member.merchant_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@feedback_router.get("/merchant", response_model=List[FeedbackOut])
def get_merchant_feedback(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    return db.query(MemberFeedback).filter(
        MemberFeedback.merchant_id == merchant_id
    ).order_by(MemberFeedback.created_at.desc()).limit(100).all()
