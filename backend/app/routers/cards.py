"""
Metro Cardz — Cards Router
Exposes endpoints for merchant card inventory, linking/unlinking cards to members,
and a public resolver endpoint for physical card QR code scanning.
"""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_merchant_id, get_current_active_user
from app.models.card import CardInventoryItem
from app.models.member import Member
from app.models.merchant import Merchant
from app.schemas import CardInventoryOut

router = APIRouter(prefix="/merchant/cards", tags=["merchant-cards"])


@router.get("", response_model=List[CardInventoryOut])
def get_merchant_cards(
    status: Optional[str] = Query(default=None),
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Fetch all physical cards allocated to this merchant.
    Allows filtering by status (e.g., 'merchant_allocated', 'member_linked').
    """
    q = db.query(CardInventoryItem).filter(
        CardInventoryItem.allocated_merchant_id == merchant_id
    )
    if status and status != "all":
        q = q.filter(CardInventoryItem.status == status)
    
    return q.order_by(CardInventoryItem.created_at.desc()).all()


@router.post("/{card_id}/link", response_model=CardInventoryOut)
def link_card_to_member(
    card_id: str,
    member_id: str = Query(...),
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Link an allocated card to a member within the same merchant tenant.
    - Card must be in 'merchant_allocated' status.
    - Member must not already have a physical card linked.
    """
    card = db.query(CardInventoryItem).filter(
        CardInventoryItem.id == card_id,
        CardInventoryItem.allocated_merchant_id == merchant_id,
    ).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or not allocated to this merchant"
        )
    if card.status == "deactivated":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot link a deactivated card"
        )
    if card.status == "member_linked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This card is already linked to another member"
        )

    member = db.query(Member).filter(
        Member.id == member_id,
        Member.merchant_id == merchant_id,
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found"
        )
    if member.physical_card_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Member already has card {member.physical_card_number} linked. Unlink it first."
        )

    # Link card and update statuses
    card.status = "member_linked"
    card.linked_member_id = member_id
    card.linked_at = datetime.now(timezone.utc)
    member.physical_card_number = card.card_number

    db.commit()
    db.refresh(card)
    return card


@router.post("/{card_id}/unlink", response_model=CardInventoryOut)
def unlink_card(
    card_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Unlink a card from its associated member and return it to the available pool.
    """
    card = db.query(CardInventoryItem).filter(
        CardInventoryItem.id == card_id,
        CardInventoryItem.allocated_merchant_id == merchant_id,
    ).first()
    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not found or not allocated to this merchant"
        )
    if card.status != "member_linked":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Card is not currently linked to any member"
        )

    member = db.query(Member).filter(
        Member.id == card.linked_member_id,
        Member.merchant_id == merchant_id,
    ).first()
    if member:
        member.physical_card_number = None

    card.status = "merchant_allocated"
    card.linked_member_id = None
    card.linked_at = None

    db.commit()
    db.refresh(card)
    return card


@router.get("/search", response_model=Optional[CardInventoryOut])
def search_member_by_card(
    card_number: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """
    Search for a card by number. Returns card details and linked member metadata.
    Enforces tenant isolation by checking that the card belongs to this merchant.
    """
    digits = card_number.replace(" ", "")
    formatted = f"{digits[:4]} {digits[4:8]} {digits[8:12]} {digits[12:]}"
    card = db.query(CardInventoryItem).filter(
        CardInventoryItem.allocated_merchant_id == merchant_id,
        (CardInventoryItem.card_number == formatted) | (CardInventoryItem.card_number == digits)
    ).first()
    return card


# ── Public QR Resolution Router ──────────────────────────────────────────────

public_cards_router = APIRouter(prefix="/public/cards", tags=["public-cards"])


@public_cards_router.get("/resolve/{card_number}")
def resolve_card_number(
    card_number: str,
    db: Session = Depends(get_db),
):
    """
    Public resolution endpoint for card scans.
    Normalized to match raw numeric string or space-separated card number.
    Returns details for client-side redirection.
    """
    digits = card_number.replace(" ", "")
    if len(digits) != 16 or not digits.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid card number format (must be 16 digits)"
        )
    formatted = f"{digits[:4]} {digits[4:8]} {digits[8:12]} {digits[12:]}"

    card = db.query(CardInventoryItem).filter(
        (CardInventoryItem.card_number == formatted) |
        (CardInventoryItem.card_number == digits)
    ).first()

    if not card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Card not registered in the system"
        )

    response = {
        "id": card.id,
        "card_number": card.card_number,
        "status": card.status,
        "merchant_id": card.allocated_merchant_id,
        "member_id": card.linked_member_id,
        "public_token": None,
        "business_name": None,
    }

    if card.allocated_merchant_id:
        merchant = db.query(Merchant).filter(Merchant.id == card.allocated_merchant_id).first()
        if merchant:
            response["business_name"] = merchant.business_name

    if card.linked_member_id:
        member = db.query(Member).filter(Member.id == card.linked_member_id).first()
        if member:
            response["public_token"] = member.public_token

    return response
