"""Offers, MembershipTypes, Campaigns, Reminders, Reports, Public, and Health routers."""
# ── Offers ────────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timezone

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.models.offer import OfferTemplate
from app.models.member import MembershipType, MembershipTypeOffer, Member, MemberOfferState
from app.models.campaign import Campaign, ReminderRule, MessageLog
from app.models.redemption import RedemptionLog
from app.models.merchant import Merchant
from app.models.loyalty import LoyaltyTransaction
from app.schemas import (
    OfferTemplateCreate, OfferTemplateUpdate, OfferTemplateOut,
    MembershipTypeCreate, MembershipTypeOut,
    CampaignCreate, CampaignOut,
    ReminderRuleUpdate, ReminderRuleOut,
    DashboardStats, RedemptionOut, PublicMemberView,
)
from app.core.rate_limit import public_rate_limit
from fastapi import Request

# ── Offers Router ─────────────────────────────────────────────────────────────
offers_router = APIRouter(prefix="/offers", tags=["offers"])


@offers_router.get("", response_model=List[OfferTemplateOut])
def list_offers(merchant_id: str = Depends(get_merchant_id), db: Session = Depends(get_db)):
    offers = db.query(OfferTemplate).filter(
        OfferTemplate.merchant_id == merchant_id
    ).all()
    for offer in offers:
        links = db.query(MembershipTypeOffer).filter(
            MembershipTypeOffer.offer_template_id == offer.id
        ).all()
        offer.applicable_membership_type_ids = [l.membership_type_id for l in links]
    return offers


