-- =============================================================================
-- METRO CARDZ — MASTER SUPABASE PRODUCTION SCHEMA & SEED SCRIPT
-- =============================================================================
-- Copy & paste this ENTIRE script into your Supabase SQL Editor and click RUN.
-- 
-- Features & Schemas Included:
-- 1. All 27 ORM Tables & PostgreSQL ENUM types (idempotent IF NOT EXISTS)
-- 2. Multi-prize Lucky Draw support (prizes JSON, winner_member_ids JSON)
-- 3. Member celebration columns (date_of_birth, anniversary_date)
-- 4. Google Wallet Pass tracking tables
-- 5. Full Seed Data for 16 Industry Verticals with demo accounts (Password: demo123)
-- =============================================================================

-- ── 1. POSTGRES ENUM TYPES ──
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'merchant_status') THEN
        CREATE TYPE merchant_status AS ENUM ('active', 'suspended');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'merchant_approval_status') THEN
        CREATE TYPE merchant_approval_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'owner', 'staff');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_type') THEN
        CREATE TYPE offer_type AS ENUM ('percent_off', 'free_service', 'wallet_points', 'referral', 'birthday', 'points_redemption', 'visit_milestone');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
        CREATE TYPE member_status AS ENUM ('active', 'expiring_soon', 'expired', 'deactivated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_trigger') THEN
        CREATE TYPE reminder_trigger AS ENUM ('birthday', 'anniversary', 'loyalty_threshold', 'expiry');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_channel') THEN
        CREATE TYPE message_channel AS ENUM ('sms', 'whatsapp');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_audience') THEN
        CREATE TYPE campaign_audience AS ENUM ('all', 'by_membership_type', 'expiring_soon');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_channel') THEN
        CREATE TYPE campaign_channel AS ENUM ('sms', 'whatsapp');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
        CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_delivery_status') THEN
        CREATE TYPE message_delivery_status AS ENUM ('sent', 'failed', 'delivered');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'card_status') THEN
        CREATE TYPE card_status AS ENUM ('unassigned', 'merchant_allocated', 'member_linked', 'deactivated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loyalty_tx_type') THEN
        CREATE TYPE loyalty_tx_type AS ENUM ('earn', 'redeem', 'referral_bonus');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_state_status') THEN
        CREATE TYPE offer_state_status AS ENUM ('active', 'exhausted');
    END IF;
END$$;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum additions for existing setups
ALTER TYPE offer_type ADD VALUE IF NOT EXISTS 'points_redemption';
ALTER TYPE offer_type ADD VALUE IF NOT EXISTS 'visit_milestone';
ALTER TYPE loyalty_tx_type ADD VALUE IF NOT EXISTS 'referral_bonus';

-- ── 2. CREATE ALL TABLES IF NOT EXISTS ──

-- Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    category TEXT,
    plan_tier TEXT DEFAULT 'Starter',
    whatsapp_number TEXT,
    logo_url TEXT,
    address TEXT,
    secret_salt TEXT NOT NULL DEFAULT md5(random()::text),
    status merchant_status DEFAULT 'active'::merchant_status NOT NULL,
    approval_status merchant_approval_status DEFAULT 'approved'::merchant_approval_status NOT NULL,
    referral_bonus_points NUMERIC DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Merchant Users Table
