"""Members router — CRUD, search, public token lookup, referral engine."""
import uuid
import string
import random
from datetime import date, timedelta, datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.core.security import generate_public_token
from app.models.member import Member, MembershipType, MemberOfferState, MembershipTypeOffer
from app.models.merchant import Merchant
from app.models.loyalty import LoyaltyTransaction
from app.models.idempotency import IdempotencyRecord
from app.schemas import MemberCreate, MemberUpdate, MemberOut, ApplyReferralRequest, PurchaseRequest, PurchaseResult
from app.services.event_service import emit, MEMBER_ENROLLED, POINTS_EARNED, REFERRAL_APPLIED
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


def ensure_member_offer_states(db: Session, member: Member) -> list:
    """
    Ensure every active OfferTemplate for the merchant that applies to this member
    has an active MemberOfferState record in the DB, then return all active offer states.
    """
    import uuid
    from decimal import Decimal as Dec
    from app.models.member import MemberOfferState, MembershipTypeOffer
    from app.models.offer import OfferTemplate as OfferTemplateModel
    from app.schemas import MemberOfferStateOut

    merchant_id = member.merchant_id

    # 1. Fetch all active offer templates for this merchant
    active_templates = (
        db.query(OfferTemplateModel)
        .filter(
            OfferTemplateModel.merchant_id == merchant_id,
            OfferTemplateModel.active == True,
        )
        .all()
    )

    if not active_templates:
        return []

    # 2. Get map of offer_template_id -> default_qty for member's membership type (if any)
    membership_type_offers = {}
    if member.membership_type_id:
        type_links = (
            db.query(MembershipTypeOffer)
            .filter(MembershipTypeOffer.membership_type_id == member.membership_type_id)
            .all()
        )
        for link in type_links:
            membership_type_offers[link.offer_template_id] = link.default_qty

    # 3. Find existing states for this member
    existing_states = (
        db.query(MemberOfferState)
        .filter(MemberOfferState.member_id == member.id)
        .all()
    )
    existing_tmpl_ids = {s.offer_template_id for s in existing_states}

    # 4. For any active offer template that applies to this member but doesn't have a state, create one!
    new_created = False
    for tmpl in active_templates:
        all_links = (
            db.query(MembershipTypeOffer)
            .filter(MembershipTypeOffer.offer_template_id == tmpl.id)
            .all()
        )
        if all_links:
            linked_type_ids = {l.membership_type_id for l in all_links}
            if member.membership_type_id not in linked_type_ids:
                continue  # Skip offer template not applicable to member's tier

        if tmpl.id not in existing_tmpl_ids:
            default_qty = membership_type_offers.get(tmpl.id)
            if default_qty is None:
                qty = (
                    None
                    if tmpl.offer_type in ('percent_off', 'birthday', 'referral')
                    else Dec("5")
                )
            else:
                qty = default_qty

            new_state = MemberOfferState(
                id=str(uuid.uuid4()),
                member_id=member.id,
                offer_template_id=tmpl.id,
                remaining_qty=qty,
                initial_qty=qty,
                status="active",
            )
            db.add(new_state)
            new_created = True

    if new_created:
        try:
            db.commit()
        except Exception:
            db.rollback()

    # Re-query all states with relationships loaded
    all_states = (
        db.query(MemberOfferState)
        .filter(MemberOfferState.member_id == member.id)
        .all()
    )

    result = []
    for s in all_states:
        if s.offer_template and s.offer_template.active:
            try:
                result.append(MemberOfferStateOut.from_orm_state(s))
            except Exception:
                pass

    return result


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

    member_data = MemberOut.model_validate(member)
    member_data.offer_states = ensure_member_offer_states(db, member)
    return member_data



def _save_idempotency_response_in_members(
    db: Session,
    key: str,
    merchant_id: str,
    endpoint: str,
    status_code: int,
    response_body: dict,
) -> None:
    record = db.query(IdempotencyRecord).filter(
        IdempotencyRecord.idempotency_key == key,
        IdempotencyRecord.merchant_id == merchant_id,
        IdempotencyRecord.endpoint == endpoint,
    ).first()
    if record:
        import json
        record.status = "completed"
        record.status_code = status_code
        record.response_body = json.dumps(response_body, default=str)


