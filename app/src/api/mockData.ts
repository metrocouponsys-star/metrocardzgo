import type {
  Merchant, MerchantUser, MembershipType, Member, OfferTemplate,
  MemberOfferState, Redemption, ReminderRule, Campaign,
  DashboardStats, AdminDashboardStats, PublicMemberView, CardInventoryItem,
  LoyaltyTransaction
} from '../types';

// ===== MERCHANTS =====
export const merchants: Merchant[] = [
  {
    id: 'mer-001',
    business_name: 'Glamour Salon & Spa',
    category: 'Salon',
    plan_tier: 'Professional',
    whatsapp_number: '+91 98765 43210',
    logo_url: undefined,
    address: '12, MG Road, Bengaluru, Karnataka 560001',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    member_count: 284,
  },
  {
    id: 'mer-002',
    business_name: 'Lakshmi Kirana & General Stores',
    category: 'Kirana',
    plan_tier: 'Starter',
    whatsapp_number: '+91 99887 12345',
    address: 'Shop No. 4, Jayanagar 4th Block, Bengaluru',
    status: 'active',
    created_at: '2024-02-20T09:00:00Z',
    member_count: 127,
  },
  {
    id: 'mer-003',
    business_name: 'Mehfil Restaurant',
    category: 'Restaurant',
    plan_tier: 'Professional',
    whatsapp_number: '+91 70123 67890',
    address: 'Ground Floor, Indiranagar, Bengaluru',
    status: 'suspended',
    created_at: '2024-03-10T11:00:00Z',
    member_count: 456,
  },
];

// ===== MERCHANT USERS =====
export const merchantUsers: MerchantUser[] = [
  { id: 'usr-001', merchant_id: 'mer-001', name: 'Rajesh Kumar', phone: '+91 98765 43210', role: 'owner', created_at: '2024-01-15T10:00:00Z' },
  { id: 'usr-002', merchant_id: 'mer-001', name: 'Priya Nair', phone: '+91 98765 11111', role: 'staff', created_at: '2024-02-01T10:00:00Z' },
  { id: 'usr-003', merchant_id: 'mer-001', name: 'Rohan Mehta', phone: '+91 98765 22222', role: 'staff', created_at: '2024-03-01T10:00:00Z' },
  { id: 'usr-004', merchant_id: 'mer-002', name: 'Lakshmi Devi', phone: '+91 99887 12345', role: 'owner', created_at: '2024-02-20T09:00:00Z' },
  { id: 'usr-admin', merchant_id: undefined as any, name: 'Super Admin', phone: '+91 90000 00000', role: 'super_admin', created_at: '2024-01-01T00:00:00Z' },
];

// ===== MEMBERSHIP TYPES =====
export const membershipTypes: MembershipType[] = [
  { id: 'mtype-001', merchant_id: 'mer-001', name: 'Prime', description: 'Premium membership with all exclusive benefits and priority service.', member_count: 189 },
  { id: 'mtype-002', merchant_id: 'mer-001', name: 'Standard', description: 'Basic membership with essential discounts and rewards.', member_count: 95 },
  { id: 'mtype-003', merchant_id: 'mer-002', name: 'Gold', description: 'Best rewards on all grocery purchases.', member_count: 127 },
];

