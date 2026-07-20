"""Admin router — merchant management, card inventory, super-admin actions."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.deps import get_db, require_super_admin, require_super_admin_or_merchant_owner
from app.models.merchant import Merchant, MerchantUser
from app.models.member import Member
from app.models.card import CardInventoryItem
from app.models.admin import AdminAuditLog
from app.core.security import hash_password
from app.schemas import (
    MerchantCreate, MerchantUpdate, MerchantOut,
    MerchantUserCreate, MerchantUserOut,
    AdminDashboardStats, CardInventoryOut, AddCardsRequest, AllocateCardsRequest,
    CardDesignUploadRequest,
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
    # Check for duplicate phone or email to prevent integrity error crashes
    phone_clean = payload.owner_phone.replace(" ", "")
    existing_phone = db.query(MerchantUser).filter(MerchantUser.phone == phone_clean).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered to an existing merchant user."
        )

    if payload.owner_email:
        email_clean = payload.owner_email.strip().lower()
        existing_email = db.query(MerchantUser).filter(MerchantUser.email == email_clean).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered to an existing merchant user."
            )

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
        email=payload.owner_email or None,
        role="owner",
        password_hash=hash_password(payload.owner_phone.replace(" ", "")),  # Default password = full phone number
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
    user=Depends(require_super_admin_or_merchant_owner),
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
from pydantic import BaseModel

class LogoUploadRequest(BaseModel):
    logo_data_url: str

@router.post("/merchants/{merchant_id}/logo", response_model=MerchantOut)
async def upload_merchant_logo(
    merchant_id: str,
    payload: LogoUploadRequest,
    user=Depends(require_super_admin_or_merchant_owner),
    db: Session = Depends(get_db),
):
    """
    Upload and replace a merchant's logo using a base64 Data URL.
    If logo_data_url is empty, deletes the logo.
    """
    # 1. Fetch Merchant
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # 2. Check for Deletion
    if not payload.logo_data_url.strip():
        merchant.logo_url = None
        db.commit()
        db.refresh(merchant)
        merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
        _log_action(db, user.id, merchant_id, "delete_logo")
        db.commit()
        return merchant

    # 3. Decode base64 image
    import base64
    logo_data_url = payload.logo_data_url
    if "base64," in logo_data_url:
        try:
            _, base64_data = logo_data_url.split("base64,", 1)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid data URL format")
    else:
        base64_data = logo_data_url

    try:
        raw_bytes = base64.b64decode(base64_data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64 data: {exc}")

    # Enforce a 10 MB limit on raw bytes
    if len(raw_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 10 MB limit")

    from app.utils.image_utils import compress_logo, upload_logo_to_storage

    # Server-side compression
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
    merchant.logo_url = logo_url
    db.commit()
    db.refresh(merchant)
    merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
    _log_action(db, user.id, merchant_id, "upload_logo", f"size={len(compressed_webp)} bytes")
    db.commit()
    return merchant


# ── Card Design Upload ────────────────────────────────────────────────────────────
@router.post("/merchants/{merchant_id}/card-design", response_model=MerchantOut)
def upload_card_design(
    merchant_id: str,
    payload: CardDesignUploadRequest,
    user=Depends(require_super_admin_or_merchant_owner),
    db: Session = Depends(get_db),
):
    """
    Save a custom card background design for the merchant.
    Accepts a base64 Data URL (PNG/JPG/WebP). The URL is stored in
    card_design_url on the Merchant row.
    """
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    if not payload.card_design_data_url.strip():
        merchant.card_design_url = None
        db.commit()
        db.refresh(merchant)
        merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
        return merchant

    import base64
    data_url = payload.card_design_data_url
    if "base64," in data_url:
        try:
            _, base64_data = data_url.split("base64,", 1)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid data URL format")
    else:
        base64_data = data_url

    try:
        raw_bytes = base64.b64decode(base64_data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64 data: {exc}")

    if len(raw_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Card design image must be under 5 MB")

    from app.utils.image_utils import upload_logo_to_storage
    try:
        design_url = upload_logo_to_storage(f"{merchant_id}_card_design", raw_bytes)
    except RuntimeError:
        # Dev/test: store as data URL directly (storage not configured)
        design_url = payload.card_design_data_url[:2000]  # truncate for safety
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {exc}")

    merchant.card_design_url = design_url
    _log_action(db, user.id, merchant_id, "upload_card_design")
    db.commit()
    db.refresh(merchant)
    merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
    return merchant



# ── Merchant Users ────────────────────────────────────────────────────────────
@router.get("/merchants/{merchant_id}/users", response_model=List[MerchantUserOut])
def get_merchant_users(merchant_id: str, user=Depends(require_super_admin_or_merchant_owner), db: Session = Depends(get_db)):
    return db.query(MerchantUser).filter(MerchantUser.merchant_id == merchant_id).all()


@router.post("/merchants/{merchant_id}/users", response_model=MerchantUserOut, status_code=201)
def create_merchant_user(
    merchant_id: str,
    payload: MerchantUserCreate,
    user=Depends(require_super_admin_or_merchant_owner),
    db: Session = Depends(get_db),
):
    new_user = MerchantUser(
        merchant_id=merchant_id,
        name=payload.name,
        phone=payload.phone.replace(" ", ""),
        email=payload.email.strip().lower() if payload.email else None,
        role=payload.role,
        password_hash=hash_password(payload.phone.replace(" ", "")),  # default to full phone number
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


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


@router.post("/cards/{card_id}/revoke", response_model=CardInventoryOut)
def revoke_card(card_id: str, admin=Depends(require_super_admin), db: Session = Depends(get_db)):
    """
    Return an allocated card back to the unassigned pool.
    Use this to revoke a merchant's card allocation without permanently destroying the card.
    If the card is currently linked to a member, that link is also cleared.
    To permanently disable a card, use /deactivate instead.
    """
    card = db.query(CardInventoryItem).filter(CardInventoryItem.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if card.status == "deactivated":
        raise HTTPException(status_code=400, detail="Deactivated cards cannot be revoked. Create a new card.")
    if card.status == "unassigned":
        raise HTTPException(status_code=400, detail="Card is already unassigned")

    # If linked to a member, clear the member's physical_card_number too
    if card.linked_member_id:
        from app.models.member import Member
        member = db.query(Member).filter(Member.id == card.linked_member_id).first()
        if member:
            member.physical_card_number = None

    card.status = "unassigned"
    card.allocated_merchant_id = None
    card.allocated_at = None
    card.linked_member_id = None
    card.linked_at = None

    _log_action(db, admin.id, None, "revoke_card", f"card_id={card_id}")
    db.commit()
    db.refresh(card)
    return card



@router.get("/cards/export")
def export_cards(
    merchant_id: Optional[str] = Query(default=None),
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    """
    Export card inventory to a CSV file for printing agencies.
    Provides raw digits and direct redirect QR links.
    """
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse

    q = db.query(CardInventoryItem)
    if merchant_id:
        q = q.filter(CardInventoryItem.allocated_merchant_id == merchant_id)

    cards = q.order_by(CardInventoryItem.created_at.desc()).all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Card Number",
        "Raw Number",
        "Redirect Link",
        "Status",
        "Allocated Merchant",
        "Linked Member Name"
    ])

    site_url = "https://metrocardz.in"

    for card in cards:
        raw_number = card.card_number.replace(" ", "")
        redirect_link = f"{site_url}/c/?n={raw_number}"
        writer.writerow([
            card.card_number,
            raw_number,
            redirect_link,
            card.status,
            card.allocated_merchant_name or "",
            card.linked_member_name or ""
        ])

    output.seek(0)
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=cards_export.csv"
    return response


# ── Admin Cross-Merchant Member List ──────────────────────────────────────────
from app.schemas import AdminMemberOut, AdminReportStats, MerchantRedemptionStat
from app.models.redemption import RedemptionLog
from app.models.loyalty import LoyaltyTransaction
from sqlalchemy import func as sqlfunc, or_, desc
from decimal import Decimal


@router.get("/members", response_model=List[AdminMemberOut])
def admin_list_all_members(
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
    search: Optional[str] = Query(default=None),
    merchant_id_filter: Optional[str] = Query(default=None, alias="merchant_id"),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
):
    q = db.query(Member)
    if merchant_id_filter:
        q = q.filter(Member.merchant_id == merchant_id_filter)
    if status_filter:
        q = q.filter(Member.status == status_filter)
    if search:
        s = f"%{search}%"
        q = q.filter(or_(
            Member.name.ilike(s),
            Member.phone.ilike(s),
            Member.member_code.ilike(s),
        ))
    members = q.order_by(desc(Member.created_at)).offset(offset).limit(limit).all()
    result = []
    for m in members:
        merchant = db.query(Merchant).filter(Merchant.id == m.merchant_id).first()
        result.append(AdminMemberOut(
            id=m.id,
            member_code=m.member_code,
            name=m.name,
            phone=m.phone,
            email=m.email,
            status=m.status,
            merchant_id=m.merchant_id,
            merchant_name=merchant.business_name if merchant else None,
            membership_type_name=m.membership_type.name if m.membership_type else None,
            loyalty_points=m.loyalty_points or Decimal("0"),
            total_visits=m.total_visits or 0,
            joined_date=m.joined_date,
            expiry_date=m.expiry_date,
            created_at=m.created_at,
        ))
    return result


# ── Admin Platform-Wide Reports ───────────────────────────────────────────────
@router.get("/reports/stats", response_model=AdminReportStats)
def admin_platform_stats(
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
):
    from datetime import timezone as tz
    q_redemptions = db.query(RedemptionLog)
    q_points = db.query(LoyaltyTransaction)
    if date_from:
        start_dt = datetime.combine(date_from, datetime.min.time()).replace(tzinfo=tz.utc)
        q_redemptions = q_redemptions.filter(RedemptionLog.created_at >= start_dt)
        q_points = q_points.filter(LoyaltyTransaction.created_at >= start_dt)
    if date_to:
        end_dt = datetime.combine(date_to, datetime.max.time()).replace(tzinfo=tz.utc)
        q_redemptions = q_redemptions.filter(RedemptionLog.created_at <= end_dt)
        q_points = q_points.filter(LoyaltyTransaction.created_at <= end_dt)

    total_redemptions = q_redemptions.count()
    total_members = db.query(Member).count()
    active_merchants = db.query(Merchant).filter(Merchant.status == "active").count()

    pts_issued = db.query(sqlfunc.sum(LoyaltyTransaction.points)).filter(
        LoyaltyTransaction.type == "earn"
    ).scalar() or Decimal("0")
    pts_redeemed = db.query(sqlfunc.sum(sqlfunc.abs(LoyaltyTransaction.points))).filter(
        LoyaltyTransaction.type == "redeem"
    ).scalar() or Decimal("0")

    from datetime import date as _date
    month_start = _date.today().replace(day=1)
    new_members_this_month = db.query(Member).filter(Member.joined_date >= month_start).count()

    return AdminReportStats(
        total_redemptions=total_redemptions,
        total_members=total_members,
        total_points_issued=pts_issued,
        total_points_redeemed=pts_redeemed,
        new_members_this_month=new_members_this_month,
        active_merchants=active_merchants,
    )


@router.get("/reports/by-merchant", response_model=List[MerchantRedemptionStat])
def admin_reports_by_merchant(
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    merchants = db.query(Merchant).filter(Merchant.status == "active").all()
    result = []
    for m in merchants:
        redemption_count = db.query(RedemptionLog).join(
            Member, RedemptionLog.member_id == Member.id
        ).filter(Member.merchant_id == m.id).count()
        member_count = db.query(Member).filter(Member.merchant_id == m.id).count()
        result.append(MerchantRedemptionStat(
            merchant_id=m.id,
            merchant_name=m.business_name,
            redemption_count=redemption_count,
            member_count=member_count,
        ))
    result.sort(key=lambda x: x.redemption_count, reverse=True)
    return result


# ── Admin Merchant Staff Role Update ─────────────────────────────────────────
@router.patch("/merchants/{merchant_id}/users/{user_id}/role", response_model=MerchantUserOut)
def update_staff_role(
    merchant_id: str,
    user_id: str,
    role: str = Query(..., pattern="^(owner|staff)$"),
    user=Depends(require_super_admin_or_merchant_owner),
    db: Session = Depends(get_db),
):
    target_user = db.query(MerchantUser).filter(
        MerchantUser.id == user_id,
        MerchantUser.merchant_id == merchant_id,
    ).first()
    if not target_user:
        raise HTTPException(404, "User not found")
    target_user.role = role
    db.commit()
    db.refresh(target_user)
    return target_user



@router.delete("/merchants/{merchant_id}/users/{user_id}", status_code=204)
def delete_merchant_user(
    merchant_id: str,
    user_id: str,
    user=Depends(require_super_admin_or_merchant_owner),
    db: Session = Depends(get_db),
):
    target_user = db.query(MerchantUser).filter(
        MerchantUser.id == user_id,
        MerchantUser.merchant_id == merchant_id,
    ).first()
    if not target_user:
        raise HTTPException(404, "User not found")
    # Prevent deleting self
    if target_user.id == user.id:
        raise HTTPException(400, "Cannot delete yourself")
    db.delete(target_user)
    db.commit()


# ── Admin Merchant Detail ─────────────────────────────────────────────────────
@router.get("/merchants/{merchant_id}/detail")
def get_merchant_detail(
    merchant_id: str,
    admin=Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(404, "Merchant not found")

    members = db.query(Member).filter(Member.merchant_id == merchant_id).order_by(desc(Member.created_at)).limit(10).all()
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    redemptions_today = db.query(RedemptionLog).join(
        Member, RedemptionLog.member_id == Member.id
    ).filter(Member.merchant_id == merchant_id, RedemptionLog.created_at >= today_start).count()
    member_count = db.query(Member).filter(Member.merchant_id == merchant_id).count()
    users = db.query(MerchantUser).filter(MerchantUser.merchant_id == merchant_id).all()

    return {
        "merchant": {
            "id": merchant.id,
            "business_name": merchant.business_name,
            "category": merchant.category,
            "plan_tier": merchant.plan_tier,
            "status": merchant.status,
            "approval_status": merchant.approval_status,
            "whatsapp_number": merchant.whatsapp_number,
            "address": merchant.address,
            "created_at": merchant.created_at.isoformat() if merchant.created_at else None,
        },
        "stats": {
            "member_count": member_count,
            "redemptions_today": redemptions_today,
        },
        "recent_members": [
            {"id": m.id, "name": m.name, "phone": m.phone, "status": m.status, "joined_date": str(m.joined_date)}
            for m in members
        ],
        "users": [
            {"id": u.id, "name": u.name, "phone": u.phone, "role": u.role}
            for u in users
        ],
    }