@router.post("", response_model=MemberOut, status_code=status.HTTP_201_CREATED)
def create_member(
    payload: MemberCreate,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
    x_idempotency_key: Optional[str] = Header(None, alias="X-Idempotency-Key"),
):
    endpoint = "POST /members"
    if x_idempotency_key:
        record = db.query(IdempotencyRecord).filter(
            IdempotencyRecord.idempotency_key == x_idempotency_key,
            IdempotencyRecord.merchant_id == merchant_id,
            IdempotencyRecord.endpoint == endpoint,
        ).first()
        if record:
            if record.status == "completed" and record.response_body:
                import json
                return MemberOut(**json.loads(record.response_body))
            if record.status == "processing":
                raise HTTPException(409, "A request with this idempotency key is already being processed.")

        # Insert a processing record
        expires = datetime.now(timezone.utc) + timedelta(hours=24)
        new_record = IdempotencyRecord(
            idempotency_key=x_idempotency_key,
            merchant_id=merchant_id,
            endpoint=endpoint,
            status="processing",
            expires_at=expires,
        )
        db.add(new_record)
        db.flush()

    try:
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
        db.flush()

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

            # Event for referral bonus
            emit(db, merchant_id, POINTS_EARNED, {
                "points": float(bonus),
                "source": "referral_bonus",
                "referred_member_id": member.id,
            }, member_id=referred_by_id, actor_id=current_user.id)

            emit(db, merchant_id, REFERRAL_APPLIED, {
                "referrer_member_id": referred_by_id,
                "bonus_points": float(bonus),
            }, member_id=member.id, actor_id=current_user.id)

        # Emit member enrolled event
        emit(db, merchant_id, MEMBER_ENROLLED, {
            "member_id": member.id,
            "member_code": member.member_code,
            "name": member.name,
            "phone": member.phone,
            "email": member.email,
        }, member_id=member.id, actor_id=current_user.id)

        # Save idempotency response before commit
        if x_idempotency_key:
            member_out = MemberOut.model_validate(member)
            _save_idempotency_response_in_members(
                db, x_idempotency_key, merchant_id, endpoint, 201, member_out.model_dump()
            )

        db.commit()
        db.refresh(member)
        return member

    except Exception:
        db.rollback()
        raise



from pydantic import BaseModel as PyBaseModel

class BulkImportItem(PyBaseModel):
    name: str
    phone: str
    date_of_birth: Optional[date] = None
    anniversary_date: Optional[date] = None
    membership_type_id: Optional[str] = None

class BulkImportRequest(PyBaseModel):
    members: List[BulkImportItem]

