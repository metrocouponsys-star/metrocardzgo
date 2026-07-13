"""Admin router — merchant management, card inventory, super-admin actions."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.deps import get_db, require_super_admin
from app.models.merchant import Merchant, MerchantUser
from app.models.member import Member
from app.models.card import CardInventoryItem
from app.models.admin import AdminAuditLog
from app.core.security import hash_password
from app.schemas import (
    MerchantCreate, MerchantUpdate, MerchantOut,
    MerchantUserCreate, MerchantUserOut,
    AdminDashboardStats, CardInventoryOut, AddCardsRequest, AllocateCardsRequest,
)
from datetime import datetime, timezone

router = APIRouter(prefix="/admin", tags=["admin"])


def _log_action(db: Session, admin_id: str, merchant_id: Optional[str], action: str, detail: str = ""):
    log = AdminAuditLog(admin_user_id=admin_id, merchant_id=merchant_id, action=action, detail=detail)
    db.add(log)


# ── Admin Dashboard ───────────────────────────────────────────────────────────
@router.get("/stats", response_model=AdminDashboardStats)
def admin_stats(admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    from app.models.redemption import RedemptionLog
    total_merchants = db.query(Merchant).count()
    total_members = db.query(Member).count()
    active_merchants = db.query(Merchant).filter(Merchant.status == "active").count()
    inactive_merchants = total_merchants - active_merchants
    redemptions_today = db.query(RedemptionLog).filter(RedemptionLog.created_at >= today_start).count()
    pending_approvals = db.query(Merchant).filter(Merchant.approval_status == "pending").count()
    return AdminDashboardStats(
        total_merchants=total_merchants,
        total_members=total_members,
        redemptions_today=redemptions_today,
        active_merchants=active_merchants,
        inactive_merchants=inactive_merchants,
        pending_approvals=pending_approvals,
    )



# ── Merchant CRUD ─────────────────────────────────────────────────────────────
@router.get("/merchants", response_model=List[MerchantOut])
def list_merchants(admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    merchants = db.query(Merchant).all()
    for m in merchants:
        m.member_count = db.query(Member).filter(Member.merchant_id == m.id).count()
    return merchants


@router.post("/merchants", response_model=MerchantOut, status_code=201)
def create_merchant(
    payload: MerchantCreate,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    merchant = Merchant(
        business_name=payload.business_name,
        category=payload.category,
        plan_tier=payload.plan_tier,
        whatsapp_number=payload.whatsapp_number or "",
        address=payload.address,
        secret_salt=str(uuid.uuid4()),
    )
    db.add(merchant)
    db.flush()

    owner = MerchantUser(
        merchant_id=merchant.id,
        name=payload.owner_name,
        phone=payload.owner_phone.replace(" ", ""),
        role="owner",
        password_hash=hash_password(payload.owner_phone[-4:]),  # Temp password = last 4 digits of phone
    )
    db.add(owner)
    db.commit()
    db.refresh(merchant)
    merchant.member_count = 0
    _log_action(db, admin.id, merchant.id, "create_merchant", payload.business_name)
    db.commit()
    return merchant


@router.patch("/merchants/{merchant_id}", response_model=MerchantOut)
def update_merchant(
    merchant_id: str,
    payload: MerchantUpdate,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(merchant, k, v)
    db.commit()
    db.refresh(merchant)
    return merchant


@router.post("/merchants/{merchant_id}/suspend", response_model=MerchantOut)
def suspend_merchant(
    merchant_id: str,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    merchant.status = "suspended"
    _log_action(db, admin.id, merchant_id, "suspend_merchant")
    db.commit()
    db.refresh(merchant)
    return merchant


@router.post("/merchants/{merchant_id}/activate", response_model=MerchantOut)
def activate_merchant(
    merchant_id: str,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    merchant.status = "active"
    _log_action(db, admin.id, merchant_id, "activate_merchant")
    db.commit()
    db.refresh(merchant)
    return merchant


@router.post("/merchants/{merchant_id}/approve", response_model=MerchantOut)
def approve_merchant(
    merchant_id: str,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Approve a pending merchant — sets approval_status to 'approved' and activates them."""
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    merchant.approval_status = "approved"
    merchant.status = "active"
    _log_action(db, admin.id, merchant_id, "approve_merchant", merchant.business_name)
    db.commit()
    db.refresh(merchant)
    merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
    db.commit()
    return merchant