CREATE TABLE IF NOT EXISTS merchant_users (
    id TEXT PRIMARY KEY,
    merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    role user_role DEFAULT 'staff'::user_role NOT NULL,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membership Types Table
CREATE TABLE IF NOT EXISTS membership_types (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT ''
);

-- Offer Templates Table
CREATE TABLE IF NOT EXISTS offer_templates (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    offer_type offer_type NOT NULL,
    value NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT true,
    loyalty_points_earn NUMERIC,
    is_points_redemption BOOLEAN DEFAULT false NOT NULL,
    loyalty_points_cost NUMERIC,
    min_visits INT,
    min_purchase_amount NUMERIC
);

-- Membership Type Offers (Many-to-Many) Table
CREATE TABLE IF NOT EXISTS membership_type_offers (
    membership_type_id TEXT NOT NULL REFERENCES membership_types(id) ON DELETE CASCADE,
    offer_template_id TEXT NOT NULL REFERENCES offer_templates(id) ON DELETE CASCADE,
    default_qty NUMERIC,
    PRIMARY KEY (membership_type_id, offer_template_id)
);

-- Members Table
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    member_code TEXT NOT NULL,
    public_token TEXT NOT NULL UNIQUE,
    physical_card_number TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    date_of_birth DATE,
    anniversary_date DATE,
    membership_type_id TEXT NOT NULL REFERENCES membership_types(id),
    joined_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    loyalty_points NUMERIC DEFAULT 0,
    status member_status DEFAULT 'active'::member_status NOT NULL,
    notes TEXT,
    total_visits INT DEFAULT 0 NOT NULL,
    referral_code TEXT UNIQUE,
    referred_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    auto_renew BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Offer State Table
CREATE TABLE IF NOT EXISTS member_offer_state (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    offer_template_id TEXT NOT NULL REFERENCES offer_templates(id),
    remaining_qty NUMERIC,
    initial_qty NUMERIC,
    status offer_state_status DEFAULT 'active'::offer_state_status NOT NULL
);

-- Redemption Log Table
CREATE TABLE IF NOT EXISTS redemption_log (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    offer_template_id TEXT NOT NULL REFERENCES offer_templates(id),
    merchant_user_id TEXT NOT NULL REFERENCES merchant_users(id),
    amount NUMERIC DEFAULT 0,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Transactions Table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    type loyalty_tx_type NOT NULL,
    points NUMERIC NOT NULL,
    source_redemption_id TEXT REFERENCES redemption_log(id),
    source_offer_id TEXT REFERENCES offer_templates(id),
    balance_after NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_audience campaign_audience NOT NULL,
    target_membership_type_id TEXT REFERENCES membership_types(id),
    channel campaign_channel NOT NULL,
    template_text TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ,
    status campaign_status DEFAULT 'draft'::campaign_status NOT NULL,
    audience_size NUMERIC DEFAULT 0,
    sent_count NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder Rules Table
CREATE TABLE IF NOT EXISTS reminder_rules (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    trigger_type reminder_trigger NOT NULL,
    channel message_channel NOT NULL,
    template_text TEXT NOT NULL,
    threshold_value NUMERIC,
    active BOOLEAN DEFAULT true,
    send_time TIME DEFAULT '09:00:00',
    days_before INT DEFAULT 0 NOT NULL,
    timezone TEXT DEFAULT 'Asia/Kolkata' NOT NULL
);

-- Message Log Table
CREATE TABLE IF NOT EXISTS message_log (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    campaign_id TEXT REFERENCES campaigns(id),
    reminder_rule_id TEXT REFERENCES reminder_rules(id),
    channel TEXT NOT NULL,
    status message_delivery_status DEFAULT 'sent'::message_delivery_status NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Physical Card Inventory Table
CREATE TABLE IF NOT EXISTS card_inventory (
    id TEXT PRIMARY KEY,
    card_number TEXT NOT NULL UNIQUE,
    status card_status DEFAULT 'unassigned'::card_status NOT NULL,
    allocated_merchant_id TEXT REFERENCES merchants(id),
    allocated_at TIMESTAMPTZ,
    linked_member_id TEXT REFERENCES members(id),
    linked_at TIMESTAMPTZ,
    created_by_admin_id TEXT REFERENCES merchant_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Audit Log Table
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL REFERENCES merchant_users(id),
    merchant_id TEXT REFERENCES merchants(id),
    action TEXT NOT NULL,
    detail TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward Catalog Table
CREATE TABLE IF NOT EXISTS reward_catalog (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    points_cost NUMERIC NOT NULL,
    quantity_available INT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward Claims Table
CREATE TABLE IF NOT EXISTS reward_claims (
    id TEXT PRIMARY KEY,
    reward_id TEXT NOT NULL REFERENCES reward_catalog(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    points_spent NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupon Codes Table
CREATE TABLE IF NOT EXISTS coupon_codes (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    min_purchase NUMERIC DEFAULT 0,
    max_uses INT,
    used_count INT DEFAULT 0 NOT NULL,
    expires_at DATE,
    active_days TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift Vouchers Table
CREATE TABLE IF NOT EXISTS gift_vouchers (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    value NUMERIC NOT NULL,
    is_redeemed BOOLEAN DEFAULT false NOT NULL,
    redeemed_by_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ,
    expires_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points Rules Table
CREATE TABLE IF NOT EXISTS points_rules (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL,
    points_value NUMERIC NOT NULL,
    spend_unit NUMERIC DEFAULT 1,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scratch Cards Table
CREATE TABLE IF NOT EXISTS scratch_cards (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL,
    reward_value TEXT NOT NULL,
    is_revealed BOOLEAN DEFAULT false NOT NULL,
    revealed_at TIMESTAMPTZ,
    trigger_visit INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lucky Draws Table (Multi-Prize Enabled)
CREATE TABLE IF NOT EXISTS lucky_draws (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    prize TEXT NOT NULL DEFAULT '',
    prizes JSON,
    draw_date DATE NOT NULL,
    min_points NUMERIC DEFAULT 0,
    min_visits INT DEFAULT 0,
    status TEXT DEFAULT 'open' NOT NULL,
    winner_member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    winner_member_ids JSON,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lucky Draw Entries Table
CREATE TABLE IF NOT EXISTS lucky_draw_entries (
    id TEXT PRIMARY KEY,
    draw_id TEXT NOT NULL REFERENCES lucky_draws(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    entered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member Feedback Table
CREATE TABLE IF NOT EXISTS member_feedback (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotency Records Table
CREATE TABLE IF NOT EXISTS idempotency_records (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL,
    merchant_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    status TEXT DEFAULT 'processing' NOT NULL,
    status_code INT,
    response_body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT uq_idempotency UNIQUE (idempotency_key, merchant_id, endpoint)
);

-- Google Wallet Class Table
CREATE TABLE IF NOT EXISTS merchant_wallet_classes (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL UNIQUE REFERENCES merchants(id) ON DELETE CASCADE,
    google_class_id TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    background_color TEXT DEFAULT '#1A1A1A',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Google Wallet Pass Status Table
CREATE TABLE IF NOT EXISTS member_wallet_passes (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL UNIQUE REFERENCES members(id) ON DELETE CASCADE,
    wallet_class_id TEXT NOT NULL REFERENCES merchant_wallet_classes(id) ON DELETE CASCADE,
    google_object_id TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'not_added' NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Logs Table
CREATE TABLE IF NOT EXISTS event_logs (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    member_id TEXT REFERENCES members(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    payload JSON NOT NULL DEFAULT '{}'::json,
    actor_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. COLUMN INTEGRITY ASSURANCE (FOR EXISTING SCHEMAS) ──
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS secret_salt TEXT;
ALTER TABLE merchants ALTER COLUMN secret_salt SET DEFAULT md5(random()::text);
UPDATE merchants SET secret_salt = md5(random()::text) WHERE secret_salt IS NULL;

ALTER TABLE lucky_draws ADD COLUMN IF NOT EXISTS prizes JSON;
ALTER TABLE lucky_draws ADD COLUMN IF NOT EXISTS winner_member_ids JSON;

ALTER TABLE members ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS anniversary_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_visits INT DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

ALTER TABLE loyalty_transactions ADD COLUMN IF NOT EXISTS note TEXT;

-- ── 4. SEED MERCHANTS (ALL 16 VERTICALS) ──
INSERT INTO merchants (id, business_name, category, plan_tier, whatsapp_number, address, secret_salt, status, approval_status)
VALUES
  ('mer-ins', 'Metro Insurance Agency',  'Insurance',   'Enterprise',   '+91 98765 00001', 'Suite 402, Financial District, Mumbai',   'salt-ins-001', 'active', 'approved'),
  ('mer-re',  'Metro Real Estate Agency','Real Estate',  'Professional', '+91 98765 00002', 'Floor 12, World Trade Center, Gurugram', 'salt-re-001',  'active', 'approved'),
  ('mer-trv', 'Metro Travels',           'Travels',     'Professional', '+91 98765 00003', 'Connaught Place, New Delhi 110001',     'salt-trv-001', 'active', 'approved'),
  ('mer-ac',  'Metro AC Services',       'AC Services', 'Starter',      '+91 98765 00004', 'Industrial Estate, Phase II, Ahmedabad', 'salt-ac-001',  'active', 'approved'),
  ('mer-sup', 'Metro Supermarket',       'Supermarket', 'Enterprise',   '+91 98765 00005', 'Main Road, Koramangala, Bengaluru',     'salt-sup-001', 'active', 'approved'),
  ('mer-gym', 'Metro GYM',               'Gym',         'Professional', '+91 98765 00006', '8th Main, Indiranagar, Bengaluru',       'salt-gym-001', 'active', 'approved'),
  ('mer-sln', 'Metro Salon & Spa',       'Salon',       'Professional', '+91 98765 43210', '12, MG Road, Bengaluru, Karnataka 560001','salt-sln-001', 'active', 'approved'),
  ('mer-auto', 'Metro Automobile',       'Automobile',  'Professional', '+91 98765 00008', 'GIDC Auto Hub, Pune, Maharashtra',      'salt-auto-001','active', 'approved'),
  ('mer-caf', 'Metro Cafe',              'Cafe',        'Starter',      '+91 98765 00009', 'Bandra West, Mumbai 400050',           'salt-caf-001', 'active', 'approved'),
  ('mer-jwl', 'Metro Jewellery',         'Jewellery',   'Enterprise',   '+91 98765 00010', 'Zaveri Bazaar, Mumbai 400002',        'salt-jwl-001', 'active', 'approved'),
  ('mer-grm', 'Metro Fashion & Garments','Readymade Garments', 'Professional', '+91 98765 00011', 'Commercial Street, Bengaluru 560001', 'salt-grm-001', 'active', 'approved'),
  ('mer-btq', 'Royal Bridal Boutique',   'Boutique',    'Professional', '+91 98765 00012', 'South Extension II, New Delhi 110049', 'salt-btq-001', 'active', 'approved'),
  ('mer-opt', 'Vision Craft Opticians',  'Optician',    'Starter',      '+91 98765 00013', 'FC Road, Pune, Maharashtra 411004',    'salt-opt-001', 'active', 'approved'),
  ('mer-ftw', 'Sole Comfort Footwear',   'Footwear',    'Starter',      '+91 98765 00014', 'Park Street, Kolkata, WB 700016',       'salt-ftw-001', 'active', 'approved'),
  ('mer-dnt', 'Apex Dental Studio',      'Dental',      'Professional', '+91 98765 00015', 'Banjara Hills, Hyderabad, TS 500034',  'salt-dnt-001', 'active', 'approved'),
  ('mer-mob', 'Metro Mobile & Tech Hub', 'Mobile',      'Professional', '+91 98765 00016', 'Nehru Place, New Delhi 110019',        'salt-mob-001', 'active', 'approved')
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  category = EXCLUDED.category,
  address = EXCLUDED.address,
  secret_salt = COALESCE(merchants.secret_salt, EXCLUDED.secret_salt, md5(random()::text)),
  status = 'active',
  approval_status = 'approved';

-- Clean old users
DELETE FROM merchant_users 
WHERE phone IN ('9876500001','9876500002','9876500003','9876500004','9876500005','9876500006','9876543210','9876500007','9876500008','9876500009','9876500010','9876500011','9876500012','9876500013','9876500014','9876500015','9876500016','9000000000')
   OR email IN ('insurance@metrocardz.in','realestate@metrocardz.in','travels@metrocardz.in','acservices@metrocardz.in','supermarket@metrocardz.in','gym@metrocardz.in','salon@metrocardz.in','automobile@metrocardz.in','cafe@metrocardz.in','restaurant@metrocardz.in','jewellery@metrocardz.in','garments@metrocardz.in','boutique@metrocardz.in','optician@metrocardz.in','footwear@metrocardz.in','dental@metrocardz.in','mobile@metrocard.in','mobile@metrocardz.in','admin@metrocardz.in');

-- Seed Users (Password: demo123)
INSERT INTO merchant_users (id, merchant_id, name, phone, email, role, password_hash)
VALUES
  ('usr-ins',  'mer-ins', 'Suresh Gupta (Insurance Dir.)',  '9876500001', 'insurance@metrocardz.in',  'owner',       ''),
  ('usr-re',   'mer-re',  'Vikram Malhotra (Realty Dir.)',  '9876500002', 'realestate@metrocardz.in', 'owner',       ''),
  ('usr-trv',  'mer-trv', 'Rohan Mehta (Travel Dir.)',     '9876500003', 'travels@metrocardz.in',    'owner',       ''),
  ('usr-ac',   'mer-ac',  'Sunil Verma (HVAC Lead)',        '9876500004', 'acservices@metrocardz.in', 'owner',       ''),
  ('usr-sup',  'mer-sup', 'Sangeeta Patel (Store Mgr.)',    '9876500005', 'supermarket@metrocardz.in','owner',       ''),
  ('usr-gym',  'mer-gym', 'Karan Malhotra (Head Coach)',   '9876500006', 'gym@metrocardz.in',        'owner',       ''),
  ('usr-sln',  'mer-sln', 'Rajesh Kumar (Salon Owner)',     '9876543210', 'salon@metrocardz.in',      'owner',       ''),
  ('usr-auto', 'mer-auto', 'Vikramaditya Rao (Studio Owner)','9876500008', 'automobile@metrocardz.in', 'owner',       ''),
  ('usr-caf',  'mer-caf', 'Anish Giri (Head Barista)',      '9876500009', 'cafe@metrocardz.in',       'owner',       ''),
  ('usr-jwl',  'mer-jwl', 'Ramesh Agrawal (Managing Dir.)','9876500010', 'jewellery@metrocardz.in',  'owner',       ''),
  ('usr-grm',  'mer-grm', 'Manish Kapoor (Fashion Dir.)',   '9876500011', 'garments@metrocardz.in',   'owner',       ''),
  ('usr-btq',  'mer-btq', 'Anita Singhania (Head Designer)','9876500012', 'boutique@metrocardz.in',   'owner',       ''),
  ('usr-opt',  'mer-opt', 'Dr. Alok Verma (Optometrist)',   '9876500013', 'optician@metrocardz.in',   'owner',       ''),
  ('usr-ftw',  'mer-ftw', 'Deepak Chhabra (Lounge Mgr)',    '9876500014', 'footwear@metrocardz.in',   'owner',       ''),
  ('usr-dnt',  'mer-dnt', 'Dr. Kavita Rao (Chief Dentist)', '9876500015', 'dental@metrocardz.in',     'owner',       ''),
  ('usr-mob',  'mer-mob', 'Sanjay Sharma (Tech Director)',  '9876500016', 'mobile@metrocard.in',      'owner',       ''),
  ('usr-admin', NULL,      'Super Admin Platform',           '9000000000', 'admin@metrocardz.in',      'super_admin', '');

-- ── 6. SEED SAMPLE MULTI-PRIZE LUCKY DRAW ──
INSERT INTO lucky_draws (id, merchant_id, name, prize, prizes, draw_date, min_points, min_visits, status)
VALUES (
  'draw-demo-001',
  'mer-sln',
  'Festival Bumper Lucky Draw',
  '1st Prize: iPhone 15 Pro',
  '["1st Prize: iPhone 15 Pro", "2nd Prize: Spa Day Package (₹5,000)", "3rd Prize: Hair Styling Kit (₹2,500)", "4th Prize: 1,000 Bonus Points"]'::json,
  '2026-12-31',
  100,
  2,
  'open'
) ON CONFLICT (id) DO UPDATE SET
  prizes = EXCLUDED.prizes,
  name = EXCLUDED.name;

SELECT 'Master Schema & Seed Script Executed Successfully!' AS status;
