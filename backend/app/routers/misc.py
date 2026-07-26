"""Offers, MembershipTypes, Campaigns, Reminders, Reports, Public, and Health routers."""
# ── Offers ──────────────────────────────────────────────────────────────────────────────
from fastapi import APIRouter, Depends, HTTPException, status, Response, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sqlfunc, desc, cast, Date
from typing import List, Optional
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
import csv
import io

from app.core.deps import get_db, get_current_active_user, get_merchant_id
from app.models.offer import OfferTemplate
from app.models.member import MembershipType, MembershipTypeOffer, Member, MemberOfferState
from app.models.campaign import Campaign, ReminderRule, MessageLog
from app.models.redemption import RedemptionLog
from app.models.merchant import Merchant
from app.models.loyalty import LoyaltyTransaction
from pydantic import BaseModel
from app.schemas import (
    OfferTemplateCreate, OfferTemplateUpdate, OfferTemplateOut,
    MembershipTypeCreate, MembershipTypeUpdate, MembershipTypeOut,
    CampaignCreate, CampaignOut,
    ReminderRuleCreate, ReminderRuleUpdate, ReminderRuleOut,
    DashboardStats, RedemptionOut, PublicMemberView, MembershipLookupRequest,
    NewMembersDataPoint, TopCustomer, PointsDataPoint, RetentionDataPoint,
    MerchantUpdate, MerchantOut,
)
from app.core.rate_limit import public_rate_limit, membership_lookup_rate_limit
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


def _sync_offer_to_all_members(db: Session, merchant_id: str, offer_id: str, applicable_membership_type_ids: list = None):
    """Auto-populate MemberOfferState for existing members when a new offer is created or updated."""
    import uuid
    from decimal import Decimal as Dec
    from app.models.member import Member, MemberOfferState
    from app.models.offer import OfferTemplate

    tmpl = db.query(OfferTemplate).filter(OfferTemplate.id == offer_id, OfferTemplate.active == True).first()
    if not tmpl:
        return

    query = db.query(Member).filter(Member.merchant_id == merchant_id)
    if applicable_membership_type_ids and len(applicable_membership_type_ids) > 0:
        query = query.filter(Member.membership_type_id.in_(applicable_membership_type_ids))

    members = query.all()
    if not members:
        return

    existing_member_ids = {
        s.member_id for s in db.query(MemberOfferState.member_id).filter(MemberOfferState.offer_template_id == offer_id).all()
    }

    created = False
    for m in members:
        if m.id not in existing_member_ids:
            qty = None if tmpl.offer_type in ('percent_off', 'birthday', 'referral') else Dec("5")
            db.add(MemberOfferState(
                id=str(uuid.uuid4()),
                member_id=m.id,
                offer_template_id=offer_id,
                remaining_qty=qty,
                initial_qty=qty,
                status="active",
            ))
            created = True

    if created:
        try:
            db.commit()
        except Exception:
            db.rollback()


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

    # Immediately sync this new offer to all existing applicable members
    _sync_offer_to_all_members(db, merchant_id, offer.id, payload.applicable_membership_type_ids)

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
    # Re-populate applicable_membership_type_ids so the response matches what list_offers returns
    links = db.query(MembershipTypeOffer).filter(MembershipTypeOffer.offer_template_id == offer_id).all()
    offer.applicable_membership_type_ids = [link.membership_type_id for link in links]

    # Re-sync offer to any applicable members who don't have offer state yet
    _sync_offer_to_all_members(db, merchant_id, offer.id, offer.applicable_membership_type_ids)

    return offer


