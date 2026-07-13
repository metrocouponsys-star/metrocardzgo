"""Redemptions router — atomic offer redemption with race-condition safety.
Feature 1: Loyalty points earn on redemption + points redemption endpoint.
Both earn and redeem are atomic with the triggering redemption_log entry.
"""
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import select, update, func

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.models.member import Member, MemberOfferState
from app.models.redemption import RedemptionLog
from app.models.loyalty import LoyaltyTransaction
from app.schemas import RedeemRequest, RedemptionOut, LoyaltyTransactionOut
from typing import List

router = APIRouter(prefix="/redemptions", tags=["redemptions"])


@router.post("", response_model=RedemptionOut, status_code=status.HTTP_201_CREATED)
def redeem_offer(
    payload: RedeemRequest,
    request: Request,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Atomically redeem an offer for a member.
    Uses SELECT ... FOR UPDATE to prevent race conditions — two simultaneous
    redemptions of the same "last" offer cannot both succeed.

    Feature 1: If the offer has loyalty_points_earn set, the points earn is
    written in the SAME transaction as the redemption_log entry — never updated
    separately. A loyalty_transactions row is inserted as the audit trail.
    """
    # Step 1: Validate member belongs to this merchant (tenant isolation)
    member = (
        db.query(Member)
        .filter(Member.id == payload.member_id, Member.merchant_id == merchant_id)
        .with_for_update()  # Lock member row to prevent concurrent loyalty_points update
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Step 2: Validate member is active and not expired
    if member.status == "expired":
        raise HTTPException(status_code=400, detail="Membership is expired")
    if member.status == "deactivated":
        raise HTTPException(status_code=400, detail="Member is deactivated")
    if member.expiry_date < date.today():
        raise HTTPException(status_code=400, detail="Membership has expired")

    # Step 3: Lock the offer state row for atomic update (prevents race conditions)
    offer_state = (
        db.query(MemberOfferState)
        .filter(
            MemberOfferState.id == payload.offer_state_id,
            MemberOfferState.member_id == payload.member_id,
        )
        .with_for_update()  # SELECT ... FOR UPDATE (row-level lock)
        .first()
    )
    if not offer_state:
        raise HTTPException(status_code=404, detail="Offer state not found")
    if offer_state.status == "exhausted":
        raise HTTPException(status_code=400, detail="Offer already fully used")
    if offer_state.remaining_qty is not None and offer_state.remaining_qty <= 0:
        raise HTTPException(status_code=400, detail="Offer fully redeemed")

    # Reject direct redemption of points_redemption offers through this endpoint
    offer_template = offer_state.offer_template
    if offer_template and offer_template.offer_type == "points_redemption":
        raise HTTPException(
            status_code=400,
            detail="Use the /redemptions/redeem-points endpoint for points redemption offers"
        )

    # Step 4: Decrement quantity atomically
    if offer_state.remaining_qty is not None:
        offer_state.remaining_qty -= 1
        if offer_state.remaining_qty == 0:
            offer_state.status = "exhausted"

    # Step 5: Write the redemption log row (same transaction)
    client_ip = request.client.host if request.client else None
    redemption = RedemptionLog(
        member_id=member.id,
        offer_template_id=offer_state.offer_template_id,
        merchant_user_id=current_user.id,
        amount=0,
        ip_address=client_ip,
    )
    db.add(redemption)
    db.flush()  # flush to get redemption.id before using it in loyalty_transaction

    # Step 6: Feature 1 — Loyalty points earn (same transaction, not a separate call)
    if offer_template and offer_template.loyalty_points_earn:
        points_earned = Decimal(str(offer_template.loyalty_points_earn))
        new_balance = (member.loyalty_points or Decimal("0")) + points_earned
        member.loyalty_points = new_balance

        loyalty_tx = LoyaltyTransaction(
            member_id=member.id,
            merchant_id=merchant_id,
            type="earn",
            points=points_earned,
            source_redemption_id=redemption.id,
            source_offer_id=offer_template.id,
            balance_after=new_balance,
        )
        db.add(loyalty_tx)

    # Step 7: Increment visit counter (every redemption = 1 visit)
    member.total_visits = (member.total_visits or 0) + 1

    # Step 8: Check if any visit-milestone offers just unlocked
    # If an offer has min_visits set and the member just hit that threshold,
    # create a MemberOfferState for it (if not already present)
    from app.models.offer import OfferTemplate as OT
    from app.models.member import MembershipTypeOffer
    visit_milestone_offers = db.query(OT).filter(
        OT.merchant_id == merchant_id,
        OT.active == True,
        OT.min_visits == member.total_visits,  # exactly hit the threshold this visit
    ).all()
    for vmo in visit_milestone_offers:
        already_has = db.query(MemberOfferState).filter(
            MemberOfferState.member_id == member.id,
            MemberOfferState.offer_template_id == vmo.id,
        ).first()
        if not already_has:
            new_state = MemberOfferState(
                member_id=member.id,
                offer_template_id=vmo.id,
                remaining_qty=1,
                initial_qty=1,
                status="active",
            )
            db.add(new_state)

    db.commit()  # Single commit for decrement, redemption log, loyalty earn, visit++, milestones — atomic

    db.refresh(redemption)

    # Enrich the response
    staff_name = current_user.name
    member_info = {"name": member.name, "member_code": member.member_code}
    offer_info = None
    if offer_template:
        offer_info = {
            "title": offer_template.title,
            "offer_type": offer_template.offer_type,
        }

    return RedemptionOut(
        id=redemption.id,
        member_id=redemption.member_id,
        offer_template_id=redemption.offer_template_id,
        merchant_user_id=redemption.merchant_user_id,
        staff_name=staff_name,
        amount=redemption.amount,
        created_at=redemption.created_at,
        member=member_info,
        offer=offer_info,
    )


@router.post("/redeem-points", response_model=RedemptionOut, status_code=status.HTTP_201_CREATED)
def redeem_points(
    payload: RedeemRequest,
    request: Request,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Feature 1: Atomically redeem loyalty points for a points_redemption offer.

    Flow (all in one transaction):
      1. validate sufficient balance (SELECT FOR UPDATE on member row)
      2. deduct loyalty_points from member
      3. insert redemption_log row
      4. insert loyalty_transactions row (type='redeem', negative points)
    """
    # Lock member row to prevent concurrent redemptions overdrawing balance
    member = (
        db.query(Member)
        .filter(Member.id == payload.member_id, Member.merchant_id == merchant_id)
        .with_for_update()
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.status in ("expired", "deactivated"):
        raise HTTPException(status_code=400, detail=f"Member is {member.status}")
    if member.expiry_date < date.today():
        raise HTTPException(status_code=400, detail="Membership has expired")

    offer_state = (
        db.query(MemberOfferState)
        .filter(
            MemberOfferState.id == payload.offer_state_id,
            MemberOfferState.member_id == payload.member_id,
        )
        .with_for_update()
        .first()
    )
    if not offer_state:
        raise HTTPException(status_code=404, detail="Offer state not found")
    if offer_state.status == "exhausted":
        raise HTTPException(status_code=400, detail="Offer already fully used")

    offer_template = offer_state.offer_template
    if not offer_template or offer_template.offer_type != "points_redemption":
        raise HTTPException(status_code=400, detail="This offer is not a points redemption reward")

    points_cost = Decimal(str(offer_template.loyalty_points_cost or 0))
    if points_cost <= 0:
        raise HTTPException(status_code=400, detail="Invalid points cost on offer")

    current_balance = member.loyalty_points or Decimal("0")
    if current_balance < points_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient loyalty points. Required: {points_cost}, Available: {current_balance}"
        )

    # Deduct points and decrement offer state
    new_balance = current_balance - points_cost
    member.loyalty_points = new_balance

    if offer_state.remaining_qty is not None:
        offer_state.remaining_qty -= 1
        if offer_state.remaining_qty == 0:
            offer_state.status = "exhausted"

    client_ip = request.client.host if request.client else None
    redemption = RedemptionLog(
        member_id=member.id,
        offer_template_id=offer_state.offer_template_id,
        merchant_user_id=current_user.id,
        amount=0,
        ip_address=client_ip,
    )
    db.add(redemption)
    db.flush()

    loyalty_tx = LoyaltyTransaction(
        member_id=member.id,
        merchant_id=merchant_id,
        type="redeem",
        points=-points_cost,           # negative — points were spent
        source_redemption_id=redemption.id,
        source_offer_id=offer_template.id,
        balance_after=new_balance,
    )
    db.add(loyalty_tx)

    db.commit()  # Single atomic commit — deduct + log + audit trail
    db.refresh(redemption)

    return RedemptionOut(
        id=redemption.id,
        member_id=redemption.member_id,
        offer_template_id=redemption.offer_template_id,
        merchant_user_id=redemption.merchant_user_id,
        staff_name=current_user.name,
        amount=redemption.amount,
        created_at=redemption.created_at,
        member={"name": member.name, "member_code": member.member_code},
        offer={"title": offer_template.title, "offer_type": offer_template.offer_type},
    )


@router.get("/member/{member_id}", response_model=List[RedemptionOut])
def get_member_redemptions(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    # First verify the member belongs to this merchant (tenant isolation)
    member = db.query(Member).filter(
        Member.id == member_id, Member.merchant_id == merchant_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    redemptions = (
        db.query(RedemptionLog)
        .filter(RedemptionLog.member_id == member_id)
        .order_by(RedemptionLog.created_at.desc())
        .limit(50)
        .all()
    )
    results = []
    for r in redemptions:
        results.append(RedemptionOut(
            id=r.id,
            member_id=r.member_id,
            offer_template_id=r.offer_template_id,
            merchant_user_id=r.merchant_user_id,
            staff_name=r.staff_user.name if r.staff_user else None,
            amount=r.amount,
            created_at=r.created_at,
            member={"name": member.name, "member_code": member.member_code},
            offer={"title": r.offer_template.title, "offer_type": r.offer_template.offer_type} if r.offer_template else None,
        ))
    return results


@router.get("/member/{member_id}/loyalty-history", response_model=List[LoyaltyTransactionOut])
def get_member_loyalty_history(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Feature 1: Return the full loyalty points history for a member."""
    member = db.query(Member).filter(
        Member.id == member_id, Member.merchant_id == merchant_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    txs = (
        db.query(LoyaltyTransaction)
        .filter(
            LoyaltyTransaction.member_id == member_id,
            LoyaltyTransaction.merchant_id == merchant_id,
        )
        .order_by(LoyaltyTransaction.created_at.desc())
        .limit(100)
        .all()
    )
    results = []
    for tx in txs:
        offer_title = None
        if tx.source_offer:
            offer_title = tx.source_offer.title
        results.append(LoyaltyTransactionOut(
            id=tx.id,
            member_id=tx.member_id,
            merchant_id=tx.merchant_id,
            type=tx.type,
            points=tx.points,
            source_redemption_id=tx.source_redemption_id,
            source_offer_id=tx.source_offer_id,
            source_offer_title=offer_title,
            balance_after=tx.balance_after,
            created_at=tx.created_at,
        ))
    return results
