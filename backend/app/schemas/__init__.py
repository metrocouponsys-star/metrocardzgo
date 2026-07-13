"""
Metro Cardz — Pydantic Schemas
Request/response validation for all API endpoints.
Mirrors the TypeScript types in app/src/types/index.ts exactly.
"""
from __future__ import annotations
from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    phone: str
    password: str


class OtpRequest(BaseModel):
    phone: str


class OtpVerifyRequest(BaseModel):
    phone: str
    otp: str


class AuthUserOut(BaseModel):
    id: str
    name: str
    phone: str
    role: str
    merchant_id: Optional[str] = None
    merchant_name: Optional[str] = None

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    user: AuthUserOut
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── Merchant ──────────────────────────────────────────────────────────────────
class MerchantOut(BaseModel):
    id: str
    business_name: str
    category: str
    plan_tier: str
    whatsapp_number: str
    logo_url: Optional[str] = None
    address: Optional[str] = None
    status: str
    created_at: datetime
    member_count: Optional[int] = None

    model_config = {"from_attributes": True}


class MerchantCreate(BaseModel):
    business_name: str
    category: str
    plan_tier: str = "Starter"
    whatsapp_number: str = ""
    address: Optional[str] = None
    owner_name: str
    owner_phone: str


class MerchantUpdate(BaseModel):
    business_name: Optional[str] = None
    category: Optional[str] = None
    plan_tier: Optional[str] = None
    whatsapp_number: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None


# ── MerchantUser ──────────────────────────────────────────────────────────────
class MerchantUserOut(BaseModel):
    id: str
    merchant_id: Optional[str]
    name: str
    phone: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MerchantUserCreate(BaseModel):
    name: str
    phone: str
    role: Literal["owner", "staff"] = "staff"


# ── MembershipType ────────────────────────────────────────────────────────────
class MembershipTypeOut(BaseModel):
    id: str
    merchant_id: str
    name: str
    description: str
    member_count: Optional[int] = None

    model_config = {"from_attributes": True}


class MembershipTypeCreate(BaseModel):
    name: str
    description: str = ""


# ── OfferTemplate ─────────────────────────────────────────────────────────────
class OfferTemplateOut(BaseModel):
    id: str
    merchant_id: str
    title: str
    description: str
    offer_type: str
    value: Decimal
    active: bool
    applicable_membership_type_ids: Optional[List[str]] = []
    # Feature 1: Loyalty
    loyalty_points_earn: Optional[Decimal] = None      # points earned when this offer is redeemed
    is_points_redemption: bool = False                  # True if this is a points-redemption reward
    loyalty_points_cost: Optional[Decimal] = None      # points cost for points_redemption offers

    model_config = {"from_attributes": True}


class OfferTemplateCreate(BaseModel):
    title: str
    description: str = ""
    offer_type: Literal[
        "percent_off", "free_service", "wallet_points", "referral", "birthday",
        "points_redemption"
    ]
    value: Decimal = Decimal("0")
    applicable_membership_type_ids: List[str] = []
    # Feature 1: Loyalty
    loyalty_points_earn: Optional[Decimal] = None
    is_points_redemption: bool = False
    loyalty_points_cost: Optional[Decimal] = None


class OfferTemplateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    value: Optional[Decimal] = None
    active: Optional[bool] = None
    applicable_membership_type_ids: Optional[List[str]] = None
    # Feature 1: Loyalty
    loyalty_points_earn: Optional[Decimal] = None
    is_points_redemption: Optional[bool] = None
    loyalty_points_cost: Optional[Decimal] = None


# ── Member ────────────────────────────────────────────────────────────────────
class MemberOfferStateOut(BaseModel):
    id: str
    member_id: str
    offer_template_id: str
    remaining_qty: Optional[Decimal] = None
    initial_qty: Optional[Decimal] = None
    status: str
    offer: Optional[OfferTemplateOut] = None

    model_config = {"from_attributes": True}


class MemberOut(BaseModel):
    id: str
    merchant_id: str
    member_code: str
    public_token: str
    physical_card_number: Optional[str] = None
    name: str
    phone: str
    date_of_birth: Optional[date] = None
    anniversary_date: Optional[date] = None
    membership_type_id: str
    membership_type: Optional[MembershipTypeOut] = None
    joined_date: date
    expiry_date: date
    loyalty_points: Decimal          # renamed from wallet_balance — IS the loyalty points balance
    status: str
    created_at: datetime
    offer_states: Optional[List[MemberOfferStateOut]] = None

    model_config = {"from_attributes": True}


class MemberCreate(BaseModel):
    name: str
    phone: str
    membership_type_id: str
    date_of_birth: Optional[date] = None
    anniversary_date: Optional[date] = None


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    anniversary_date: Optional[date] = None
    membership_type_id: Optional[str] = None
    status: Optional[str] = None