@offers_router.delete("/{offer_id}", status_code=204)
def delete_offer(
    offer_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Delete an offer template by deactivating it (soft delete)."""
    offer = db.query(OfferTemplate).filter(
        OfferTemplate.id == offer_id, OfferTemplate.merchant_id == merchant_id
    ).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    offer.active = False
    db.commit()



# ── MembershipTypes Router ────────────────────────────────────────────────────
membership_types_router = APIRouter(prefix="/membership-types", tags=["membership-types"])


def _populate_membership_type_details(mt: MembershipType, db: Session):
    mt.member_count = db.query(Member).filter(
        Member.membership_type_id == mt.id, Member.status == "active"
    ).count()

    links = db.query(MembershipTypeOffer).filter(
        MembershipTypeOffer.membership_type_id == mt.id
    ).all()
    bundled = []
    for link in links:
        offer_tmpl = db.query(OfferTemplate).filter(OfferTemplate.id == link.offer_template_id).first()
        title = offer_tmpl.title if offer_tmpl else None
        bundled.append({
            "offer_template_id": link.offer_template_id,
            "title": title,
            "default_qty": link.default_qty or 1,
        })
    mt.offers = bundled
    return mt


@membership_types_router.get("", response_model=List[MembershipTypeOut])
def list_membership_types(merchant_id: str = Depends(get_merchant_id), db: Session = Depends(get_db)):
    types = db.query(MembershipType).filter(MembershipType.merchant_id == merchant_id).all()
    for mt in types:
        _populate_membership_type_details(mt, db)
    return types


@membership_types_router.post("", response_model=MembershipTypeOut, status_code=201)
def create_membership_type(
    payload: MembershipTypeCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    mt = MembershipType(merchant_id=merchant_id, name=payload.name, description=payload.description)
    db.add(mt)
    db.flush()

    if payload.bundled_offers:
        for bo in payload.bundled_offers:
            link = MembershipTypeOffer(
                membership_type_id=mt.id,
                offer_template_id=bo.offer_template_id,
                default_qty=bo.default_qty or 1,
            )
            db.add(link)

    db.commit()
    db.refresh(mt)
    _populate_membership_type_details(mt, db)
    return mt


@membership_types_router.patch("/{type_id}", response_model=MembershipTypeOut)
def update_membership_type(
    type_id: str,
    payload: MembershipTypeUpdate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    mt = db.query(MembershipType).filter(
        MembershipType.id == type_id, MembershipType.merchant_id == merchant_id
    ).first()
    if not mt:
        raise HTTPException(status_code=404, detail="Membership type not found")

    if payload.name is not None:
        mt.name = payload.name
    if payload.description is not None:
        mt.description = payload.description

    if payload.bundled_offers is not None:
        # Clear existing links
        db.query(MembershipTypeOffer).filter(
            MembershipTypeOffer.membership_type_id == type_id
        ).delete()
        # Add new links
        for bo in payload.bundled_offers:
            link = MembershipTypeOffer(
                membership_type_id=type_id,
                offer_template_id=bo.offer_template_id,
                default_qty=bo.default_qty or 1,
            )
            db.add(link)

    db.commit()
    db.refresh(mt)
    _populate_membership_type_details(mt, db)
    return mt


@membership_types_router.delete("/{type_id}", status_code=204)
def delete_membership_type(
    type_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Delete a membership type if no active members are using it."""
    mt = db.query(MembershipType).filter(
        MembershipType.id == type_id, MembershipType.merchant_id == merchant_id
    ).first()
    if not mt:
        raise HTTPException(status_code=404, detail="Membership type not found")
    active_member_count = db.query(Member).filter(
        Member.membership_type_id == type_id,
        Member.status.in_(["active", "expiring_soon"]),
    ).count()
    if active_member_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete membership type with {active_member_count} active member(s).",
        )
    db.delete(mt)
    db.commit()



# ── Campaigns Router ──────────────────────────────────────────────────────────
campaigns_router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@campaigns_router.get("", response_model=List[CampaignOut])
def list_campaigns(merchant_id: str = Depends(get_merchant_id), db: Session = Depends(get_db)):
    return db.query(Campaign).filter(Campaign.merchant_id == merchant_id).order_by(Campaign.created_at.desc()).all()