@offers_router.post("", response_model=OfferTemplateOut, status_code=201)
def create_offer(
    payload: OfferTemplateCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    offer = OfferTemplate(merchant_id=merchant_id, **payload.model_dump(exclude={"applicable_membership_type_ids"}))
    db.add(offer)
    db.flush()
    for mt_id in (payload.applicable_membership_type_ids or []):
        db.add(MembershipTypeOffer(membership_type_id=mt_id, offer_template_id=offer.id))
    db.commit()
    db.refresh(offer)
    offer.applicable_membership_type_ids = payload.applicable_membership_type_ids or []
    return offer


@offers_router.patch("/{offer_id}", response_model=OfferTemplateOut)
def update_offer(
    offer_id: str,
    payload: OfferTemplateUpdate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    offer = db.query(OfferTemplate).filter(
        OfferTemplate.id == offer_id, OfferTemplate.merchant_id == merchant_id
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    for k, v in payload.model_dump(exclude_none=True, exclude={"applicable_membership_type_ids"}).items():
        setattr(offer, k, v)
    if payload.applicable_membership_type_ids is not None:
        db.query(MembershipTypeOffer).filter(MembershipTypeOffer.offer_template_id == offer_id).delete()
        for mt_id in payload.applicable_membership_type_ids:
            db.add(MembershipTypeOffer(membership_type_id=mt_id, offer_template_id=offer_id))
    db.commit()
    db.refresh(offer)
    return offer


# ── MembershipTypes Router ────────────────────────────────────────────────────
membership_types_router = APIRouter(prefix="/membership-types", tags=["membership-types"])


@membership_types_router.get("", response_model=List[MembershipTypeOut])
def list_membership_types(merchant_id: str = Depends(get_merchant_id), db: Session = Depends(get_db)):
    types = db.query(MembershipType).filter(MembershipType.merchant_id == merchant_id).all()
    for mt in types:
        mt.member_count = db.query(Member).filter(
            Member.membership_type_id == mt.id, Member.status == "active"
        ).count()
    return types


@membership_types_router.post("", response_model=MembershipTypeOut, status_code=201)
def create_membership_type(
    payload: MembershipTypeCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    mt = MembershipType(merchant_id=merchant_id, **payload.model_dump())
    db.add(mt)
    db.commit()
    db.refresh(mt)
    mt.member_count = 0
    return mt


# ── Campaigns Router ──────────────────────────────────────────────────────────
campaigns_router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@campaigns_router.get("", response_model=List[CampaignOut])
def list_campaigns(merchant_id: str = Depends(get_merchant_id), db: Session = Depends(get_db)):
    return db.query(Campaign).filter(Campaign.merchant_id == merchant_id).order_by(Campaign.created_at.desc()).all()


@campaigns_router.post("", response_model=CampaignOut, status_code=201)
def create_campaign(
    payload: CampaignCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    # Calculate audience size
    q = db.query(Member).filter(Member.merchant_id == merchant_id)
    if payload.target_audience == "expiring_soon":
        from datetime import timedelta
        soon = date.today() + timedelta(days=30)
        q = q.filter(Member.expiry_date <= soon, Member.status == "active")
    elif payload.target_audience == "by_membership_type" and payload.target_membership_type_id:
        q = q.filter(Member.membership_type_id == payload.target_membership_type_id)
    audience_size = q.count()

    campaign = Campaign(
        merchant_id=merchant_id,
        name=payload.name,
        target_audience=payload.target_audience,
        target_membership_type_id=payload.target_membership_type_id,
        channel=payload.channel,
        template_text=payload.template_text,
        scheduled_at=payload.scheduled_at,
        status="scheduled" if payload.scheduled_at else "sent",
        audience_size=audience_size,
        sent_count=0 if payload.scheduled_at else audience_size,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    # TODO: Enqueue Celery task if send_now
    return campaign


# ── Reminders Router ──────────────────────────────────────────────────────────
reminders_router = APIRouter(prefix="/reminders", tags=["reminders"])


@reminders_router.get("", response_model=List[ReminderRuleOut])
def list_reminders(merchant_id: str = Depends(get_merchant_id), db: Session = Depends(get_db)):
    return db.query(ReminderRule).filter(ReminderRule.merchant_id == merchant_id).all()


@reminders_router.patch("/{rule_id}", response_model=ReminderRuleOut)
def update_reminder(
    rule_id: str,
    payload: ReminderRuleUpdate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    rule = db.query(ReminderRule).filter(
        ReminderRule.id == rule_id, ReminderRule.merchant_id == merchant_id
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Reminder rule not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return rule


# ── Dashboard / Reports Router ────────────────────────────────────────────────
dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@dashboard_router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    from datetime import timedelta
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_end = date.today() + timedelta(days=7)

    active_members = db.query(Member).filter(
        Member.merchant_id == merchant_id, Member.status == "active"
    ).count()
    redemptions_today = db.query(RedemptionLog).join(Member).filter(
        Member.merchant_id == merchant_id,
        RedemptionLog.created_at >= today_start,
    ).count()
    expiring_this_week = db.query(Member).filter(
        Member.merchant_id == merchant_id,
        Member.expiry_date <= week_end,
        Member.expiry_date >= date.today(),
        Member.status == "active",
    ).count()

    # Feature 1: loyalty points issued this month
    from sqlalchemy import func as sqlfunc
    points_issued_row = db.query(sqlfunc.sum(LoyaltyTransaction.points)).filter(
        LoyaltyTransaction.merchant_id == merchant_id,
        LoyaltyTransaction.type == "earn",
        LoyaltyTransaction.created_at >= month_start,
    ).scalar()
    wallet_points_issued_month = points_issued_row or 0

    recent = (
        db.query(RedemptionLog)
        .join(Member)
        .filter(Member.merchant_id == merchant_id)
        .order_by(RedemptionLog.created_at.desc())
        .limit(10)
        .all()
    )

    return DashboardStats(
        total_active_members=active_members,
        redemptions_today=redemptions_today,
        expiring_this_week=expiring_this_week,
        wallet_points_issued_month=wallet_points_issued_month,
        recent_redemptions=[
            RedemptionOut(
                id=r.id, member_id=r.member_id,
                offer_template_id=r.offer_template_id,
                merchant_user_id=r.merchant_user_id,
                staff_name=r.staff_user.name if r.staff_user else None,
                amount=r.amount, created_at=r.created_at,
                member={"name": r.member.name, "member_code": r.member.member_code} if r.member else None,
                offer={"title": r.offer_template.title, "offer_type": r.offer_template.offer_type} if r.offer_template else None,
            )
            for r in recent
        ],
    )


# ── Public Self-Check Router ──────────────────────────────────────────────────
public_router = APIRouter(prefix="/public", tags=["public"])


@public_router.get("/m/{token}", response_model=PublicMemberView)
def get_public_member_view(token: str, request: Request, db: Session = Depends(get_db)):
    """No auth required. Token is opaque HMAC — cannot be guessed or enumerated."""
    public_rate_limit(request)
    member = db.query(Member).filter(Member.public_token == token).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    merchant = db.query(Merchant).filter(Merchant.id == member.merchant_id).first()
    if not merchant or merchant.status != "active":
        raise HTTPException(status_code=404, detail="Not available")
    mt = member.membership_type

    offers = []
    for state in member.offer_states:
        if state.status == "active" and state.offer_template and state.offer_template.active:
            ot = state.offer_template
            offers.append({
                "id": ot.id, "title": ot.title,
                "description": ot.description,
                "offer_type": ot.offer_type, "value": str(ot.value),
            })

    return PublicMemberView(
        merchant_name=merchant.business_name,
        merchant_logo=merchant.logo_url,
        merchant_phone=merchant.whatsapp_number,
        member_name=member.name,
        membership_type_name=mt.name if mt else "Unknown",
        status=member.status,
        expiry_date=member.expiry_date,
        loyalty_points=member.loyalty_points,   # renamed from wallet_balance
        offers=offers,
    )


# ── Health Router ─────────────────────────────────────────────────────────────
health_router = APIRouter(tags=["health"])


@health_router.get("/health")
def health_check():
    """Used by UptimeRobot and GitHub Actions keep-alive cron to prevent Render.com sleep."""
    return {"status": "ok", "service": "Metro Cardz API"}
