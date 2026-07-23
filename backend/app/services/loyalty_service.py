"""Loyalty service — all points calculation and validation logic.

All functions accept plain Python types (not FastAPI Request objects).
They raise ServiceError for business rule violations.
"""
from datetime import date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.member import Member, MemberOfferState
from app.models.offer import OfferTemplate
from app.models.loyalty import LoyaltyTransaction
from app.models.rewards import PointsRule
from app.services.exceptions import ServiceError


# ── Member Validation ─────────────────────────────────────────────────────────

def validate_member_active(member: Member) -> None:
    """Raise ServiceError if the member cannot transact."""
    if member.status == "expired" or member.expiry_date < date.today():
        raise ServiceError(
            "Membership has expired. Please renew to continue redeeming offers.",
            code="MEMBERSHIP_EXPIRED",
            status_hint=400,
        )
    if member.status == "deactivated":
        raise ServiceError(
            "Member account is deactivated.",
            code="MEMBER_DEACTIVATED",
            status_hint=400,
        )


def validate_offer_state(offer_state: MemberOfferState) -> None:
    """Raise ServiceError if the offer state is not redeemable."""
    if offer_state.status == "exhausted":
        raise ServiceError(
            "This offer has already been fully used.",
            code="OFFER_EXHAUSTED",
            status_hint=400,
        )
    if offer_state.remaining_qty is not None and offer_state.remaining_qty <= 0:
        raise ServiceError(
            "No remaining uses on this offer.",
            code="OFFER_EXHAUSTED",
            status_hint=400,
        )


# ── Points Calculation ────────────────────────────────────────────────────────

def calculate_offer_earn_points(offer_template: Optional[OfferTemplate]) -> Decimal:
    """Return the loyalty points to credit from an offer's earn setting."""
    if not offer_template or not offer_template.loyalty_points_earn:
        return Decimal("0")
    return Decimal(str(offer_template.loyalty_points_earn))


def calculate_rule_points(
    rules: List[PointsRule],
    amount: Optional[Decimal],
) -> List[tuple]:
    """
    Calculate points earned from merchant-level PointsRules.

    Returns a list of (rule, points_value) tuples where points_value > 0.
    Callers iterate this to create LoyaltyTransaction rows.
    """
    results = []
    for rule in rules:
        if not rule.is_active:
            continue
        if rule.rule_type == "per_visit":
            pts = Decimal(str(rule.points_value))
            note = f"Points rule: {pts} pts per visit"
            results.append((rule, pts, note))
        elif rule.rule_type == "per_rupee" and amount and amount > 0:
            unit = Decimal(str(rule.spend_unit or 1))
            pts = (Decimal(str(rule.points_value)) * (Decimal(str(amount)) / unit)).quantize(Decimal("1"))
            note = f"Points rule: {rule.points_value} pts/₹{unit} × ₹{amount}"
            if pts > 0:
                results.append((rule, pts, note))
    return results


def validate_points_redemption(
    member: Member,
    offer_template: OfferTemplate,
) -> Decimal:
    """
    Validate a points redemption offer and return the points cost.
    Raises ServiceError if insufficient balance or invalid offer.
    """
    if not offer_template or offer_template.offer_type != "points_redemption":
        raise ServiceError(
            "This offer is not a points redemption reward.",
            code="WRONG_OFFER_TYPE",
            status_hint=400,
        )
    points_cost = Decimal(str(offer_template.loyalty_points_cost or 0))
    if points_cost <= 0:
        raise ServiceError(
            "Invalid points cost configured on this offer.",
            code="INVALID_POINTS_COST",
            status_hint=500,
        )
    current_balance = member.loyalty_points or Decimal("0")
    if current_balance < points_cost:
        raise ServiceError(
            f"Insufficient loyalty points. Required: {points_cost}, Available: {current_balance}",
            code="INSUFFICIENT_POINTS",
            status_hint=400,
        )
    return points_cost


# ── Points Ledger Writes ──────────────────────────────────────────────────────

def credit_points(
    db: Session,
    member: Member,
    merchant_id: str,
    points: Decimal,
    redemption_id: Optional[str],
    offer_id: Optional[str],
    note: Optional[str] = None,
    tx_type: str = "earn",
) -> LoyaltyTransaction:
    """
    Credit (or debit) loyalty points to a member and write the audit row.
    MUST be called before db.commit() — caller owns the transaction.
    """
    member.loyalty_points = (member.loyalty_points or Decimal("0")) + points
    tx = LoyaltyTransaction(
        member_id=member.id,
        merchant_id=merchant_id,
        type=tx_type,
        points=points,
        source_redemption_id=redemption_id,
        source_offer_id=offer_id,
        balance_after=member.loyalty_points,
        note=note,
    )
    db.add(tx)
    return tx


# ── Visit Milestone Unlocking ─────────────────────────────────────────────────

def unlock_visit_milestones(
    db: Session,
    member: Member,
    merchant_id: str,
) -> None:
    """
    Check if the member's current total_visits unlocks any visit-milestone offers.
    Creates MemberOfferState rows for newly unlocked offers.
    Must be called AFTER member.total_visits has been incremented.
    """
    from app.models.offer import OfferTemplate as OT
    from app.models.member import MemberOfferState

    milestone_offers = db.query(OT).filter(
        OT.merchant_id == merchant_id,
        OT.active == True,
        OT.min_visits == member.total_visits,
    ).all()

    for offer in milestone_offers:
        already_has = db.query(MemberOfferState).filter(
            MemberOfferState.member_id == member.id,
            MemberOfferState.offer_template_id == offer.id,
        ).first()
        if not already_has:
            db.add(MemberOfferState(
                member_id=member.id,
                offer_template_id=offer.id,
                remaining_qty=1,
                initial_qty=1,
                status="active",
            ))

    # ── Auto-issue Scratch Card on visits ──────────────────────────────────────
    # Issue a scratch card automatically every 3rd visit (visit 3, 6, 9...)
    if member.total_visits > 0 and member.total_visits % 3 == 0:
        import random
        from app.models.rewards import ScratchCard
        _SCRATCH_REWARDS = [
            ("points", "50"),
            ("points", "100"),
            ("points", "25"),
            ("points", "200"),
            ("gift", "Free hair wash"),
            ("gift", "10% discount on next visit"),
            ("points", "75"),
        ]
        reward_type, reward_value = random.choice(_SCRATCH_REWARDS)
        card = ScratchCard(
            merchant_id=merchant_id,
            member_id=member.id,
            reward_type=reward_type,
            reward_value=reward_value,
            trigger_visit=member.total_visits,
        )
        db.add(card)