# ── Redemption ────────────────────────────────────────────────────────────────
class RedemptionOut(BaseModel):
    id: str
    member_id: str
    offer_template_id: str
    merchant_user_id: str
    staff_name: Optional[str] = None
    amount: Decimal
    created_at: datetime
    member: Optional[dict] = None
    offer: Optional[dict] = None

    model_config = {"from_attributes": True}


class RedeemRequest(BaseModel):
    member_id: str
    offer_state_id: str


# ── Loyalty Transactions ──────────────────────────────────────────────────────
class LoyaltyTransactionOut(BaseModel):
    id: str
    member_id: str
    merchant_id: str
    type: str                          # 'earn' | 'redeem'
    points: Decimal                    # positive for earn, negative for redeem
    source_redemption_id: Optional[str] = None
    source_offer_id: Optional[str] = None
    source_offer_title: Optional[str] = None   # enriched for display
    balance_after: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class RedeemPointsRequest(BaseModel):
    """Request to redeem loyalty points via a points_redemption offer."""
    member_id: str
    offer_state_id: str   # The MemberOfferState row for the points_redemption offer


# ── Campaign ──────────────────────────────────────────────────────────────────
class CampaignOut(BaseModel):
    id: str
    merchant_id: str
    name: str
    target_audience: str
    target_membership_type_id: Optional[str] = None
    channel: str
    template_text: str
    scheduled_at: Optional[datetime] = None
    status: str
    audience_size: Optional[int] = None
    sent_count: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CampaignCreate(BaseModel):
    name: str
    target_audience: Literal["all", "by_membership_type", "expiring_soon"]
    target_membership_type_id: Optional[str] = None
    channel: Literal["sms", "whatsapp"]
    template_text: str
    scheduled_at: Optional[datetime] = None


# ── Reminder Rule ─────────────────────────────────────────────────────────────
class ReminderRuleOut(BaseModel):
    id: str
    merchant_id: str
    trigger_type: str
    channel: str
    template_text: str
    threshold_value: Optional[Decimal] = None
    active: bool
    # Feature 2: merchant-configurable timing
    send_time: Optional[time] = None       # e.g. "09:00:00"
    days_before: int = 0                   # days before event to send
    timezone: str = "Asia/Kolkata"

    model_config = {"from_attributes": True}


class ReminderRuleUpdate(BaseModel):
    template_text: Optional[str] = None
    channel: Optional[Literal["sms", "whatsapp"]] = None
    threshold_value: Optional[Decimal] = None
    active: Optional[bool] = None
    # Feature 2: merchant-configurable timing
    send_time: Optional[time] = None
    days_before: Optional[int] = Field(default=None, ge=0)  # must be >= 0
    timezone: Optional[str] = None


# ── Public Member View ────────────────────────────────────────────────────────
class PublicMemberView(BaseModel):
    merchant_name: str
    merchant_logo: Optional[str] = None
    merchant_phone: Optional[str] = None
    member_name: str
    membership_type_name: str
    status: str
    expiry_date: date
    loyalty_points: Decimal           # renamed from wallet_balance
    offers: List[dict]


# ── Dashboard Stats ───────────────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_active_members: int
    redemptions_today: int
    expiring_this_week: int
    wallet_points_issued_month: Decimal    # kept for compat — total loyalty_points earned this month
    recent_redemptions: List[RedemptionOut]


# ── Report Data ───────────────────────────────────────────────────────────────
class ReportSummary(BaseModel):
    total_redemptions: int
    active_members: int
    expiring_soon: int
    most_used_offer: str
    points_issued_month: Decimal = Decimal("0")    # Feature 1: points earned this month
    points_redeemed_month: Decimal = Decimal("0")  # Feature 1: points redeemed this month


# ── Card Inventory ────────────────────────────────────────────────────────────
class CardInventoryOut(BaseModel):
    id: str
    card_number: str
    status: str
    allocated_merchant_id: Optional[str] = None
    allocated_merchant_name: Optional[str] = None
    allocated_at: Optional[datetime] = None
    linked_member_id: Optional[str] = None
    linked_member_name: Optional[str] = None
    linked_member_phone: Optional[str] = None
    linked_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AddCardsRequest(BaseModel):
    card_numbers: List[str] = Field(..., min_length=1)


class AllocateCardsRequest(BaseModel):
    card_ids: List[str] = Field(..., min_length=1)


# ── Admin Stats ───────────────────────────────────────────────────────────────
class AdminDashboardStats(BaseModel):
    total_merchants: int
    total_members: int
    redemptions_today: int
    active_merchants: int
    inactive_merchants: int
