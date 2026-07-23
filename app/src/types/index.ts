// ============================================================
// Metro Cardz — Core Types (matches PostgreSQL schema exactly)
// ============================================================

export type MerchantStatus = 'active' | 'suspended';
export type MemberStatus = 'active' | 'expiring_soon' | 'expired' | 'deactivated';
// Feature 1: added 'points_redemption' offer type
export type OfferType = 'percent_off' | 'free_service' | 'wallet_points' | 'referral' | 'birthday' | 'points_redemption';
export type MessageChannel = 'sms' | 'whatsapp';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent';
export type UserRole = 'super_admin' | 'owner' | 'staff';
export type ReminderTrigger = 'birthday' | 'anniversary' | 'loyalty_threshold' | 'expiry';
export type MessageDeliveryStatus = 'sent' | 'failed' | 'delivered';
// Feature 1: loyalty transaction type
export type LoyaltyTxType = 'earn' | 'redeem';

// Physical card inventory status lifecycle:
// unassigned → merchant_allocated → member_linked  (or deactivated at any point)
export type CardStatus = 'unassigned' | 'merchant_allocated' | 'member_linked' | 'deactivated';

export interface CardInventoryItem {
  id: string;
  card_number: string;          // 16-digit printed on physical card, e.g. "4821 6739 0012 3847"
  status: CardStatus;
  allocated_merchant_id?: string;
  allocated_merchant_name?: string;
  allocated_at?: string;
  linked_member_id?: string;
  linked_member_name?: string;
  linked_member_phone?: string;
  linked_at?: string;
  created_by_admin_id?: string;
  created_at: string;
}

export interface Merchant {
  id: string;
  business_name: string;
  category: string;
  plan_tier: string;
  whatsapp_number: string;
  logo_url?: string;
  card_design_url?: string;
  address?: string;
  status: MerchantStatus;
  approval_status?: 'pending' | 'approved' | 'rejected';
  referral_bonus_points?: number;
  created_at: string;
  member_count?: number;
}


export interface MerchantUser {
  id: string;
  merchant_id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  created_at: string;
}

export interface BundledOfferConfig {
  offer_template_id: string;
  title?: string;
  default_qty: number;
}

export interface MembershipType {
  id: string;
  merchant_id: string;
  name: string;
  description: string;
  member_count?: number;
  offers?: OfferTemplate[];
  bundled_offers?: BundledOfferConfig[];
}

export interface Member {
  id: string;
  merchant_id: string;
  member_code: string;       // human-readable e.g. SAL001
  public_token: string;      // opaque token for QR / public URL
  physical_card_number?: string; // 16-digit card number if a physical card is linked
  name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  anniversary_date?: string;
  membership_type_id: string;
  membership_type?: MembershipType;
  joined_date: string;
  expiry_date: string;
  /** Feature 1: renamed from wallet_balance — IS the loyalty points balance */
  loyalty_points: number;
  status: MemberStatus;
  created_at: string;
  offer_states?: MemberOfferState[];
  referred_by_member_id?: string;
  referral_code?: string;
  total_visits?: number;
  notes?: string;
}

export interface OfferTemplate {
  id: string;
  merchant_id: string;
  title: string;
  description: string;
  offer_type: OfferType;
  value: number;
  active: boolean;
  applicable_membership_type_ids?: string[];
  /** Feature 1: points earned when this offer is redeemed (null = earns nothing) */
  loyalty_points_earn?: number | null;
  /** Feature 1: true if this offer is a points-redemption reward */
  is_points_redemption?: boolean;
  /** Feature 1: how many loyalty points this reward costs the member */
  loyalty_points_cost?: number | null;
  min_visits?: number | null;
  min_purchase_amount?: number | null;
}

export interface MemberOfferState {
  id: string;
  member_id: string;
  offer_template_id: string;
  offer?: OfferTemplate;
  remaining_qty: number | null;
  initial_qty: number | null;
  status: 'active' | 'exhausted';
}

export interface Redemption {
  id: string;
  member_id: string;
  member?: Pick<Member, 'name' | 'member_code'>;
  offer_template_id: string;
  offer?: Pick<OfferTemplate, 'title' | 'offer_type'>;
  merchant_user_id: string;
  staff_name?: string;
  amount: number;
  created_at: string;
}

/** Feature 1: a single loyalty points earn or redeem event — the audit trail */
export interface LoyaltyTransaction {
  id: string;
  member_id: string;
  merchant_id: string;
  type: LoyaltyTxType;
  points: number;              // positive for earn, negative for redeem
  source_redemption_id?: string | null;
  source_offer_id?: string | null;
  source_offer_title?: string | null;
  balance_after: number;       // running balance snapshot
  created_at: string;
}

export interface ReminderRule {
  id: string;
  merchant_id: string;
  trigger_type: ReminderTrigger;
  channel: MessageChannel;
  template_text: string;
  threshold_value?: number;
  active: boolean;
  /** Feature 2: time of day to send, e.g. "09:00:00" */
  send_time?: string | null;
  /** Feature 2: how many days before the event to send (0 = on the day) */
  days_before?: number;
  /** Feature 2: IANA timezone, default Asia/Kolkata */
  timezone?: string;
}

export interface Campaign {
  id: string;
  merchant_id: string;
  name: string;
  target_audience: 'all' | 'by_membership_type' | 'expiring_soon';
  target_membership_type_id?: string;
  channel: MessageChannel;
  template_text: string;
  scheduled_at?: string;
  status: CampaignStatus;
  audience_size?: number;
  sent_count?: number;
  created_at: string;
}

export interface MessageLog {
  id: string;
  member_id: string;
  campaign_id?: string;
  reminder_rule_id?: string;
  channel: MessageChannel;
  status: MessageDeliveryStatus;
  sent_at: string;
}

export interface DashboardStats {
  total_active_members: number;
  redemptions_today: number;
  expiring_this_month: number;
  expiring_this_week?: number;
  wallet_points_issued_month: number;
  recent_redemptions: Redemption[];
}

export interface PointsRule {
  id: string;
  merchant_id: string;
  rule_type: 'per_visit' | 'per_rupee';
  points_value: number;
  spend_unit?: number;
  is_active: boolean;
  created_at: string;
}

export interface ReportData {
  redemptions_by_offer: { offer_type: string; count: number }[];
  redemptions_over_time: { date: string; count: number }[];
  all_redemptions: Redemption[];
  summary: {
    total_redemptions: number;
    active_members: number;
    expiring_soon: number;
    most_used_offer: string;
    /** Feature 1: points earned this month */
    points_issued_month?: number;
    /** Feature 1: points redeemed this month */
    points_redeemed_month?: number;
  };
}

export interface AdminDashboardStats {
  total_merchants: number;
  total_members: number;
  redemptions_today: number;
  active_merchants: number;
  inactive_merchants: number;
  pending_approvals?: number;
  recent_merchant_activity: { merchant_id: string; business_name: string; action: string; at: string }[];
}

// Auth Types
export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  merchant_id?: string;
  merchant_name?: string;
  logo_url?: string;
}

export interface LoginResponse {
  user: AuthUser;
  access_token: string;
}

export interface PublicMemberView {
  member_id: string;            // added — backend returns this
  merchant_name: string;
  merchant_logo?: string;
  merchant_phone?: string;
  member_name: string;
  membership_type_name: string;
  status: MemberStatus;
  expiry_date: string;
  /** Feature 1: renamed from wallet_balance */
  loyalty_points: number;
  offers: Pick<OfferTemplate, 'id' | 'title' | 'description' | 'offer_type' | 'value'>[];
}