@router.post("/bulk-import")
def bulk_import_members(
    payload: BulkImportRequest,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    default_mtype = db.query(MembershipType).filter(MembershipType.merchant_id == merchant_id).first()
    default_mtype_id = default_mtype.id if default_mtype else None

    imported = 0
    skipped = 0
    errors = []

    for item in payload.members:
        clean_phone = item.phone.replace(" ", "").strip()
        if not item.name or not clean_phone:
            skipped += 1
            errors.append("Row missing name or phone")
            continue

        existing = db.query(Member).filter(
            Member.merchant_id == merchant_id,
            Member.phone == clean_phone
        ).first()
        if existing:
            skipped += 1
            errors.append(f"Phone {clean_phone} already registered ({existing.name})")
            continue

        mtype_id = item.membership_type_id or default_mtype_id
        if not mtype_id:
            skipped += 1
            errors.append(f"No membership type available for {item.name}")
            continue

        count = db.query(Member).filter(Member.merchant_id == merchant_id).count()
        member_code = f"MC{str(count + 1).zfill(4)}"
        member_id_new = str(uuid.uuid4())
        public_token = generate_public_token(member_id_new, merchant.secret_salt)
        referral_code = _generate_referral_code(db)

        member = Member(
            id=member_id_new,
            merchant_id=merchant_id,
            member_code=member_code,
            public_token=public_token,
            name=item.name,
            phone=clean_phone,
            date_of_birth=item.date_of_birth,
            anniversary_date=item.anniversary_date,
            membership_type_id=mtype_id,
            joined_date=date.today(),
            expiry_date=date.today() + timedelta(days=365),
            loyalty_points=Decimal("0"),
            status="active",
            total_visits=0,
            referral_code=referral_code,
        )
        db.add(member)
        db.flush()

        offer_links = db.query(MembershipTypeOffer).filter(
            MembershipTypeOffer.membership_type_id == mtype_id
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

        imported += 1

    db.commit()
    return {"imported": imported, "skipped": skipped, "errors": errors}


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

    # ── Offer-state migration when membership type changes ────────────────────
    new_type_id = update_data.get("membership_type_id")
    if new_type_id and new_type_id != member.membership_type_id:
        # Deactivate all current offer states for this member
        db.query(MemberOfferState).filter(
            MemberOfferState.member_id == member_id
        ).update({"status": "exhausted"}, synchronize_session=False)
        db.flush()

        # Create fresh offer states for the new membership type
        offer_links = db.query(MembershipTypeOffer).filter(
            MembershipTypeOffer.membership_type_id == new_type_id
        ).all()
        for link in offer_links:
            state = MemberOfferState(
                member_id=member_id,
                offer_template_id=link.offer_template_id,
                remaining_qty=link.default_qty,
                initial_qty=link.default_qty,
                status="active",
            )
            db.add(state)
    # ─────────────────────────────────────────────────────────────────────────

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


@router.get("/{member_id}/referral-link")
def get_referral_link(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Return the shareable referral link for a member."""
    member = db.query(Member).filter(
        Member.id == member_id, Member.merchant_id == merchant_id
    ).first()
    if not member:
        raise HTTPException(404, "Member not found")
    # Ensure referral code exists
    if not member.referral_code:
        member.referral_code = _generate_referral_code(db)
        db.commit()
        db.refresh(member)
    return {
        "referral_code": member.referral_code,
        "referral_link": f"https://metrocardz.in/join/{merchant_id}?ref={member.referral_code}",
        "bonus_points": float(
            db.query(Merchant).filter(Merchant.id == merchant_id).first().referral_bonus_points or 50
        ),
    }


from fastapi import Response as FastAPIResponse


@router.get("/{member_id}/card-pdf")
def download_member_card_pdf(
    member_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Generate and return a printable PDF membership card for the member."""
    member = db.query(Member).filter(
        Member.id == member_id, Member.merchant_id == merchant_id
    ).first()
    if not member:
        raise HTTPException(404, "Member not found")

    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    mt = member.membership_type

    try:
        import io
        import qrcode
        from reportlab.lib.pagesizes import landscape
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas as rl_canvas
        from reportlab.lib.utils import ImageReader

        # Card dimensions: 85.6mm x 54mm (ISO/IEC 7810 ID-1 standard)
        card_w = 85.6 * mm
        card_h = 54 * mm

        buf = io.BytesIO()
        c = rl_canvas.Canvas(buf, pagesize=(card_w, card_h))

        # Background gradient (dark blue)
        c.setFillColor(colors.HexColor("#00236f"))
        c.rect(0, 0, card_w, card_h, fill=1, stroke=0)

        # Accent strip
        c.setFillColor(colors.HexColor("#6c63ff"))
        c.rect(0, card_h - 8 * mm, card_w, 8 * mm, fill=1, stroke=0)

        # Business name
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(4 * mm, card_h - 6 * mm, (merchant.business_name or "")[:30])

        # Tier badge
        tier_text = mt.name if mt else "Member"
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.HexColor("#ffd700"))
        c.drawRightString(card_w - 4 * mm, card_h - 6 * mm, tier_text)

        # Member name
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(4 * mm, card_h - 20 * mm, member.name[:25])

        # Member code
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.HexColor("#cdd8ff"))
        c.drawString(4 * mm, card_h - 27 * mm, f"Card: {member.member_code}")

        # Expiry
        c.drawString(4 * mm, card_h - 33 * mm, f"Valid till: {member.expiry_date.strftime('%b %Y')}")

        # QR code
        qr = qrcode.QRCode(box_size=3, border=1)
        qr.add_data(f"https://metrocardz.in/m/{member.public_token}")
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_buf = io.BytesIO()
        qr_img.save(qr_buf, format="PNG")
        qr_buf.seek(0)
        qr_size = 22 * mm
        c.drawImage(ImageReader(qr_buf), card_w - qr_size - 4 * mm, 4 * mm, qr_size, qr_size)

        # Footer line
        c.setFont("Helvetica", 6)
        c.setFillColor(colors.HexColor("#aabbee"))
        c.drawString(4 * mm, 4 * mm, "Powered by Metro Cardz • metrocardz.in")

        c.save()
        pdf_bytes = buf.getvalue()

        return FastAPIResponse(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=card_{member.member_code}.pdf"},
        )
    except ImportError as e:
        raise HTTPException(500, f"PDF generation dependency missing: {e}")


# ── Record Purchase & Assign Loyalty Points ──────────────────────────────────
@router.post("/{member_id}/purchase", response_model=PurchaseResult)
def record_member_purchase(
    member_id: str,
    payload: PurchaseRequest,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Record a purchase for a member:
    1. Validates member status and merchant ownership.
    2. Validates and applies optional Coupon Code.
    3. Redeems optional Offer if offer_state_id is supplied.
    4. Calculates earned loyalty points using configured PointsRules (per_rupee / per_visit).
    5. Credits points, creates a LoyaltyTransaction audit record, and updates total_visits.
    """
    member = db.query(Member).filter(
        Member.id == member_id, Member.merchant_id == merchant_id
    ).first()
    if not member:
        raise HTTPException(404, "Member not found")
    if member.status in ("expired", "deactivated"):
        raise HTTPException(400, f"Cannot record purchase for {member.status} membership")

    from app.models.rewards import CouponCode, PointsRule
    from app.services.redemption_service import redeem_offer_atomic
    from app.services.exceptions import ServiceError

    gross_amount = payload.amount
    discount_amount = Decimal("0")
    coupon_obj = None

    # 1. Apply Coupon if provided
    if payload.coupon_code:
        coupon_code_clean = payload.coupon_code.strip().upper()
        coupon_obj = db.query(CouponCode).filter(
            CouponCode.merchant_id == merchant_id,
            CouponCode.code == coupon_code_clean,
            CouponCode.is_active == True,
        ).first()

        if not coupon_obj:
            raise HTTPException(400, f"Coupon code '{coupon_code_clean}' is invalid or inactive")

        today_dt = date.today()
        if coupon_obj.expires_at and coupon_obj.expires_at < today_dt:
            raise HTTPException(400, f"Coupon '{coupon_code_clean}' has expired")
        if coupon_obj.max_uses is not None and coupon_obj.used_count >= coupon_obj.max_uses:
            raise HTTPException(400, f"Coupon '{coupon_code_clean}' usage limit reached")
        if gross_amount < (coupon_obj.min_purchase or Decimal("0")):
            raise HTTPException(400, f"Minimum purchase of ₹{coupon_obj.min_purchase} required for coupon '{coupon_code_clean}'")

        if coupon_obj.discount_type == "flat":
            discount_amount = min(coupon_obj.value, gross_amount)
        else:
            discount_amount = min((gross_amount * coupon_obj.value / Decimal("100")).quantize(Decimal("0.01")), gross_amount)

        coupon_obj.used_count += 1

    net_amount = max(Decimal("0"), gross_amount - discount_amount)

    # 2. Redeem Offer if provided
    offer_redeemed_title = None
    if payload.offer_state_id:
        try:
            redemption = redeem_offer_atomic(
                db=db,
                member_id=member_id,
                offer_state_id=payload.offer_state_id,
                merchant_id=merchant_id,
                actor_id=current_user.id,
                amount=net_amount,
            )
            if redemption and redemption.offer_template:
                offer_redeemed_title = redemption.offer_template.title
        except ServiceError as e:
            raise HTTPException(e.status_hint, detail=e.message)

    # 3. Calculate Points via configured PointsRules
    points_rules = db.query(PointsRule).filter(
        PointsRule.merchant_id == merchant_id,
        PointsRule.is_active == True,
    ).all()

    points_earned = Decimal("0")
    if points_rules:
        for rule in points_rules:
            if rule.rule_type == "per_rupee":
                spend_unit = rule.spend_unit or Decimal("1")
                if spend_unit > Decimal("0"):
                    earned = (net_amount / spend_unit) * rule.points_value
                    points_earned += Decimal(str(int(earned)))
            elif rule.rule_type == "per_visit":
                points_earned += rule.points_value
    else:
        # Default points rule fallback: 1 point per ₹10 spent + 10 points for the visit
        earned_rupee = net_amount / Decimal("10")
        points_earned = Decimal(str(int(earned_rupee))) + Decimal("10")

    # 4. Credit points & log loyalty transaction
    member.loyalty_points = Decimal(str(member.loyalty_points or 0)) + points_earned
    member.total_visits = (member.total_visits or 0) + 1

    # Format audit note
    note_parts = [f"Purchase ₹{gross_amount:.2f}"]
    if coupon_obj:
        note_parts.append(f"Coupon: {coupon_obj.code} (-₹{discount_amount:.2f})")
    if offer_redeemed_title:
        note_parts.append(f"Offer: {offer_redeemed_title}")
    if payload.note:
        note_parts.append(f"Note: {payload.note}")

    audit_note = " | ".join(note_parts)

    txn = LoyaltyTransaction(
        merchant_id=merchant_id,
        member_id=member_id,
        type="earn",
        points=points_earned,
        balance_after=member.loyalty_points,
        note=audit_note,
    )
    db.add(txn)
    db.commit()
    db.refresh(member)

    emit(POINTS_EARNED, {
        "member_id": member_id,
        "merchant_id": merchant_id,
        "points": float(points_earned),
        "new_balance": float(member.loyalty_points),
    })

    return PurchaseResult(
        member_id=member.id,
        gross_amount=gross_amount,
        discount_amount=discount_amount,
        net_amount=net_amount,
        points_earned=points_earned,
        new_loyalty_balance=member.loyalty_points,
        coupon_applied=coupon_obj.code if coupon_obj else None,
        offer_redeemed_title=offer_redeemed_title,
        message=f"Purchase recorded! {points_earned} loyalty points earned.",
    )