@campaigns_router.post("", response_model=CampaignOut, status_code=201)
def create_campaign(
    payload: CampaignCreate,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # Calculate audience size
    q = db.query(Member).filter(Member.merchant_id == merchant_id, Member.status == "active")
    if payload.target_audience == "expiring_soon":
        soon = date.today() + timedelta(days=30)
        q = q.filter(Member.expiry_date <= soon)
    elif payload.target_audience == "by_membership_type" and payload.target_membership_type_id:
        q = q.filter(Member.membership_type_id == payload.target_membership_type_id)
    audience_size = q.count()

    send_now = payload.send_now or not payload.scheduled_at
    campaign = Campaign(
        merchant_id=merchant_id,
        name=payload.name,
        target_audience=payload.target_audience,
        target_membership_type_id=payload.target_membership_type_id,
        channel=payload.channel,
        template_text=payload.template_text,
        scheduled_at=payload.scheduled_at,
        status="sending" if send_now else "scheduled",
        audience_size=audience_size,
        sent_count=0,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Dispatch immediately if send_now or no schedule
    if send_now:
        _dispatch_campaign_now(campaign.id, merchant_id, db)

    return campaign


def _dispatch_campaign_now(campaign_id: str, merchant_id: str, db):
    """Background dispatch of campaign messages. Runs synchronously on Render free tier."""
    from app.worker import dispatch_message
    from app.models.merchant import Merchant as M

    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return
    merchant = db.query(M).filter(M.id == merchant_id).first()

    q = db.query(Member).filter(Member.merchant_id == merchant_id, Member.status == "active")
    if campaign.target_audience == "expiring_soon":
        soon = date.today() + timedelta(days=30)
        q = q.filter(Member.expiry_date <= soon)
    elif campaign.target_audience == "by_membership_type" and campaign.target_membership_type_id:
        q = q.filter(Member.membership_type_id == campaign.target_membership_type_id)
    members = q.all()

    for i, member in enumerate(members):
        try:
            dispatch_message.apply_async(
                kwargs={
                    "member_id": member.id,
                    "rule_id": campaign.id,
                    "channel": campaign.channel,
                    "template_text": campaign.template_text,
                    "member_name": member.name,
                    "merchant_name": merchant.business_name if merchant else "",
                },
                countdown=i * 1,   # stagger by 1 second each to avoid rate limits
            )
        except Exception:
            pass  # Celery not available on free tier — messages are queued for webhook trigger

    campaign.status = "sent"
    campaign.sent_count = len(members)
    db.commit()


@campaigns_router.post("/{campaign_id}/send", response_model=CampaignOut)
def send_campaign_now(
    campaign_id: str,
    merchant_id: str = Depends(get_merchant_id),
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Manually trigger dispatch of a scheduled campaign."""
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.merchant_id == merchant_id,
    ).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status == "sent":
        raise HTTPException(status_code=400, detail="Campaign already sent")
    _dispatch_campaign_now(campaign_id, merchant_id, db)
    db.refresh(campaign)
    return campaign



# ── Reminders Router ──────────────────────────────────────────────────────────
reminders_router = APIRouter(prefix="/reminders", tags=["reminders"])


@reminders_router.get("", response_model=List[ReminderRuleOut])
def list_reminders(merchant_id: str = Depends(get_merchant_id), db: Session = Depends(get_db)):
    return db.query(ReminderRule).filter(ReminderRule.merchant_id == merchant_id).all()


@reminders_router.post("", response_model=ReminderRuleOut, status_code=201)
def create_reminder(
    payload: ReminderRuleCreate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    rule = ReminderRule(
        merchant_id=merchant_id,
        trigger_type=payload.trigger_type,
        channel=payload.channel,
        template_text=payload.template_text,
        threshold_value=payload.threshold_value,
        active=payload.active,
        send_time=payload.send_time,
        days_before=payload.days_before,
        timezone=payload.timezone,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


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


@reminders_router.delete("/{rule_id}", status_code=204)
def delete_reminder(
    rule_id: str,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    rule = db.query(ReminderRule).filter(
        ReminderRule.id == rule_id, ReminderRule.merchant_id == merchant_id
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Reminder rule not found")
    db.delete(rule)
    db.commit()


# ── Dashboard / Reports Router ────────────────────────────────────────────────
dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@dashboard_router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_end = date.today() + timedelta(days=30)

    active_members = db.query(Member).filter(
        Member.merchant_id == merchant_id, Member.status == "active"
    ).count()
    redemptions_today = db.query(RedemptionLog).join(Member).filter(
        Member.merchant_id == merchant_id,
        RedemptionLog.created_at >= today_start,
    ).count()
    expiring_this_month = db.query(Member).filter(
        Member.merchant_id == merchant_id,
        Member.expiry_date <= month_end,
        Member.expiry_date >= date.today(),
        Member.status == "active",
    ).count()
    expiring_this_week = db.query(Member).filter(
        Member.merchant_id == merchant_id,
        Member.expiry_date <= date.today() + timedelta(days=7),
        Member.expiry_date >= date.today(),
        Member.status == "active",
    ).count()

    # Feature 1: loyalty points issued this month
    points_issued_row = db.query(sqlfunc.sum(LoyaltyTransaction.points)).filter(
        LoyaltyTransaction.merchant_id == merchant_id,
        LoyaltyTransaction.type == "earn",
        LoyaltyTransaction.created_at >= month_start,
    ).scalar()
    wallet_points_issued_month = points_issued_row or 0

    # FIX 6: Eager-load all 3 relations in a single JOIN query.
    # Previously: 3 lazy loads × 10 rows = 30 extra DB round trips on every dashboard load.
    recent = (
        db.query(RedemptionLog)
        .join(Member)
        .filter(Member.merchant_id == merchant_id)
        .options(
            joinedload(RedemptionLog.staff_user),
            joinedload(RedemptionLog.member),
            joinedload(RedemptionLog.offer_template),
        )
        .order_by(RedemptionLog.created_at.desc())
        .limit(10)
        .all()
    )

    return DashboardStats(
        total_active_members=active_members,
        redemptions_today=redemptions_today,
        expiring_this_month=expiring_this_month,
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


# ── Reports Router ────────────────────────────────────────────────────────────
reports_router = APIRouter(prefix="/reports", tags=["reports"])


@reports_router.get("/new-members", response_model=List[NewMembersDataPoint])
def report_new_members(
    days: int = 30,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Return daily new member counts for the last N days.

    FIX 7: Previously fired one COUNT query per day (up to 30 round trips).
    Now uses a single GROUP BY DATE aggregation — one query regardless of N.
    """
    today = date.today()
    since = today - timedelta(days=days - 1)

    # Single aggregation query: one DB round trip for all N days
    rows = (
        db.query(
            cast(Member.created_at, Date).label("day"),
            sqlfunc.count(Member.id).label("count"),
        )
        .filter(
            Member.merchant_id == merchant_id,
            Member.created_at >= datetime.combine(since, datetime.min.time()).replace(tzinfo=timezone.utc),
        )
        .group_by(cast(Member.created_at, Date))
        .all()
    )

    # Build a lookup dict from the query results
    count_by_day = {row.day: row.count for row in rows}

    # Fill in zeros for days with no new members
    result = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        result.append(NewMembersDataPoint(date=d.isoformat(), count=count_by_day.get(d, 0)))
    return result


@reports_router.get("/top-customers", response_model=List[TopCustomer])
def report_top_customers(
    limit: int = 10,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Return top N customers by redemption count."""
    rows = (
        db.query(
            Member.id,
            Member.name,
            Member.phone,
            Member.member_code,
            Member.loyalty_points,
            Member.total_visits,
            sqlfunc.count(RedemptionLog.id).label("redemption_count"),
        )
        .join(RedemptionLog, RedemptionLog.member_id == Member.id, isouter=True)
        .filter(Member.merchant_id == merchant_id)
        .group_by(Member.id)
        .order_by(desc("redemption_count"))
        .limit(limit)
        .all()
    )
    return [
        TopCustomer(
            member_id=r.id,
            name=r.name,
            phone=r.phone,
            member_code=r.member_code,
            redemption_count=r.redemption_count or 0,
            loyalty_points=r.loyalty_points or Decimal("0"),
            total_visits=r.total_visits or 0,
        )
        for r in rows
    ]


@reports_router.get("/points", response_model=List[PointsDataPoint])
def report_points(
    weeks: int = 12,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Return weekly points earned vs redeemed for the last N weeks."""
    result = []
    today = date.today()
    for i in range(weeks - 1, -1, -1):
        week_start = datetime.combine(today - timedelta(days=today.weekday() + 7 * i), datetime.min.time()).replace(tzinfo=timezone.utc)
        week_end = week_start + timedelta(days=7)
        week_label = week_start.strftime("%Y-W%V")

        earned = db.query(sqlfunc.sum(LoyaltyTransaction.points)).filter(
            LoyaltyTransaction.merchant_id == merchant_id,
            LoyaltyTransaction.type == "earn",
            LoyaltyTransaction.created_at >= week_start,
            LoyaltyTransaction.created_at < week_end,
        ).scalar() or Decimal("0")

        redeemed = db.query(sqlfunc.sum(sqlfunc.abs(LoyaltyTransaction.points))).filter(
            LoyaltyTransaction.merchant_id == merchant_id,
            LoyaltyTransaction.type == "redeem",
            LoyaltyTransaction.created_at >= week_start,
            LoyaltyTransaction.created_at < week_end,
        ).scalar() or Decimal("0")

        result.append(PointsDataPoint(week=week_label, points_earned=earned, points_redeemed=redeemed))
    return result


@reports_router.get("/export/members")
def export_members_csv(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Export all members as a CSV file download."""
    members = db.query(Member).filter(Member.merchant_id == merchant_id).order_by(Member.member_code).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Member Code", "Name", "Phone", "Email", "Membership Type",
        "Status", "Joined Date", "Expiry Date", "Loyalty Points",
        "Total Visits", "Referral Code", "Date of Birth", "Anniversary", "Notes"
    ])
    for m in members:
        writer.writerow([
            m.member_code, m.name, m.phone, m.email or "",
            m.membership_type.name if m.membership_type else "",
            m.status, m.joined_date, m.expiry_date,
            float(m.loyalty_points or 0), m.total_visits or 0,
            m.referral_code or "",
            m.date_of_birth or "", m.anniversary_date or "",
            m.notes or "",
        ])

    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=members.csv"},
    )


@reports_router.get("/retention", response_model=List[RetentionDataPoint])
def report_retention(
    cohort_months: int = 6,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    """Return monthly cohort retention: members who joined in month X and redeemed in last 30 days."""
    from datetime import date as _date, timedelta as _td
    today = _date.today()
    last_30_start = today - _td(days=30)
    result = []

    for i in range(cohort_months - 1, -1, -1):
        # Calculate cohort month (i months ago)
        month_offset = (today.month - i - 1) % 12 + 1
        year_offset = today.year - ((today.month - i - 1) // 12 + (1 if (today.month - i - 1) < 0 else 0))
        try:
            cohort_start = _date(year_offset, month_offset, 1)
        except ValueError:
            continue
        # Last day of cohort month
        if month_offset == 12:
            cohort_end = _date(year_offset + 1, 1, 1)
        else:
            cohort_end = _date(year_offset, month_offset + 1, 1)

        cohort_members = db.query(Member).filter(
            Member.merchant_id == merchant_id,
            Member.joined_date >= cohort_start,
            Member.joined_date < cohort_end,
        ).all()
        cohort_count = len(cohort_members)

        if cohort_count == 0:
            result.append({
                "cohort": cohort_start.strftime("%b %Y"),
                "joined": 0,
                "retained": 0,
                "retention_rate": 0.0,
            })
            continue

        member_ids = [m.id for m in cohort_members]
        retained = db.query(RedemptionLog.member_id).filter(
            RedemptionLog.member_id.in_(member_ids),
            RedemptionLog.created_at >= datetime.combine(last_30_start, datetime.min.time()).replace(tzinfo=timezone.utc),
        ).distinct().count()

        result.append({
            "cohort": cohort_start.strftime("%b %Y"),
            "joined": cohort_count,
            "retained": retained,
            "retention_rate": round((retained / cohort_count) * 100, 1) if cohort_count > 0 else 0.0,
        })

    return result


# ── Public Self-Check Router ────────────────────────────────────────────────
public_router = APIRouter(prefix="/public", tags=["public"])


def _build_public_member_view(member: Member, merchant: Merchant, db: Session) -> PublicMemberView:
    """Shared read-only view builder used by both the QR-token page and the
    membership-number self-lookup page. Keeping logic in one place ensures
    both entry points always return identical data with zero drift."""

    # Cache scalar IDs BEFORE any DB writes — so they survive session expiry/rollback
    member_id = member.id
    merchant_id = member.merchant_id

    try:
        from app.routers.members import ensure_member_offer_states
        ensure_member_offer_states(db, member)
        db.refresh(member)
    except Exception as err:
        print(f"Notice: offer state sync notice: {err}")
        # Reset the session so subsequent read-only queries are not poisoned
        # by a pending rollback left behind by ensure_member_offer_states.
        try:
            db.rollback()
        except Exception:
            pass
        try:
            db.expire_all()
        except Exception:
            pass

    # Re-fetch member and merchant using cached IDs in case session was reset
    try:
        member = db.query(Member).filter(Member.id == member_id).first() or member
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first() or merchant
    except Exception:
        pass

    mt = getattr(member, "membership_type", None)

    offers = []
    try:
        from app.models.offer import OfferTemplate
        from app.models.member import MemberOfferState
        states = db.query(MemberOfferState).filter(MemberOfferState.member_id == member.id).all()
        for state in states:
            raw_st_status = getattr(state, "status", "active")
            st_status_str = str(getattr(raw_st_status, "value", raw_st_status))
            if st_status_str == "active":
                ot = db.query(OfferTemplate).filter(OfferTemplate.id == state.offer_template_id).first()
                if ot and getattr(ot, "active", True):
                    offers.append({
                        "id": state.id,
                        "title": ot.title,
                        "description": getattr(ot, "description", "") or "",
                        "offer_type": str(ot.offer_type),
                        "value": str(ot.value),
                        "remaining_qty": float(state.remaining_qty) if state.remaining_qty is not None else None,
                        "is_points_redemption": getattr(ot, "is_points_redemption", False),
                        "points_cost": float(getattr(ot, "loyalty_points_cost", 0) or 0),
                    })
        # Fallback: if no specific member states exist, populate store active offer templates
        if not offers:
            all_ot = db.query(OfferTemplate).filter(OfferTemplate.merchant_id == member.merchant_id).all()
            for ot in all_ot:
                if getattr(ot, "active", True):
                    offers.append({
                        "id": ot.id,
                        "title": ot.title,
                        "description": getattr(ot, "description", "") or "",
                        "offer_type": str(ot.offer_type),
                        "value": str(ot.value),
                        "remaining_qty": None,
                        "is_points_redemption": getattr(ot, "is_points_redemption", False),
                        "points_cost": float(getattr(ot, "loyalty_points_cost", 0) or 0),
                    })
    except Exception as err:
        print(f"Notice: offers build notice: {err}")

    draws_out = []
    try:
        from app.models.rewards import LuckyDraw, LuckyDrawEntry
        open_draws = db.query(LuckyDraw).filter(
            LuckyDraw.merchant_id == member.merchant_id,
            LuckyDraw.status == "open",
        ).all()
        for draw in open_draws:
            already_entered = db.query(LuckyDrawEntry).filter(
                LuckyDrawEntry.draw_id == draw.id,
                LuckyDrawEntry.member_id == member.id,
            ).first() is not None
            draws_out.append({
                "id": draw.id,
                "name": draw.name,
                "prize": draw.prize,
                "draw_date": str(draw.draw_date) if getattr(draw, "draw_date", None) else None,
                "min_points": float(getattr(draw, "min_points", 0) or 0),
                "min_visits": getattr(draw, "min_visits", 0) or 0,
                "already_entered": already_entered,
                "eligible": float(member.loyalty_points or 0) >= float(getattr(draw, "min_points", 0) or 0) and (member.total_visits or 0) >= (getattr(draw, "min_visits", 0) or 0),
            })
    except Exception as err:
        print(f"Notice: lucky draws notice: {err}")

    coupons_out = []
    try:
        from app.models.rewards import CouponCode
        from datetime import date as date_cls
        today_date = date_cls.today()
        active_coupons = db.query(CouponCode).filter(
            CouponCode.merchant_id == merchant_id,
            CouponCode.is_active == True,
        ).all()
        for c in active_coupons:
            try:
                exp = getattr(c, "expires_at", None)
                if exp and exp < today_date:
                    continue
                coupons_out.append({
                    "id": str(c.id),
                    "code": str(c.code),
                    "discount_type": str(c.discount_type),
                    "value": float(c.value or 0),
                    "min_purchase": float(getattr(c, "min_purchase", 0) or 0),
                    "active_days": getattr(c, "active_days", None),
                    "expires_at": str(exp) if exp else None,
                })
            except Exception as item_err:
                print(f"Notice: coupon item parse error: {item_err}")
    except Exception as err:
        print(f"Notice: coupons build notice: {err}")

    rewards_out = []
    try:
        from app.models.rewards import RewardCatalog
        active_rewards = db.query(RewardCatalog).filter(
            RewardCatalog.merchant_id == merchant_id,
            RewardCatalog.is_active == True,
        ).order_by(RewardCatalog.created_at.desc()).all()
        for r in active_rewards:
            try:
                rewards_out.append({
                    "id": str(r.id),
                    "name": str(r.name),
                    "description": getattr(r, "description", "") or "",
                    "points_cost": float(r.points_cost or 0),
                    "quantity_available": getattr(r, "quantity_available", None),
                })
            except Exception as item_err:
                print(f"Notice: reward item parse error: {item_err}")
    except Exception as err:
        print(f"Notice: rewards build notice: {err}")

    # Calculate actual points balance from member record or sum of loyalty transactions
    pts_balance = float(member.loyalty_points or 0)
    try:
        from app.models.loyalty import LoyaltyTransaction
        from sqlalchemy import func
        tx_points = db.query(func.sum(LoyaltyTransaction.points)).filter(
            LoyaltyTransaction.member_id == member_id
        ).scalar()
        if tx_points is not None and float(tx_points) > pts_balance:
            pts_balance = float(tx_points)
    except Exception as err:
        print(f"Notice: points sum notice: {err}")

    redemptions_out = []
    try:
        from app.models.redemption import RedemptionLog
        from app.models.offer import OfferTemplate
        reds = db.query(RedemptionLog).filter(
            RedemptionLog.member_id == member_id
        ).order_by(RedemptionLog.created_at.desc()).limit(20).all()
        for r in reds:
            ot_title = "Redemption"
            if r.offer_template_id:
                ot = db.query(OfferTemplate).filter(OfferTemplate.id == r.offer_template_id).first()
                if ot:
                    ot_title = ot.title
            redemptions_out.append({
                "id": r.id,
                "offer_title": ot_title,
                "redeemed_at": str(r.created_at) if r.created_at else None,
                "amount_spent": float(r.amount) if r.amount is not None else None,
            })
    except Exception as err:
        print(f"Notice: redemptions build notice: {err}")

    history_out = []
    try:
        from app.models.loyalty import LoyaltyTransaction
        txs = db.query(LoyaltyTransaction).filter(
            LoyaltyTransaction.member_id == member_id
        ).order_by(LoyaltyTransaction.created_at.desc()).limit(20).all()
        for t in txs:
            history_out.append({
                "id": t.id,
                "transaction_type": str(t.type.value if hasattr(t.type, "value") else t.type),
                "points": float(t.points),
                "description": t.note or "",
                "created_at": str(t.created_at) if t.created_at else None,
            })
    except Exception as err:
        print(f"Notice: history build notice: {err}")

    raw_status = getattr(member, "status", "active")
    status_str = getattr(raw_status, "value", str(raw_status or "active"))

    return PublicMemberView(
        member_id=member.id,
        merchant_name=merchant.business_name if merchant else "Store",
        merchant_logo=getattr(merchant, "logo_url", None),
        merchant_phone=getattr(merchant, "whatsapp_number", None),
        member_name=member.name,
        member_code=member.member_code,
        membership_type_name=mt.name if mt else "Standard",
        status=status_str,
        expiry_date=member.expiry_date,
        loyalty_points=pts_balance,
        total_visits=getattr(member, "total_visits", 0) or 0,
        referral_code=getattr(member, "referral_code", None),
        physical_card_number=getattr(member, "physical_card_number", None),
        offers=offers,
        open_lucky_draws=draws_out,
        coupons=coupons_out,
        rewards=rewards_out,
        redemptions=redemptions_out,
        loyalty_history=history_out,
    )


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
    return _build_public_member_view(member, merchant, db)


@public_router.post("/lookup-membership", response_model=PublicMemberView)
def lookup_membership(payload: MembershipLookupRequest, request: Request, db: Session = Depends(get_db)):
    """
    Customer self-lookup by membership number (e.g. SAL001, #MC0004) or mobile number —
    no login required.
    """
    try:
        membership_lookup_rate_limit(request)

        id_clean = (payload.identifier or "").strip()
        last4 = (payload.last4 or "").strip()

        if not id_clean or not last4.isdigit() or len(last4) != 4:
            raise HTTPException(
                status_code=400,
                detail="Enter your membership/mobile number and the last 4 digits of your registered mobile number",
            )

        # Extract digits and clean identifiers
        id_digits = "".join(c for c in id_clean if c.isdigit())
        id_strip_hash = id_clean.lstrip("#").strip().lower()
        last10 = id_digits[-10:] if len(id_digits) >= 10 else id_digits

        members_list = db.query(Member).all()
        verified = []

        for m in members_list:
            m_phone_digits = "".join(c for c in (m.phone or "") if c.isdigit())
            m_card_digits = "".join(c for c in (m.physical_card_number or "") if c.isdigit())
            m_code = (m.member_code or "").strip().lower()
            m_code_strip = m_code.lstrip("#").strip()

            # Step 1: Security verification gate — last 4 digits of registered mobile MUST match
            if not m_phone_digits or m_phone_digits[-4:] != last4:
                continue

            # Step 2: Identifier matching across Member Code, Phone, and Card Number
            matches = False

            # Match A: Member Code (e.g. #MC0004, MC0004, SAL001)
            if id_strip_hash and (m_code == id_strip_hash or m_code_strip == id_strip_hash or id_strip_hash in m_code):
                matches = True
            # Match B: Mobile Number (last 10 digits or exact digits)
            elif last10 and len(id_digits) >= 10 and m_phone_digits.endswith(last10):
                matches = True
            # Match C: Physical Card Number (16-digit card number)
            elif id_digits and len(id_digits) >= 6 and m_card_digits and m_card_digits.endswith(id_digits):
                matches = True
            # Match D: Exact string containment fallback
            elif id_clean and (id_clean in (m.phone or "") or id_clean in (m.physical_card_number or "")):
                matches = True

            if matches:
                verified.append(m)

        if len(verified) == 0:
            raise HTTPException(
                status_code=404,
                detail="No matching membership found. Please check your details and try again.",
            )

        from datetime import datetime
        member = sorted(
            verified,
            key=lambda m: (
                getattr(m, "status", "active") == "active",
                float(getattr(m, "loyalty_points", 0) or 0),
                getattr(m, "updated_at", None) or getattr(m, "created_at", None) or datetime.min
            ),
            reverse=True
        )[0]
        merchant = db.query(Merchant).filter(Merchant.id == member.merchant_id).first()
        if not merchant or merchant.status != "active":
            raise HTTPException(
                status_code=404,
                detail="No matching membership found. Please check your details and try again.",
            )

        return _build_public_member_view(member, merchant, db)

    except HTTPException:
        raise
    except Exception as err:
        print(f"Error in lookup_membership: {err}")
        raise HTTPException(
            status_code=404,
            detail="No matching membership found. Please check your details and try again.",
        )


@public_router.get("/member-catalog")
def get_public_member_catalog(member_id: str = Query(...), db: Session = Depends(get_db)):
    """
    No-auth endpoint: returns active rewards catalog + active coupons for the merchant
    that owns the given member. Used by the public check-membership page to fetch
    rewards/coupons separately (same pattern as the authenticated merchant portal).
    """
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        return {"rewards": [], "coupons": []}

    merchant_id = member.merchant_id

    rewards_out = []
    try:
        from app.models.rewards import RewardCatalog
        for r in db.query(RewardCatalog).filter(
            RewardCatalog.merchant_id == merchant_id,
            RewardCatalog.is_active == True,
        ).order_by(RewardCatalog.created_at.desc()).all():
            try:
                rewards_out.append({
                    "id": r.id,
                    "name": r.name,
                    "description": r.description or "",
                    "points_cost": float(r.points_cost or 0),
                    "quantity_available": r.quantity_available,
                })
            except Exception:
                pass
    except Exception as err:
        print(f"public member-catalog rewards error: {err}")

    coupons_out = []
    try:
        from app.models.rewards import CouponCode
        from datetime import date as date_type
        today = date_type.today()
        for c in db.query(CouponCode).filter(
            CouponCode.merchant_id == merchant_id,
            CouponCode.is_active == True,
        ).all():
            try:
                exp = c.expires_at
                if exp and exp < today:
                    continue
                coupons_out.append({
                    "id": c.id,
                    "code": c.code,
                    "discount_type": str(c.discount_type),
                    "value": float(c.value or 0),
                    "min_purchase": float(c.min_purchase or 0),
                    "active_days": c.active_days or None,
                    "expires_at": str(exp) if exp else None,
                })
            except Exception:
                pass
    except Exception as err:
        print(f"public member-catalog coupons error: {err}")

    return {"rewards": rewards_out, "coupons": coupons_out}


@public_router.post("/lucky-draws/{draw_id}/enter")
def public_enter_lucky_draw(draw_id: str, token: str = Query(...), request: Request = None, db: Session = Depends(get_db)):
    """Public self-entry endpoint allowing members to enter lucky draws using their public token."""
    if request:
        public_rate_limit(request)
    member = db.query(Member).filter(Member.public_token == token).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    draw = db.query(LuckyDraw).filter(LuckyDraw.id == draw_id, LuckyDraw.merchant_id == member.merchant_id).first()
    if not draw or draw.status != "open":
        raise HTTPException(400, detail="Draw is not open for entries")

    if float(member.loyalty_points or 0) < float(draw.min_points):
        raise HTTPException(400, detail=f"Member needs at least {draw.min_points} points to enter")
    if (member.total_visits or 0) < draw.min_visits:
        raise HTTPException(400, detail=f"Member needs at least {draw.min_visits} visits to enter")

    existing = db.query(LuckyDrawEntry).filter(
        LuckyDrawEntry.draw_id == draw_id, LuckyDrawEntry.member_id == member.id
    ).first()
    if existing:
        raise HTTPException(409, detail="Already entered this draw")

    entry = LuckyDrawEntry(draw_id=draw_id, member_id=member.id)
    db.add(entry)
    db.commit()
    return {"message": "Entered draw successfully!"}


# ── Health Router ─────────────────────────────────────────────────────────────
health_router = APIRouter(tags=["health"])


@health_router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Used by UptimeRobot and GitHub Actions keep-alive cron to prevent Render.com sleep."""
    from app.core.config import settings
    db_type = "sqlite" if settings.database_url.startswith("sqlite") else "postgresql"
    # Quick DB connectivity probe
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db_ok = True
    except Exception as e:
        db_ok = False
    return {
        "status": "ok",
        "service": "Metro Cardz API",
        "db_type": db_type,
        "db_ok": db_ok,
    }


# ── Internal Cron Trigger ─────────────────────────────────────────────────────
internal_router = APIRouter(prefix="/internal", tags=["internal"])


@internal_router.post("/run-reminders")
def run_reminders_now(request: Request, db: Session = Depends(get_db)):
    """
    Called by GitHub Actions hourly cron.
    Protected by X-Internal-Key header so only the cron can trigger it.
    On Render free tier, runs the reminder scan synchronously instead of via Celery.
    """
    from app.core.config import settings
    key = request.headers.get("X-Internal-Key", "")
    if settings.internal_cron_key and key != settings.internal_cron_key:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Run the reminder scan synchronously
    from app.worker import hourly_reminder_scan
    try:
        result = hourly_reminder_scan.apply()
        return {"triggered": True, "dispatched": result.result.get("dispatched", 0) if result.result else 0, "message": "OK"}
    except Exception as e:
        return {"triggered": False, "dispatched": 0, "message": str(e)}


# ── Merchant Self-Service Profile Router ────────────────────────────────────
merchant_profile_router = APIRouter(prefix="/merchant/profile", tags=["merchant-profile"])


@merchant_profile_router.get("", response_model=MerchantOut)
def get_my_merchant_profile(
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
    return merchant


@merchant_profile_router.patch("", response_model=MerchantOut)
def update_my_merchant_profile(
    payload: MerchantUpdate,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(merchant, k, v)
    db.commit()
    db.refresh(merchant)
    merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
    return merchant


class LogoUploadRequest(BaseModel):
    logo_data_url: str


@merchant_profile_router.post("/logo", response_model=MerchantOut)
async def upload_my_merchant_logo(
    payload: LogoUploadRequest,
    merchant_id: str = Depends(get_merchant_id),
    db: Session = Depends(get_db),
):
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    if not payload.logo_data_url.strip():
        merchant.logo_url = None
        db.commit()
        db.refresh(merchant)
        merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
        return merchant

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

    if len(raw_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 10 MB limit")

    from app.utils.image_utils import compress_logo, upload_logo_to_storage

    try:
        compressed_webp = compress_logo(raw_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Upload to Supabase Storage and get public URL
    try:
        logo_url = upload_logo_to_storage(merchant_id, compressed_webp)
    except Exception as exc:
        # Fallback: store compressed WebP as a base64 data URL.
        # This keeps the image small (WebP) and prevents DB column overflow.
        import base64
        import logging
        logging.getLogger(__name__).warning(
            "Logo storage upload failed — falling back to inline data URL (merchant=%s): %s",
            merchant_id, exc,
        )
        logo_url = "data:image/webp;base64," + base64.b64encode(compressed_webp).decode("ascii")

    merchant.logo_url = logo_url
    db.commit()
    db.refresh(merchant)
    merchant.member_count = db.query(Member).filter(Member.merchant_id == merchant.id).count()
    return merchant