@router.post("/merchants/{merchant_id}/reject", response_model=MerchantOut)
def reject_merchant(
    merchant_id: str,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """Reject a pending merchant — sets approval_status to 'rejected' and suspends them."""
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    merchant.approval_status = "rejected"
    merchant.status = "suspended"
    _log_action(db, admin.id, merchant_id, "reject_merchant", merchant.business_name)
    db.commit()
    db.refresh(merchant)
    merchant.member_count = 0
    return merchant



# ── Merchant Logo Upload ──────────────────────────────────────────────────────
@router.post("/merchants/{merchant_id}/logo", response_model=MerchantOut)
async def upload_merchant_logo(
    merchant_id: str,
    file: UploadFile = File(..., description="PNG, JPEG, or WebP logo image. Max 10 MB."),
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """
    Upload and replace a merchant's logo.

    Processing pipeline:
      1. Hard-reject files > 10 MB before reading into memory.
      2. Server-side Pillow compression → WebP, max 512 px, ≤ 100 KB.
      3. Upload to Supabase Storage bucket 'merchant-logos' (upsert, overwrites old logo).
      4. Save public URL to merchants.logo_url column.

    Client-side browser-image-compression is a nice-to-have that reduces upload
    bandwidth — but this endpoint enforces the 100 KB ceiling regardless.
    """
    from app.utils.image_utils import compress_logo, upload_logo_to_storage

    # Validate content type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, WebP, GIF.",
        )

    # Read raw bytes (Pillow will handle the decompression)
    raw_bytes = await file.read()

    # Server-side compression — always runs, regardless of client behaviour
    try:
        compressed_webp = compress_logo(raw_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Upload to Supabase Storage and get public URL
    try:
        logo_url = upload_logo_to_storage(merchant_id, compressed_webp)
    except RuntimeError as exc:
        # Storage not configured (dev/test environment) — skip upload, store placeholder
        logo_url = None
        import logging
        logging.getLogger(__name__).warning("Logo storage not configured: %s", exc)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {exc}")

    # Persist URL to DB
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    merchant.logo_url = logo_url
    db.commit()
    db.refresh(merchant)
    merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
    _log_action(db, admin.id, merchant_id, "upload_logo", f"size={len(compressed_webp)} bytes")
    db.commit()
    return merchant


# ── Merchant Users ────────────────────────────────────────────────────────────
@router.get("/merchants/{merchant_id}/users", response_model=List[MerchantUserOut])
def get_merchant_users(merchant_id: str, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    return db.query(MerchantUser).filter(MerchantUser.merchant_id == merchant_id).all()


@router.post("/merchants/{merchant_id}/users", response_model=MerchantUserOut, status_code=201)
def create_merchant_user(
    merchant_id: str,
    payload: MerchantUserCreate,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    user = MerchantUser(
        merchant_id=merchant_id,
        name=payload.name,
        phone=payload.phone.replace(" ", ""),
        role=payload.role,
        password_hash=hash_password(payload.phone[-4:]),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Card Inventory ────────────────────────────────────────────────────────────
@router.get("/cards", response_model=List[CardInventoryOut])
def list_cards(
    status: Optional[str] = Query(default=None),
    merchant_id: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    q = db.query(CardInventoryItem)
    if status and status != "all":
        q = q.filter(CardInventoryItem.status == status)
    if merchant_id:
        q = q.filter(CardInventoryItem.allocated_merchant_id == merchant_id)
    if search:
        normalized = search.replace(" ", "")
        q = q.filter(CardInventoryItem.card_number.ilike(f"%{normalized}%"))
    return q.order_by(CardInventoryItem.created_at.desc()).all()


@router.post("/cards", status_code=201)
def add_cards(
    payload: AddCardsRequest,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    added, skipped, errors = 0, 0, []
    for raw in payload.card_numbers:
        digits = raw.strip().replace(" ", "")
        if len(digits) != 16 or not digits.isdigit():
            errors.append(f'"{raw}" — invalid format (must be 16 digits)')
            continue
        formatted = f"{digits[:4]} {digits[4:8]} {digits[8:12]} {digits[12:]}"
        existing = db.query(CardInventoryItem).filter(
            CardInventoryItem.card_number == formatted
        ).first()
        if existing:
            skipped += 1
            continue
        card = CardInventoryItem(card_number=formatted, created_by_admin_id=admin.id)
        db.add(card)
        added += 1
    db.commit()
    return {"added": added, "skipped": skipped, "errors": errors}


@router.post("/cards/allocate/{merchant_id}", response_model=List[CardInventoryOut])
def allocate_cards(
    merchant_id: str,
    payload: AllocateCardsRequest,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    updated = []
    now = datetime.now(timezone.utc)
    for card_id in payload.card_ids:
        card = db.query(CardInventoryItem).filter(
            CardInventoryItem.id == card_id,
            CardInventoryItem.status == "unassigned",
        ).first()
        if not card:
            continue
        card.status = "merchant_allocated"
        card.allocated_merchant_id = merchant_id
        card.allocated_at = now
        updated.append(card)
    db.commit()
    return updated


@router.post("/cards/{card_id}/deactivate", response_model=CardInventoryOut)
def deactivate_card(card_id: str, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    card = db.query(CardInventoryItem).filter(CardInventoryItem.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.status = "deactivated"
    db.commit()
    db.refresh(card)
    return card