// ===== OFFER TEMPLATES =====
export const offerTemplates: OfferTemplate[] = [
  { id: 'off-001', merchant_id: 'mer-001', title: 'Free Hair Wash', description: 'Valid on any premium hair styling service above ₹800. Single use only.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-001'], loyalty_points_earn: 10 },
  { id: 'off-002', merchant_id: 'mer-001', title: '10% Off All Services', description: 'Get a flat 10% discount on total billing. Not applicable on retail products.', offer_type: 'percent_off', value: 10, active: true, applicable_membership_type_ids: ['mtype-001', 'mtype-002'], loyalty_points_earn: 20 },
  { id: 'off-003', merchant_id: 'mer-001', title: 'Complimentary Facial', description: 'Exclusive birthday month reward. Book a slot 24 hours in advance.', offer_type: 'birthday', value: 1, active: true, applicable_membership_type_ids: ['mtype-001'] },
  { id: 'off-004', merchant_id: 'mer-001', title: 'Coffee & Snacks', description: 'Unlimited complimentary refreshments during your visit for Prime members.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-001'], loyalty_points_earn: 5 },
  { id: 'off-005', merchant_id: 'mer-001', title: '15% Anniversary Discount', description: 'Special discount on your anniversary visit. One-time use per year.', offer_type: 'percent_off', value: 15, active: true, applicable_membership_type_ids: ['mtype-001', 'mtype-002'] },
  { id: 'off-006', merchant_id: 'mer-001', title: 'Referral Bonus ₹200', description: 'Earn ₹200 wallet credit for every friend you refer who joins.', offer_type: 'referral', value: 200, active: true, applicable_membership_type_ids: ['mtype-001', 'mtype-002'] },
  { id: 'off-007', merchant_id: 'mer-001', title: 'Wallet Points Cashback', description: 'Earn 5% cashback as wallet points on every visit above ₹500.', offer_type: 'wallet_points', value: 5, active: false, applicable_membership_type_ids: ['mtype-002'] },
  // Feature 1: points redemption offer
  { id: 'off-008', merchant_id: 'mer-001', title: '100 Points = ₹100 Off', description: 'Redeem 100 loyalty points for ₹100 off your next visit. Applied at checkout.', offer_type: 'points_redemption', value: 100, active: true, applicable_membership_type_ids: ['mtype-001', 'mtype-002'], is_points_redemption: true, loyalty_points_cost: 100 },
  { id: 'off-009', merchant_id: 'mer-001', title: '200 Points = Free Threading', description: 'Redeem 200 loyalty points for a complimentary eyebrow threading session.', offer_type: 'points_redemption', value: 0, active: true, applicable_membership_type_ids: ['mtype-001'], is_points_redemption: true, loyalty_points_cost: 200 },
];

// ===== MEMBERS =====
export const members: Member[] = [
  {
    id: 'mem-001', merchant_id: 'mer-001', member_code: 'SAL001', public_token: 'tok-a1b2c3d4e5f6',
    physical_card_number: '4821 6739 0012 3847',
    name: 'Arjun Sharma', phone: '+91 98450 12345', date_of_birth: '1990-07-15',
    anniversary_date: '2018-02-14', membership_type_id: 'mtype-001',
    joined_date: '2024-01-20', expiry_date: '2026-12-12', loyalty_points: 350,
    status: 'active', created_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'mem-002', merchant_id: 'mer-001', member_code: 'SAL002', public_token: 'tok-b2c3d4e5f6a1',
    name: 'Priya Patel', phone: '+91 70123 98765', date_of_birth: '1992-03-22',
    membership_type_id: 'mtype-001',
    joined_date: '2024-02-10', expiry_date: '2025-08-10', loyalty_points: 120,
    status: 'expiring_soon', created_at: '2024-02-10T10:00:00Z',
  },
  {
    id: 'mem-003', merchant_id: 'mer-001', member_code: 'SAL003', public_token: 'tok-c3d4e5f6a1b2',
    name: 'Vikram Singh', phone: '+91 99887 76655', date_of_birth: '1985-11-08',
    membership_type_id: 'mtype-002',
    joined_date: '2024-03-05', expiry_date: '2024-06-05', loyalty_points: 0,
    status: 'expired', created_at: '2024-03-05T10:00:00Z',
  },
  {
    id: 'mem-004', merchant_id: 'mer-001', member_code: 'SAL004', public_token: 'tok-d4e5f6a1b2c3',
    physical_card_number: '5392 1847 6650 2291',
    name: 'Ananya Rao', phone: '+91 81234 56789', date_of_birth: '1995-05-30',
    anniversary_date: '2021-12-01', membership_type_id: 'mtype-001',
    joined_date: '2024-03-20', expiry_date: '2027-03-20', loyalty_points: 800,
    status: 'active', created_at: '2024-03-20T10:00:00Z',
  },
  {
    id: 'mem-005', merchant_id: 'mer-001', member_code: 'SAL005', public_token: 'tok-e5f6a1b2c3d4',
    name: 'Rahul Verma', phone: '+91 91234 00001', date_of_birth: '1988-09-14',
    membership_type_id: 'mtype-002',
    joined_date: '2024-04-01', expiry_date: '2025-04-01', loyalty_points: 50,
    status: 'expiring_soon', created_at: '2024-04-01T10:00:00Z',
  },
  {
    id: 'mem-006', merchant_id: 'mer-001', member_code: 'SAL006', public_token: 'tok-f6a1b2c3d4e5',
    name: 'Sneha Kulkarni', phone: '+91 77665 44332', date_of_birth: '1993-01-19',
    membership_type_id: 'mtype-001',
    joined_date: '2024-04-15', expiry_date: '2027-04-15', loyalty_points: 450,
    status: 'active', created_at: '2024-04-15T10:00:00Z',
  },
  {
    id: 'mem-007', merchant_id: 'mer-001', member_code: 'SAL007', public_token: 'tok-g7a1b2c3d4e5',
    name: 'Deepak Joshi', phone: '+91 98012 34567', date_of_birth: '1987-06-25',
    membership_type_id: 'mtype-002',
    joined_date: '2024-05-01', expiry_date: '2027-05-01', loyalty_points: 180,
    status: 'active', created_at: '2024-05-01T10:00:00Z',
  },
];

