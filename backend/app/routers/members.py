"""Members router — CRUD, search, public token lookup."""
import uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.core.security import generate_public_token
from app.models.member import Member, MembershipType, MemberOfferState, MembershipTypeOffer
from app.models.merchant import Merchant
from app.schemas import MemberCreate, MemberUpdate, MemberOut
from typing import List, Optional

router = APIRouter(prefix="/members", tags=["members"])


def _enrich_member(member: Member) -> dict:
    """Add membership_type and offer_states to member dict."""
    return MemberOut.model_validate(member).model_dump()


@router.get("", response_model=List[MemberOut])
def list_members(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    members = db.query(Member).filter(Member.merchant_id == merchant_id).all()
    return members


@router.get("/search", response_model=List[MemberOut])
def search_members(
    q: str = Query(..., min_length=1),
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Search by name, phone, or member_code. Scoped to merchant.
    Uses SQL ILIKE OR-chain — O(log n) with indexes instead of O(n) Python loop.
    """
    # Strip and normalise the query for matching
    q_stripped = q.replace(" ", "").strip()
    q_like = f"%{q_stripped}%"  # for substring matching

    members = (
        db.query(Member)
        .filter(
            Member.merchant_id == merchant_id,
            or_(
                # Name match (normalise spaces in name for phone-entry-style queries)
                func.replace(func.lower(Member.name), " ", "").contains(q_stripped.lower()),
                # Phone match (strip spaces from stored phone too)
                func.replace(Member.phone, " ", "").ilike(q_like),
                # Member code (e.g. MC0001)
                Member.member_code.ilike(q_like),
                # Public token (for QR scan fallback)
                Member.public_token.ilike(q_like),
            )
        )
        .limit(20)  # Cap results — prevents full-table scans on very broad queries
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

    # Get merchant for secret_salt (used to generate public_token)
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()

    # Generate sequential member code scoped to this merchant
    count = db.query(Member).filter(Member.merchant_id == merchant_id).count()
    member_code = f"MC{str(count + 1).zfill(4)}"

    member_id_new = str(uuid.uuid4())
    public_token = generate_public_token(member_id_new, merchant.secret_salt)

    member = Member(
        id=member_id_new,
        merchant_id=merchant_id,
        member_code=member_code,
        public_token=public_token,
        name=payload.name,
        phone=payload.phone.replace(" ", ""),
        date_of_birth=payload.date_of_birth,
        anniversary_date=payload.anniversary_date,
        membership_type_id=payload.membership_type_id,
        joined_date=date.today(),
        expiry_date=date.today() + timedelta(days=365),
        loyalty_points=0,
        status="active",
    )
    db.add(member)

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

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return member
