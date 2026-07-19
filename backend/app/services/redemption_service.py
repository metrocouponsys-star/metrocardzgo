"""Redemption service — orchestrates atomic offer redemption and points redemption.
"""
from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.models.member import Member, MemberOfferState
from app.models.redemption import RedemptionLog
from app.models.rewards import PointsRule
from app.services.loyalty_service import (
    validate_member_active,
    validate_offer_state,
    validate_points_redemption,
    calculate_offer_earn_points,
    calculate_rule_points,
    credit_points,
    unlock_visit_milestones,
)
from app.services.event_service import emit, OFFER_REDEEMED, POINTS_EARNED, POINTS_REDEEMED
from app.services.exceptions import ServiceError


def redeem_offer_atomic(
    db: Session,
    member_id: str,
    offer_state_id: str,
    merchant_id: str,
    actor_id: str,
    client_ip: Optional[str],
    amount: Optional[Decimal],
) -> RedemptionLog:
    """
    Atomically redeem an offer for a member.
    All DB writes happen in the caller's transaction — caller must db.commit().
    """
    # ── Lock rows (SELECT FOR UPDATE) ──
    member = (
        db.query(Member)
        .filter(Member.id == member_id, Member.merchant_id == merchant_id)
        .with_for_update()
        .first()
    )
    if not member:
        raise ServiceError("Member not found", code="MEMBER_NOT_FOUND", status_hint=404)

    validate_member_active(member)

    offer_state = (
        db.query(MemberOfferState)
        .filter(
            MemberOfferState.id == offer_state_id,
            MemberOfferState.member_id == member_id,
        )
        .with_for_update()
        .first()
    )
    if not offer_state:
        raise ServiceError("Offer state not found", code="OFFER_STATE_NOT_FOUND", status_hint=404)

    validate_offer_state(offer_state)

    offer_template = offer_state.offer_template
    if offer_template and offer_template.offer_type == "points_redemption":
        raise ServiceError(
            "Use the /redemptions/redeem-points endpoint for points redemption offers.",
            code="WRONG_ENDPOINT",
            status_hint=400,
        )

    # ── Decrement offer state ──
    if offer_state.remaining_qty is not None:
        offer_state.remaining_qty -= 1
        if offer_state.remaining_qty == 0:
            offer_state.status = "exhausted"

    # ── Write redemption log row ──
    redemption = RedemptionLog(
        member_id=member.id,
        offer_template_id=offer_state.offer_template_id,
        merchant_user_id=actor_id,
        amount=amount or Decimal("0"),
        ip_address=client_ip,
    )
    db.add(redemption)
    db.flush()  # get redemption.id

    # ── Offer-level earn points ──
    earn_pts = calculate_offer_earn_points(offer_template)
    if earn_pts > 0:
        credit_points(
            db, member, merchant_id,
            points=earn_pts,
            redemption_id=redemption.id,
            offer_id=offer_template.id if offer_template else None,
            note=f"Earned from offer: {offer_template.title}" if offer_template else None,
        )
        emit(db, merchant_id, POINTS_EARNED, {
            "points": float(earn_pts),
            "source": "offer",
            "offer_id": offer_template.id if offer_template else None,
            "redemption_id": redemption.id,
        }, member_id=member.id, actor_id=actor_id)

    # ── Merchant-level PointsRules ──
    active_rules = db.query(PointsRule).filter(
        PointsRule.merchant_id == merchant_id,
        PointsRule.is_active == True,
    ).all()
    for rule, pts, note in calculate_rule_points(active_rules, amount):
        credit_points(
            db, member, merchant_id,
            points=pts,
            redemption_id=redemption.id,
            offer_id=None,
            note=note,
        )
        emit(db, merchant_id, POINTS_EARNED, {
            "points": float(pts),
            "source": "points_rule",
            "rule_type": rule.rule_type,
            "redemption_id": redemption.id,
        }, member_id=member.id, actor_id=actor_id)

    # ── Increment visits ──
    member.total_visits = (member.total_visits or 0) + 1

    # ── Unlock visit milestones ──
    unlock_visit_milestones(db, member, merchant_id)

    # ── Event: offer redeemed ──
    emit(db, merchant_id, OFFER_REDEEMED, {
        "redemption_id": redemption.id,
        "offer_template_id": redemption.offer_template_id,
        "offer_title": offer_template.title if offer_template else None,
        "offer_type": offer_template.offer_type if offer_template else None,
        "amount": float(amount or 0),
        "member_code": member.member_code,
        "total_visits": member.total_visits,
    }, member_id=member.id, actor_id=actor_id)

    return redemption


def redeem_points_atomic(
    db: Session,
    member_id: str,
    offer_state_id: str,
    merchant_id: str,
    actor_id: str,
    client_ip: Optional[str],
    amount: Optional[Decimal],
) -> RedemptionLog:
    """
    Atomically redeem loyalty points for a points_redemption offer.
    Caller must db.commit() after this returns.
    """
    # ── Lock member row ──
    member = (
        db.query(Member)
        .filter(Member.id == member_id, Member.merchant_id == merchant_id)
        .with_for_update()
        .first()
    )
    if not member:
        raise ServiceError("Member not found", code="MEMBER_NOT_FOUND", status_hint=404)

    validate_member_active(member)

    offer_state = (
        db.query(MemberOfferState)
        .filter(
            MemberOfferState.id == offer_state_id,
            MemberOfferState.member_id == member_id,
        )
        .with_for_update()
        .first()
    )
    if not offer_state:
        raise ServiceError("Offer state not found", code="OFFER_STATE_NOT_FOUND", status_hint=404)

    validate_offer_state(offer_state)

    offer_template = offer_state.offer_template
    points_cost = validate_points_redemption(member, offer_template)

    # ── Deduct points ──
    new_balance = (member.loyalty_points or Decimal("0")) - points_cost
    member.loyalty_points = new_balance

    if offer_state.remaining_qty is not None:
        offer_state.remaining_qty -= 1
        if offer_state.remaining_qty == 0:
            offer_state.status = "exhausted"

    # ── Write redemption log row ──
    redemption = RedemptionLog(
        member_id=member.id,
        offer_template_id=offer_state.offer_template_id,
        merchant_user_id=actor_id,
        amount=amount or Decimal("0"),
        ip_address=client_ip,
    )
    db.add(redemption)
    db.flush()

    # ── Loyalty debit transaction ──
    from app.models.loyalty import LoyaltyTransaction
    db.add(LoyaltyTransaction(
        member_id=member.id,
        merchant_id=merchant_id,
        type="redeem",
        points=-points_cost,
        source_redemption_id=redemption.id,
        source_offer_id=offer_template.id,
        balance_after=new_balance,
        note=f"Points redeemed for: {offer_template.title}",
    ))

    # ── Event: points redeemed ──
    emit(db, merchant_id, POINTS_REDEEMED, {
        "redemption_id": redemption.id,
        "offer_id": offer_template.id,
        "offer_title": offer_template.title,
        "points_cost": float(points_cost),
        "balance_after": float(new_balance),
        "member_code": member.member_code,
    }, member_id=member.id, actor_id=actor_id)

    emit(db, merchant_id, OFFER_REDEEMED, {
        "redemption_id": redemption.id,
        "offer_template_id": redemption.offer_template_id,
        "offer_title": offer_template.title,
        "offer_type": "points_redemption",
        "amount": float(amount or 0),
        "member_code": member.member_code,
    }, member_id=member.id, actor_id=actor_id)

    return redemption
