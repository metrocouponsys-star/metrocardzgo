"""Members router — CRUD, search, public token lookup, referral engine."""
import uuid
import string
import random
from datetime import date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.core.security import generate_public_token
from app.models.member import Member, MembershipType, MemberOfferState, MembershipTypeOffer
from app.models.merchant import Merchant
from app.models.loyalty import LoyaltyTransaction
from app.schemas import MemberCreate, MemberUpdate, MemberOut, ApplyReferralRequest
from typing import List, Optional

router = APIRouter(prefix="/members", tags=["members"])

_REFERRAL_CHARS = string.ascii_uppercase + string.digits


def _generate_referral_code(db: Session) -> str:
    """Generate a unique 8-character alphanumeric referral code."""
    for _ in range(10):  # retry up to 10 times on collision
        code = "".join(random.choices(_REFERRAL_CHARS, k=8))
        if not db.query(Member).filter(Member.referral_code == code).first():
            return code
    raise RuntimeError("Could not generate unique referral code — retry")


@router.get("", response_model=List[MemberOut])
def list_members(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    membership_type_id: Optional[str] = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
):
    q = db.query(Member).filter(Member.merchant_id == merchant_id)
    if status_filter:
        q = q.filter(Member.status == status_filter)
    if membership_type_id:
        q = q.filter(Member.membership_type_id == membership_type_id)
    return q.order_by(Member.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/search", response_model=List[MemberOut])
def search_members(
    q: str = Query(..., min_length=1),
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Search by name, phone, member_code, public_token, or referral_code.
    Scoped to merchant with SQL ILIKE OR-chain for O(log n) with indexes.
    """
    q_stripped = q.replace(" ", "").strip()
    q_like = f"%{q_stripped}%"

    members = (
        db.query(Member)
        .filter(
            Member.merchant_id == merchant_id,
            or_(
                func.replace(func.lower(Member.name), " ", "").contains(q_stripped.lower()),
                func.replace(Member.phone, " ", "").ilike(q_like),
                Member.member_code.ilike(q_like),
                Member.public_token.ilike(q_like),
                Member.referral_code.ilike(q_like),
            )
        )
        .limit(20)
        .all()
    )
    return members


@router.get("/{member_id}", response_model=MemberOut)
def get_member(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.merchant_id == merchant_id,  # CRITICAL: tenant isolation
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member


@router.post("", response_model=MemberOut, status_code=status.HTTP_201_CREATED)
def create_member(
    payload: MemberCreate,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Duplicate phone check (scoped to merchant)
    existing = db.query(Member).filter(
        Member.merchant_id == merchant_id,
        Member.phone == payload.phone.replace(" ", ""),
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="DUPLICATE_PHONE")

    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()

    # Generate sequential member code scoped to this merchant
    count = db.query(Member).filter(Member.merchant_id == merchant_id).count()
    member_code = f"MC{str(count + 1).zfill(4)}"

    member_id_new = str(uuid.uuid4())
    public_token = generate_public_token(member_id_new, merchant.secret_salt)
    referral_code = _generate_referral_code(db)

    # Resolve referral — look up referrer by referral_code if provided
    referred_by_id = None
    if payload.referral_code:
        referrer = db.query(Member).filter(
            Member.referral_code == payload.referral_code.strip().upper()
        ).first()
        if referrer and referrer.merchant_id == merchant_id:
            referred_by_id = referrer.id
        # If code not found, silently ignore — don't fail registration

    member = Member(
        id=member_id_new,
        merchant_id=merchant_id,
        member_code=member_code,
        public_token=public_token,
        name=payload.name,
        phone=payload.phone.replace(" ", ""),
        email=payload.email,
        date_of_birth=payload.date_of_birth,
        anniversary_date=payload.anniversary_date,
        membership_type_id=payload.membership_type_id,
        joined_date=date.today(),
        expiry_date=date.today() + timedelta(days=365),
        loyalty_points=Decimal("0"),
        status="active",
        total_visits=0,
        referral_code=referral_code,
        referred_by_member_id=referred_by_id,
    )
    db.add(member)
    db.flush()  # flush to get member.id before inserting offer states

    # Auto-create MemberOfferState for each offer linked to the membership type
    offer_links = db.query(MembershipTypeOffer).filter(
        MembershipTypeOffer.membership_type_id == payload.membership_type_id
    ).all()
    for link in offer_links:
        state = MemberOfferState(
            member_id=member_id_new,
            offer_template_id=link.offer_template_id,
            remaining_qty=link.default_qty,
            initial_qty=link.default_qty,
            status="active",
        )
        db.add(state)

    # Award referral bonus to referrer (if valid referral code was supplied)
    if referred_by_id:
        referrer = db.query(Member).filter(Member.id == referred_by_id).with_for_update().first()
        bonus = Decimal(str(merchant.referral_bonus_points or 50))
        new_balance = (referrer.loyalty_points or Decimal("0")) + bonus
        referrer.loyalty_points = new_balance

        referral_tx = LoyaltyTransaction(
            member_id=referred_by_id,
            merchant_id=merchant_id,
            type="referral_bonus",
            points=bonus,
            balance_after=new_balance,
        )
        db.add(referral_tx)

    db.commit()
    db.refresh(member)
    return member


@router.patch("/{member_id}", response_model=MemberOut)
def update_member(
    member_id: str,
    payload: MemberUpdate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.merchant_id == merchant_id,  # tenant isolation
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return member


@router.post("/{member_id}/apply-referral", response_model=MemberOut)
def apply_referral(
    member_id: str,
    payload: ApplyReferralRequest,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Apply a referral code to an existing member (e.g. if they forgot to enter it at signup).
    Credits referral bonus to the referrer. Can only be applied once.
    """
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.merchant_id == merchant_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.referred_by_member_id:
        raise HTTPException(status_code=409, detail="Referral code already applied to this member")

    referrer = db.query(Member).filter(
        Member.referral_code == payload.referral_code.strip().upper(),
    ).first()

    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    if referrer.merchant_id != merchant_id:
        raise HTTPException(status_code=400, detail="Referral code belongs to a different merchant")
    if referrer.id == member_id:
        raise HTTPException(status_code=400, detail="You cannot use your own referral code")

    # Apply referral
    member.referred_by_member_id = referrer.id

    # Credit bonus to referrer (atomic with_for_update)
    referrer = db.query(Member).filter(Member.id == referrer.id).with_for_update().first()
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    bonus = Decimal(str(merchant.referral_bonus_points or 50))
    new_balance = (referrer.loyalty_points or Decimal("0")) + bonus
    referrer.loyalty_points = new_balance

    referral_tx = LoyaltyTransaction(
        member_id=referrer.id,
        merchant_id=merchant_id,
        type="referral_bonus",
        points=bonus,
        balance_after=new_balance,
    )
    db.add(referral_tx)
    db.commit()
    db.refresh(member)
    return member


@router.post("/{member_id}/renew", response_model=MemberOut)
def renew_membership(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Renew membership by 1 year from today (or from current expiry if still active)."""
    member = db.query(Member).filter(
        Member.id == member_id,
        Member.merchant_id == merchant_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    today = date.today()
    # If membership has already expired, renew from today; otherwise extend from current expiry
    base = max(member.expiry_date, today)
    member.expiry_date = base + timedelta(days=365)
    member.status = "active"
    db.commit()
    db.refresh(member)
    return member