// ===== MEMBER OFFER STATES =====
export const memberOfferStates: MemberOfferState[] = [
  { id: 'mos-001', member_id: 'mem-001', offer_template_id: 'off-001', remaining_qty: 3, initial_qty: 6, status: 'active' },
  { id: 'mos-002', member_id: 'mem-001', offer_template_id: 'off-002', remaining_qty: null, initial_qty: null, status: 'active' },
  { id: 'mos-003', member_id: 'mem-001', offer_template_id: 'off-003', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-004', member_id: 'mem-001', offer_template_id: 'off-004', remaining_qty: null, initial_qty: null, status: 'active' },
  { id: 'mos-005', member_id: 'mem-002', offer_template_id: 'off-001', remaining_qty: 0, initial_qty: 6, status: 'exhausted' },
  { id: 'mos-006', member_id: 'mem-002', offer_template_id: 'off-002', remaining_qty: null, initial_qty: null, status: 'active' },
  { id: 'mos-007', member_id: 'mem-004', offer_template_id: 'off-001', remaining_qty: 5, initial_qty: 6, status: 'active' },
  { id: 'mos-008', member_id: 'mem-004', offer_template_id: 'off-002', remaining_qty: null, initial_qty: null, status: 'active' },
  { id: 'mos-009', member_id: 'mem-004', offer_template_id: 'off-003', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-010', member_id: 'mem-004', offer_template_id: 'off-004', remaining_qty: null, initial_qty: null, status: 'active' },
];

// ===== REDEMPTIONS =====
export const redemptions: Redemption[] = [
  { id: 'red-001', member_id: 'mem-001', offer_template_id: 'off-001', merchant_user_id: 'usr-002', staff_name: 'Priya', amount: 0, created_at: '2024-10-14T11:30:00Z', member: { name: 'Arjun Sharma', member_code: 'SAL001' }, offer: { title: 'Free Hair Wash', offer_type: 'free_service' } },
  { id: 'red-002', member_id: 'mem-002', offer_template_id: 'off-002', merchant_user_id: 'usr-003', staff_name: 'Rohan', amount: 0, created_at: '2024-09-28T14:00:00Z', member: { name: 'Priya Patel', member_code: 'SAL002' }, offer: { title: '10% Off All Services', offer_type: 'percent_off' } },
  { id: 'red-003', member_id: 'mem-001', offer_template_id: 'off-002', merchant_user_id: 'usr-002', staff_name: 'Priya', amount: 0, created_at: '2024-08-10T16:00:00Z', member: { name: 'Arjun Sharma', member_code: 'SAL001' }, offer: { title: '10% Off All Services', offer_type: 'percent_off' } },
  { id: 'red-004', member_id: 'mem-004', offer_template_id: 'off-001', merchant_user_id: 'usr-002', staff_name: 'Priya', amount: 0, created_at: new Date().toISOString(), member: { name: 'Ananya Rao', member_code: 'SAL004' }, offer: { title: 'Free Hair Wash', offer_type: 'free_service' } },
  { id: 'red-005', member_id: 'mem-005', offer_template_id: 'off-002', merchant_user_id: 'usr-003', staff_name: 'Rohan', amount: 0, created_at: new Date(Date.now() - 900000).toISOString(), member: { name: 'Rahul Verma', member_code: 'SAL005' }, offer: { title: '10% Off All Services', offer_type: 'percent_off' } },
  { id: 'red-006', member_id: 'mem-006', offer_template_id: 'off-004', merchant_user_id: 'usr-001', staff_name: 'Rajesh', amount: 0, created_at: new Date(Date.now() - 3600000).toISOString(), member: { name: 'Sneha Kulkarni', member_code: 'SAL006' }, offer: { title: 'Coffee & Snacks', offer_type: 'free_service' } },
];

// ===== REMINDER RULES =====
export const reminderRules: ReminderRule[] = [
  { id: 'rr-001', merchant_id: 'mer-001', trigger_type: 'birthday', channel: 'whatsapp', template_text: 'Happy Birthday {name}! 🎂 Enjoy your complimentary facial at Glamour Salon this month. Book now: +91 98765 43210', active: true, send_time: '09:00:00', days_before: 0, timezone: 'Asia/Kolkata' },
  { id: 'rr-002', merchant_id: 'mer-001', trigger_type: 'anniversary', channel: 'sms', template_text: 'Happy Anniversary {name}! 💍 Celebrate with a special 15% discount at Glamour Salon. Visit us today!', active: true, send_time: '10:00:00', days_before: 0, timezone: 'Asia/Kolkata' },
  { id: 'rr-003', merchant_id: 'mer-001', trigger_type: 'expiry', channel: 'whatsapp', template_text: 'Hi {name}, your Glamour Salon membership expires in 7 days! Renew now to keep your exclusive benefits.', threshold_value: 7, active: true, send_time: '09:00:00', days_before: 7, timezone: 'Asia/Kolkata' },
  { id: 'rr-004', merchant_id: 'mer-001', trigger_type: 'loyalty_threshold', channel: 'sms', template_text: 'Congrats {name}! You\'ve earned {balance} loyalty points at Glamour Salon. Redeem on your next visit!', threshold_value: 500, active: false, send_time: '11:00:00', days_before: 0, timezone: 'Asia/Kolkata' },
];

// ===== CAMPAIGNS =====
export const campaigns: Campaign[] = [
  { id: 'camp-001', merchant_id: 'mer-001', name: 'Diwali Special Offer', target_audience: 'all', channel: 'whatsapp', template_text: '✨ Diwali Special! Get 20% off all services at Glamour Salon from Oct 28 to Nov 2. Book: +91 98765 43210', scheduled_at: '2024-10-28T09:00:00Z', status: 'sent', audience_size: 284, sent_count: 279, created_at: '2024-10-25T10:00:00Z' },
  { id: 'camp-002', merchant_id: 'mer-001', name: 'Expiry Reminder Blast', target_audience: 'expiring_soon', channel: 'sms', template_text: 'Hi {name}, your Glamour Salon membership expires soon! Renew to keep enjoying your exclusive Prime benefits.', status: 'draft', audience_size: 18, created_at: '2024-11-01T10:00:00Z' },
  { id: 'camp-003', merchant_id: 'mer-001', name: 'New Year Membership Drive', target_audience: 'all', channel: 'whatsapp', template_text: '🎉 New Year, New You! Upgrade to Prime membership at Glamour Salon and enjoy 6 free hair washes, birthday benefits & more!', scheduled_at: '2025-01-01T08:00:00Z', status: 'scheduled', audience_size: 284, created_at: '2024-12-28T10:00:00Z' },
];

// ===== DASHBOARD STATS =====
export const dashboardStats: DashboardStats = {
  total_active_members: 1284,
  redemptions_today: 42,
  expiring_this_week: 18,
  wallet_points_issued_month: 24500,
  recent_redemptions: redemptions,
};

// ===== ADMIN STATS =====
export const adminStats: AdminDashboardStats = {
  total_merchants: 3,
  total_members: 867,
  redemptions_today: 127,
  active_merchants: 2,
  inactive_merchants: 1,
  pending_approvals: 1,
  recent_merchant_activity: [
    { merchant_id: 'mer-001', business_name: 'Glamour Salon & Spa', action: '42 redemptions today', at: new Date().toISOString() },
    { merchant_id: 'mer-002', business_name: 'Lakshmi Kirana & General Stores', action: '12 new members added', at: new Date(Date.now() - 7200000).toISOString() },
    { merchant_id: 'mer-003', business_name: 'Mehfil Restaurant', action: 'Account suspended', at: new Date(Date.now() - 86400000).toISOString() },
  ],
};

// ===== PUBLIC TOKEN LOOKUP =====
export const publicMemberViews: Record<string, PublicMemberView> = {
  'tok-a1b2c3d4e5f6': {
    merchant_name: 'Glamour Salon & Spa',
    merchant_phone: '+91 98765 43210',
    member_name: 'Arjun Sharma',
    membership_type_name: 'Prime',
    status: 'active',
    expiry_date: '2026-12-12',
    loyalty_points: 350,
    offers: [
      { id: 'off-001', title: 'Free Hair Wash', description: 'Valid on any premium hair styling service above ₹800.', offer_type: 'free_service', value: 1 },
      { id: 'off-002', title: '10% Off All Services', description: 'Flat 10% on total billing. Not applicable on retail.', offer_type: 'percent_off', value: 10 },
      { id: 'off-003', title: 'Complimentary Facial', description: 'Birthday month exclusive. Book 24 hours in advance.', offer_type: 'birthday', value: 1 },
      { id: 'off-004', title: 'Coffee & Snacks', description: 'Unlimited refreshments during your visit.', offer_type: 'free_service', value: 1 },
    ],
  },
  'tok-expired': {
    merchant_name: 'Glamour Salon & Spa',
    merchant_phone: '+91 98765 43210',
    member_name: 'Vikram Singh',
    membership_type_name: 'Standard',
    status: 'expired',
    expiry_date: '2024-06-05',
    loyalty_points: 0,
    offers: [],
  },
};

// ===== LOYALTY TRANSACTIONS (Feature 1) =====
export const loyaltyTransactions: LoyaltyTransaction[] = [
  { id: 'ltx-001', member_id: 'mem-001', merchant_id: 'mer-001', type: 'earn', points: 10, source_redemption_id: 'red-001', source_offer_id: 'off-001', source_offer_title: 'Free Hair Wash', balance_after: 360, created_at: '2024-10-14T11:30:00Z' },
  { id: 'ltx-002', member_id: 'mem-001', merchant_id: 'mer-001', type: 'redeem', points: -100, source_offer_id: 'off-008', source_offer_title: '100 Points = ₹100 Off', balance_after: 260, created_at: '2024-10-10T15:00:00Z' },
  { id: 'ltx-003', member_id: 'mem-001', merchant_id: 'mer-001', type: 'earn', points: 20, source_redemption_id: 'red-003', source_offer_id: 'off-002', source_offer_title: '10% Off All Services', balance_after: 350, created_at: '2024-08-10T16:00:00Z' },
  { id: 'ltx-004', member_id: 'mem-004', merchant_id: 'mer-001', type: 'earn', points: 10, source_redemption_id: 'red-004', source_offer_id: 'off-001', source_offer_title: 'Free Hair Wash', balance_after: 810, created_at: new Date().toISOString() },
  { id: 'ltx-005', member_id: 'mem-006', merchant_id: 'mer-001', type: 'earn', points: 5, source_redemption_id: 'red-006', source_offer_id: 'off-004', source_offer_title: 'Coffee & Snacks', balance_after: 455, created_at: new Date(Date.now() - 3600000).toISOString() },
];

// ===== PHYSICAL CARD INVENTORY =====
// 16-digit numbers (credit-card style) pre-printed on physical cards.
// The QR on each card encodes the same card_number — scanner reads it,
// system finds the linked member.
export const cardInventory: CardInventoryItem[] = [
  // ---- Unassigned (in Metro Cardz global pool) ----
  { id: 'card-001', card_number: '1234 5678 9012 3456', status: 'unassigned', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-002', card_number: '1234 5678 9012 3457', status: 'unassigned', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-003', card_number: '1234 5678 9012 3458', status: 'unassigned', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-004', card_number: '1234 5678 9012 3459', status: 'unassigned', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-005', card_number: '1234 5678 9012 3460', status: 'unassigned', created_at: '2024-01-01T00:00:00Z' },

  // ---- Allocated to Glamour Salon (mer-001) but not yet linked to any member ----
  { id: 'card-006', card_number: '4821 6739 0012 3841', status: 'merchant_allocated', allocated_merchant_id: 'mer-001', allocated_merchant_name: 'Glamour Salon & Spa', allocated_at: '2024-02-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-007', card_number: '4821 6739 0012 3842', status: 'merchant_allocated', allocated_merchant_id: 'mer-001', allocated_merchant_name: 'Glamour Salon & Spa', allocated_at: '2024-02-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-008', card_number: '4821 6739 0012 3843', status: 'merchant_allocated', allocated_merchant_id: 'mer-001', allocated_merchant_name: 'Glamour Salon & Spa', allocated_at: '2024-02-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-009', card_number: '4821 6739 0012 3844', status: 'merchant_allocated', allocated_merchant_id: 'mer-001', allocated_merchant_name: 'Glamour Salon & Spa', allocated_at: '2024-02-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-010', card_number: '4821 6739 0012 3845', status: 'merchant_allocated', allocated_merchant_id: 'mer-001', allocated_merchant_name: 'Glamour Salon & Spa', allocated_at: '2024-02-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-011', card_number: '4821 6739 0012 3846', status: 'merchant_allocated', allocated_merchant_id: 'mer-001', allocated_merchant_name: 'Glamour Salon & Spa', allocated_at: '2024-02-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },

  // ---- Linked to actual members (Glamour Salon) ----
  { id: 'card-012', card_number: '4821 6739 0012 3847', status: 'member_linked', allocated_merchant_id: 'mer-001', allocated_merchant_name: 'Glamour Salon & Spa', allocated_at: '2024-02-01T00:00:00Z', linked_member_id: 'mem-001', linked_member_name: 'Arjun Sharma', linked_member_phone: '+91 98450 12345', linked_at: '2024-01-20T10:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-013', card_number: '5392 1847 6650 2291', status: 'member_linked', allocated_merchant_id: 'mer-001', allocated_merchant_name: 'Glamour Salon & Spa', allocated_at: '2024-02-01T00:00:00Z', linked_member_id: 'mem-004', linked_member_name: 'Ananya Rao', linked_member_phone: '+91 81234 56789', linked_at: '2024-03-20T10:00:00Z', created_at: '2024-01-01T00:00:00Z' },

  // ---- Allocated to Lakshmi Kirana (mer-002) ----
  { id: 'card-014', card_number: '6011 2984 7736 5510', status: 'merchant_allocated', allocated_merchant_id: 'mer-002', allocated_merchant_name: 'Lakshmi Kirana & General Stores', allocated_at: '2024-03-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-015', card_number: '6011 2984 7736 5511', status: 'merchant_allocated', allocated_merchant_id: 'mer-002', allocated_merchant_name: 'Lakshmi Kirana & General Stores', allocated_at: '2024-03-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-016', card_number: '6011 2984 7736 5512', status: 'merchant_allocated', allocated_merchant_id: 'mer-002', allocated_merchant_name: 'Lakshmi Kirana & General Stores', allocated_at: '2024-03-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },

  // ---- Deactivated ----
  { id: 'card-017', card_number: '3714 496353 98431', status: 'deactivated', allocated_merchant_id: 'mer-001', allocated_merchant_name: 'Glamour Salon & Spa', allocated_at: '2024-02-01T00:00:00Z', created_at: '2024-01-01T00:00:00Z' },
];

