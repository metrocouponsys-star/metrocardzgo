-- =============================================================================
-- METRO CARDZ — DEMO MERCHANT: MOBILE & TECH HUB
-- =============================================================================
-- Merchant  : Metro Mobile & Tech Hub  (mer-mob)
-- Login      : Phone: 9876500016  |  Password: demo123
-- Category   : Mobile / Consumer Electronics
-- Location   : Nehru Place, New Delhi 110019
-- =============================================================================
-- Password hash below = bcrypt("demo123")
-- $2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
-- =============================================================================

-- ── STEP 1 : ENUM / EXTENSION GUARDS ─────────────────────────────────────────
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
        CREATE TYPE offer_type AS ENUM ('percent_off','free_service','wallet_points','referral','birthday','points_redemption','visit_milestone');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
        CREATE TYPE member_status AS ENUM ('active','expiring_soon','expired','deactivated');
    END IF;
END$$;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure tables exist (run-once safety)
CREATE TABLE IF NOT EXISTS reward_catalog (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    points_cost NUMERIC NOT NULL,
    quantity_available INT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scratch_cards (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL,
    reward_value TEXT NOT NULL,
    is_revealed BOOLEAN DEFAULT false NOT NULL,
    revealed_at TIMESTAMPTZ NULL,
    trigger_visit INT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminder_rules (
    id TEXT PRIMARY KEY,
    merchant_id TEXT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    template_text TEXT NOT NULL,
    threshold_value NUMERIC NULL,
    active BOOLEAN DEFAULT true,
    send_time TIME NULL DEFAULT '09:00:00',
    days_before INT DEFAULT 0 NOT NULL,
    timezone TEXT DEFAULT 'Asia/Kolkata' NOT NULL
);

-- ── STEP 2 : MERCHANT RECORD ─────────────────────────────────────────────────
INSERT INTO merchants (
    id, business_name, category, plan_tier,
    whatsapp_number, address, secret_salt,
    status, approval_status, referral_bonus_points
)
VALUES (
    'mer-mob',
    'Metro Mobile & Tech Hub',
    'Mobile',
    'Professional',
    '+91 98765 00016',
    'Nehru Place, New Delhi 110019',
    'salt-mob-001',
    'active',
    'approved',
    100
)
ON CONFLICT (id) DO UPDATE SET
    business_name       = EXCLUDED.business_name,
    category            = EXCLUDED.category,
    plan_tier           = EXCLUDED.plan_tier,
    whatsapp_number     = EXCLUDED.whatsapp_number,
    address             = EXCLUDED.address,
    secret_salt         = COALESCE(merchants.secret_salt, EXCLUDED.secret_salt, md5(random()::text)),
    status              = 'active',
    approval_status     = 'approved',
    referral_bonus_points = 100;


-- ── STEP 3 : MERCHANT USERS (owner + 2 staff) ────────────────────────────────
-- Clean stale rows first to avoid unique-constraint violations
DELETE FROM merchant_users
WHERE phone IN ('9876500016','9876500017','9876500018')
   OR email IN ('mobile@metrocard.in','mobile@metrocardz.in','tech1@metrocardz.in','tech2@metrocardz.in');

INSERT INTO merchant_users (id, merchant_id, name, phone, email, role, password_hash)
VALUES
    -- Owner / Director (Phone: 9876500016 | Password: demo123)
    ('usr-mob',    'mer-mob', 'Sanjay Sharma (Tech Director)',   '9876500016', 'mobile@metrocardz.in',  'owner', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
    -- Staff: Sales Associate (Phone: 9876500017 | Password: demo123)
    ('usr-mob-s1', 'mer-mob', 'Ravi Gupta (Sales Associate)',    '9876500017', 'tech1@metrocardz.in',  'staff', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
    -- Staff: Repair Technician (Phone: 9876500018 | Password: demo123)
    ('usr-mob-s2', 'mer-mob', 'Priya Singh (Repair Technician)', '9876500018', 'tech2@metrocardz.in',  'staff', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW');


-- ── STEP 4 : MEMBERSHIP TIERS ────────────────────────────────────────────────
INSERT INTO membership_types (id, merchant_id, name, description)
VALUES
    (
        'mtype-mob-1', 'mer-mob',
        'Tech Elite',
        '1-year free tempered glass replacement + 10% off all accessories + Express Repair priority queue + Free handset health diagnostic every 6 months'
    ),
    (
        'mtype-mob-2', 'mer-mob',
        'Gadget Pro',
        'Express screen repair priority + 5% off spare parts + Free data backup service on every repair visit'
    ),
    (
        'mtype-mob-3', 'mer-mob',
        'Smart Starter',
        'Standard membership — earn TechCoins on every purchase and repair; redeem for discounts and freebies'
    )
ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description;


-- ── STEP 5 : OFFER TEMPLATES ─────────────────────────────────────────────────
INSERT INTO offer_templates (id, merchant_id, title, description, offer_type, value, active, loyalty_points_earn, is_points_redemption, loyalty_points_cost)
VALUES
    -- Free services
    ('off-mob-1', 'mer-mob',
     'Free 11D Tempered Glass Guard Installation',
     'Free premium 11D curved glass guard fitted on any smartphone — one per membership year.',
     'free_service', 1, true, NULL, false, NULL),

    ('off-mob-2', 'mer-mob',
     'Complimentary Handset Health Diagnostic',
     'Full 20-point diagnostic: battery, charging port, sensors, speaker, mic, and camera check.',
     'free_service', 1, true, 25, false, NULL),

    ('off-mob-3', 'mer-mob',
     'Free Data Backup & Transfer (up to 64 GB)',
     'Secure backup of photos, contacts, and apps to cloud or new device — free on every repair visit.',
     'free_service', 1, true, 20, false, NULL),

    -- Discounts
    ('off-mob-4', 'mer-mob',
     '₹500 Off Smartphone Screen Repair',
     'Flat ₹500 discount on any OEM screen replacement (iPhone, Samsung, OnePlus, Xiaomi).',
     'percent_off', 500, true, NULL, false, NULL),

    ('off-mob-5', 'mer-mob',
     '10% Off All Accessories',
     '10% instant discount on earphones, cases, chargers, power banks, and smartwatches.',
     'percent_off', 10, true, NULL, false, NULL),

    ('off-mob-6', 'mer-mob',
     '₹300 Off Battery Replacement',
     'Genuine battery replacement at discounted rate — valid on all brands.',
     'percent_off', 300, true, NULL, false, NULL),

    -- Wallet / Loyalty Points
    ('off-mob-7', 'mer-mob',
     'Double TechCoins Wednesday',
     'Earn 2x TechCoins on all purchases and repairs every Wednesday.',
     'wallet_points', 2, true, NULL, false, NULL),

    ('off-mob-8', 'mer-mob',
     'Refer a Friend — Earn 200 TechCoins',
     'Get 200 TechCoins when a friend makes their first purchase using your referral code.',
     'referral', 200, true, 200, false, NULL),

    -- Points Redemption
    ('off-mob-9', 'mer-mob',
     '500 TechCoins = ₹50 Instant Discount',
     'Redeem 500 TechCoins for a ₹50 cash discount at checkout on any bill above ₹300.',
     'points_redemption', 50, true, NULL, true, 500),

    ('off-mob-10', 'mer-mob',
     '1000 TechCoins = Free Screen Guard',
     'Redeem 1000 TechCoins for a free screen guard (any model).',
     'points_redemption', 1, true, NULL, true, 1000),

    -- Birthday
    ('off-mob-11', 'mer-mob',
     'Birthday Freebie — Surprise Gift Pack',
     'Receive a surprise tech accessory gift pack on your birthday month.',
     'birthday', 1, true, 50, false, NULL),

    -- Visit Milestone
    ('off-mob-12', 'mer-mob',
     '5th Visit Bonus — 150 TechCoins',
     'Earn 150 bonus TechCoins on your 5th visit.',
     'visit_milestone', 150, true, 150, false, NULL)

ON CONFLICT (id) DO UPDATE SET
    title       = EXCLUDED.title,
    description = EXCLUDED.description,
    active      = EXCLUDED.active;


-- ── STEP 6 : DEMO MEMBERS (10 customers across all tiers) ────────────────────
-- Clean stale members for this merchant to allow idempotent re-seed
DELETE FROM members WHERE merchant_id = 'mer-mob';

INSERT INTO members (
    id, merchant_id, member_code, public_token, physical_card_number,
    name, phone, email, date_of_birth, membership_type_id,
    joined_date, expiry_date, loyalty_points, status, total_visits, notes
)
VALUES
    -- ── Tech Elite Members ────────────────────────────────────────────────
    (
        'mem-mob-1', 'mer-mob', 'MOB001', 'tok-mob001', '4000 1000 0016 0001',
        'Sanjay Sharma',    '9867890123', 'sanjay.sharma@gmail.com',
        '1988-03-15',       'mtype-mob-1',
        CURRENT_DATE - INTERVAL '14 months',
        CURRENT_DATE + INTERVAL '10 months',
        1280, 'active', 18, 'Owner of iPhone 15 Pro Max & Galaxy S24 Ultra. Prefers express service.'
    ),
    (
        'mem-mob-2', 'mer-mob', 'MOB002', 'tok-mob002', '4000 1000 0016 0002',
        'Neha Kapoor',      '9711234567', 'neha.kapoor@outlook.com',
        '1995-07-22',       'mtype-mob-1',
        CURRENT_DATE - INTERVAL '8 months',
        CURRENT_DATE + INTERVAL '4 months',
        3750, 'active', 22, 'Frequent buyer — accessories & gaming controllers. Birthday in July.'
    ),
    (
        'mem-mob-3', 'mer-mob', 'MOB003', 'tok-mob003', '4000 1000 0016 0003',
        'Amit Bhatia',      '9911122233', 'amit.bhatia@hotmail.com',
        '1982-11-05',       'mtype-mob-1',
        CURRENT_DATE - INTERVAL '20 months',
        CURRENT_DATE + INTERVAL '4 months',
        580, 'expiring_soon', 30, 'Long-standing customer. Due for renewal — send reminder.'
    ),
    (
        'mem-mob-4', 'mer-mob', 'MOB004', 'tok-mob004', '4000 1000 0016 0004',
        'Kavya Reddy',      '9833344455', 'kavya.reddy@gmail.com',
        '2000-05-18',       'mtype-mob-1',
        CURRENT_DATE - INTERVAL '3 months',
        CURRENT_DATE + INTERVAL '9 months',
        2100, 'active', 9, 'College student. Bought OnePlus 12. Prefers WhatsApp updates.'
    ),
    -- ── Gadget Pro Members ────────────────────────────────────────────────
    (
        'mem-mob-5', 'mer-mob', 'MOB005', 'tok-mob005', '4000 1000 0016 0005',
        'Rahul Tiwari',     '9755566677', 'rahul.tiwari@gmail.com',
        '1991-09-30',       'mtype-mob-2',
        CURRENT_DATE - INTERVAL '6 months',
        CURRENT_DATE + INTERVAL '6 months',
        860, 'active', 12, 'Repair-heavy customer — cracked screens twice. Owns Pixel 8.'
    ),
    (
        'mem-mob-6', 'mer-mob', 'MOB006', 'tok-mob006', '4000 1000 0016 0006',
        'Divya Menon',      '9677788899', 'divya.menon@yahoo.com',
        '1997-01-14',       'mtype-mob-2',
        CURRENT_DATE - INTERVAL '5 months',
        CURRENT_DATE + INTERVAL '7 months',
        1450, 'active', 8, 'Samsung Galaxy user. Interested in smartwatch upgrade.'
    ),
    (
        'mem-mob-7', 'mer-mob', 'MOB007', 'tok-mob007', '4000 1000 0016 0007',
        'Arjun Nair',       '9533344455', 'arjun.nair@gmail.com',
        '1985-04-25',       'mtype-mob-2',
        CURRENT_DATE - INTERVAL '11 months',
        CURRENT_DATE + INTERVAL '1 month',
        290, 'expiring_soon', 15, 'Expiring soon — 1 month left. Has 2 unredeemed glass guard offers.'
    ),
    -- ── Smart Starter Members ─────────────────────────────────────────────
    (
        'mem-mob-8', 'mer-mob', 'MOB008', 'tok-mob008', '4000 1000 0016 0008',
        'Pooja Agarwal',    '9488899001', 'pooja.agarwal@gmail.com',
        '2003-12-08',       'mtype-mob-3',
        CURRENT_DATE - INTERVAL '2 months',
        CURRENT_DATE + INTERVAL '10 months',
        420, 'active', 4, 'New member — bought Redmi Note 13. First repair visit expected.'
    ),
    (
        'mem-mob-9', 'mer-mob', 'MOB009', 'tok-mob009', '4000 1000 0016 0009',
        'Manav Joshi',      '9322233344', 'manav.joshi@outlook.com',
        '1999-08-17',       'mtype-mob-3',
        CURRENT_DATE - INTERVAL '1 month',
        CURRENT_DATE + INTERVAL '11 months',
        150, 'active', 2, 'Just enrolled. Interested in gaming accessories.'
    ),
    (
        'mem-mob-10', 'mer-mob', 'MOB010', 'tok-mob010', '4000 1000 0016 0010',
        'Sneha Sharma',     '9211122233', 'sneha.sharma@gmail.com',
        '1993-02-28',       'mtype-mob-3',
        CURRENT_DATE - INTERVAL '4 months',
        CURRENT_DATE + INTERVAL '8 months',
        730, 'active', 6, 'Referred by MOB002 (Neha Kapoor). Interested in earbuds & smartwatches.'
    );


-- ── STEP 7 : REFERRAL CODES ─────────────────────────────────────────────────
UPDATE members SET referral_code = 'MOB001REF' WHERE id = 'mem-mob-1';
UPDATE members SET referral_code = 'MOB002REF' WHERE id = 'mem-mob-2';
UPDATE members SET referral_code = 'MOB005REF' WHERE id = 'mem-mob-5';
-- Sneha was referred by Neha
UPDATE members SET referred_by_member_id = 'mem-mob-2' WHERE id = 'mem-mob-10';


-- ── STEP 8 : LOYALTY TRANSACTIONS (transaction history) ──────────────────────
DELETE FROM loyalty_transactions WHERE merchant_id = 'mer-mob';

INSERT INTO loyalty_transactions (id, merchant_id, member_id, points, transaction_type, description, created_at)
VALUES
    -- Sanjay Sharma (MOB001)
    ('lt-mob-001', 'mer-mob', 'mem-mob-1', 200,  'earn',   'Screen repair — earned TechCoins',        NOW() - INTERVAL '13 months'),
    ('lt-mob-002', 'mer-mob', 'mem-mob-1', 300,  'earn',   'Accessories purchase — iPhone 15 Pro Max case + AirPods Pro', NOW() - INTERVAL '10 months'),
    ('lt-mob-003', 'mer-mob', 'mem-mob-1', -500, 'redeem', 'Redeemed 500 TechCoins — ₹50 off bill',  NOW() - INTERVAL '8 months'),
    ('lt-mob-004', 'mer-mob', 'mem-mob-1', 150,  'earn',   '5th Visit Bonus TechCoins',               NOW() - INTERVAL '6 months'),
    ('lt-mob-005', 'mer-mob', 'mem-mob-1', 500,  'earn',   'Wednesday Double TechCoins promo',        NOW() - INTERVAL '2 months'),
    ('lt-mob-006', 'mer-mob', 'mem-mob-1', 630,  'earn',   'Accessories bulk order — chargers & cable set', NOW() - INTERVAL '1 month'),

    -- Neha Kapoor (MOB002)
    ('lt-mob-010', 'mer-mob', 'mem-mob-2', 400,  'earn',   'Galaxy Tab S9 accessories purchase',      NOW() - INTERVAL '7 months'),
    ('lt-mob-011', 'mer-mob', 'mem-mob-2', 200,  'earn',   'Referral bonus — Sneha Sharma enrolled',  NOW() - INTERVAL '4 months'),
    ('lt-mob-012', 'mer-mob', 'mem-mob-2', 1000, 'earn',   'Gaming controller + headset combo — Double Wednesday', NOW() - INTERVAL '3 months'),
    ('lt-mob-013', 'mer-mob', 'mem-mob-2', -1000,'redeem', 'Redeemed 1000 TechCoins — Free Screen Guard', NOW() - INTERVAL '2 months'),
    ('lt-mob-014', 'mer-mob', 'mem-mob-2', 2150, 'earn',   'iPhone 15 case + MagSafe charger + AirTag bundle', NOW() - INTERVAL '1 month'),

    -- Kavya Reddy (MOB004)
    ('lt-mob-020', 'mer-mob', 'mem-mob-4', 200,  'earn',   'OnePlus 12 screen guard installation',   NOW() - INTERVAL '3 months'),
    ('lt-mob-021', 'mer-mob', 'mem-mob-4', 25,   'earn',   'Handset health diagnostic visit',         NOW() - INTERVAL '2 months'),
    ('lt-mob-022', 'mer-mob', 'mem-mob-4', 1875, 'earn',   'OnePlus Buds Pro 2 + case + charger',     NOW() - INTERVAL '1 month'),

    -- Rahul Tiwari (MOB005)
    ('lt-mob-030', 'mer-mob', 'mem-mob-5', 300,  'earn',   'Pixel 8 screen replacement — earned points', NOW() - INTERVAL '5 months'),
    ('lt-mob-031', 'mer-mob', 'mem-mob-5', 25,   'earn',   'Handset diagnostic checkup',              NOW() - INTERVAL '4 months'),
    ('lt-mob-032', 'mer-mob', 'mem-mob-5', -500, 'redeem', 'Redeemed 500 TechCoins — ₹50 instant off', NOW() - INTERVAL '3 months'),
    ('lt-mob-033', 'mer-mob', 'mem-mob-5', 500,  'earn',   'Battery replacement + accessories',       NOW() - INTERVAL '1 month'),
    ('lt-mob-034', 'mer-mob', 'mem-mob-5', 535,  'earn',   'Wednesday promo + referral bonus',        NOW() - INTERVAL '2 weeks'),

    -- Sneha Sharma (MOB010 — referred by Neha)
    ('lt-mob-040', 'mer-mob', 'mem-mob-10', 100, 'earn',   'Referral welcome bonus',                  NOW() - INTERVAL '4 months'),
    ('lt-mob-041', 'mer-mob', 'mem-mob-10', 200, 'earn',   'TWS earbuds purchase — TechCoins earned', NOW() - INTERVAL '3 months'),
    ('lt-mob-042', 'mer-mob', 'mem-mob-10', 50,  'earn',   'Birthday gift pack — bonus TechCoins',    NOW() - INTERVAL '2 months'),
    ('lt-mob-043', 'mer-mob', 'mem-mob-10', 380, 'earn',   'Smartwatch strap + screen protector',     NOW() - INTERVAL '1 month');


-- ── STEP 9 : REWARD CATALOG ──────────────────────────────────────────────────
INSERT INTO reward_catalog (id, merchant_id, name, description, points_cost, quantity_available, is_active)
VALUES
    ('rew-mob-1', 'mer-mob', 'Fast 65W GaN Dual-Port Charger',
     'Type-C + USB-A ultra-fast charger with 65W output — compatible with all brands.',
     600, 15, true),

    ('rew-mob-2', 'mer-mob', 'Premium Wireless Earbuds (TWS)',
     'True wireless stereo earbuds with 24hr battery + ANC mode.',
     1200, 8, true),

    ('rew-mob-3', 'mer-mob', 'Free Screen Guard (Any Model)',
     '11D tempered glass guard with installation — redeemable for any phone model.',
     1000, NULL, true),

    ('rew-mob-4', 'mer-mob', '₹500 Repair Credit Voucher',
     'Flat ₹500 off on your next screen or battery replacement.',
     500, 50, true),

    ('rew-mob-5', 'mer-mob', 'MagSafe Wireless Charger Pad (15W)',
     '15W Qi2/MagSafe compatible wireless charging pad — for iPhone 12 and above.',
     800, 10, true),

    ('rew-mob-6', 'mer-mob', '16GB Branded USB 3.0 Pen Drive',
     'High-speed 16GB USB pen drive with shock-resistant body.',
     300, 30, true),

    ('rew-mob-7', 'mer-mob', 'Free Data Backup Service Pass',
     'Up to 64GB data backup and device transfer — redeemable on next visit.',
     400, NULL, true)

ON CONFLICT (id) DO UPDATE SET
    name         = EXCLUDED.name,
    points_cost  = EXCLUDED.points_cost,
    is_active    = EXCLUDED.is_active;


-- ── STEP 10 : SCRATCH CARDS ──────────────────────────────────────────────────
INSERT INTO scratch_cards (id, merchant_id, member_id, reward_type, reward_value, is_revealed, trigger_visit, created_at)
VALUES
    -- Unrevealed cards (pending)
    ('sc-mob-1', 'mer-mob', 'mem-mob-1', 'points',  '250 Bonus TechCoins',    false, 5,  NOW() - INTERVAL '2 months'),
    ('sc-mob-2', 'mer-mob', 'mem-mob-2', 'voucher', 'Free TWS Earbuds',       false, 10, NOW() - INTERVAL '1 month'),
    ('sc-mob-3', 'mer-mob', 'mem-mob-5', 'points',  '100 Bonus TechCoins',    false, 3,  NOW() - INTERVAL '3 weeks'),
    ('sc-mob-4', 'mer-mob', 'mem-mob-8', 'discount','₹200 Off Next Purchase', false, 2,  NOW() - INTERVAL '1 week'),
    -- Already revealed
    ('sc-mob-5', 'mer-mob', 'mem-mob-4', 'points',  '150 Bonus TechCoins',    true,  5,  NOW() - INTERVAL '2 months'),
    ('sc-mob-6', 'mer-mob', 'mem-mob-6', 'voucher', 'Free Screen Guard',      true,  8,  NOW() - INTERVAL '3 months')

ON CONFLICT (id) DO UPDATE SET
    reward_value = EXCLUDED.reward_value;


-- ── STEP 11 : REMINDER RULES ─────────────────────────────────────────────────
DELETE FROM reminder_rules WHERE merchant_id = 'mer-mob';

INSERT INTO reminder_rules (id, merchant_id, trigger_type, channel, template_text, threshold_value, days_before, active, send_time, timezone)
VALUES
    -- 30 days before membership expiry
    ('rr-mob-1', 'mer-mob', 'expiry', 'whatsapp',
     'Hi {name}! 📱 Your Metro Mobile Tech Elite membership expires in 30 days. Renew now and keep enjoying free screen guards, priority repairs & 10% off accessories. Tap to renew 👉',
     NULL, 30, true, '10:00:00', 'Asia/Kolkata'),

    -- 7 days before expiry — urgent reminder
    ('rr-mob-2', 'mer-mob', 'expiry', 'whatsapp',
     '⚠️ Hi {name}, only 7 days left on your Metro Mobile membership! Don''t lose your {loyalty_points} TechCoins and VIP benefits. Renew before they expire! 🔧',
     NULL, 7, true, '11:00:00', 'Asia/Kolkata'),

    -- Birthday greeting
    ('rr-mob-3', 'mer-mob', 'birthday', 'whatsapp',
     '🎂 Happy Birthday {name}! Metro Mobile & Tech Hub wishes you a great day. As a gift, collect your FREE surprise tech accessory pack in-store this month! 🎁',
     NULL, 0, true, '09:00:00', 'Asia/Kolkata'),

    -- Idle member — no visit in 60 days
    ('rr-mob-4', 'mer-mob', 'inactivity', 'whatsapp',
     'Hi {name}! 👋 We haven''t seen you in a while at Metro Mobile. You have {loyalty_points} TechCoins waiting to be used. Visit us this week for double TechCoins Wednesday! 💪',
     60, 0, true, '12:00:00', 'Asia/Kolkata'),

    -- Points milestone — 1000 TechCoins earned
    ('rr-mob-5', 'mer-mob', 'points_milestone', 'whatsapp',
     '🏆 Congrats {name}! You just crossed 1,000 TechCoins at Metro Mobile. Redeem them for a FREE screen guard or ₹50 off your next bill. Visit us today! 📱',
     1000, 0, true, '10:30:00', 'Asia/Kolkata');


-- ── STEP 12 : MEMBER OFFER STATES (track available offers per member) ─────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_offer_state') THEN

        -- Sanjay Sharma — Tech Elite: has glass guard offer active
        INSERT INTO member_offer_state (id, member_id, offer_template_id, remaining_qty, initial_qty, status)
        VALUES
            ('mos-mob-01', 'mem-mob-1', 'off-mob-1', 1, 1, 'active'),  -- glass guard: 1 left
            ('mos-mob-02', 'mem-mob-1', 'off-mob-2', 1, 2, 'active'),  -- diagnostics: 1 of 2 left
            ('mos-mob-03', 'mem-mob-1', 'off-mob-5', NULL, NULL, 'active')  -- 10% off accessories: unlimited
        ON CONFLICT (id) DO NOTHING;

        -- Neha Kapoor — Tech Elite: glass guard exhausted, diagnostics active
        INSERT INTO member_offer_state (id, member_id, offer_template_id, remaining_qty, initial_qty, status)
        VALUES
            ('mos-mob-04', 'mem-mob-2', 'off-mob-1', 0, 1, 'exhausted'), -- glass guard: used
            ('mos-mob-05', 'mem-mob-2', 'off-mob-2', 2, 2, 'active'),    -- diagnostics: both available
            ('mos-mob-06', 'mem-mob-2', 'off-mob-5', NULL, NULL, 'active')
        ON CONFLICT (id) DO NOTHING;

        -- Rahul Tiwari — Gadget Pro: express repair active
        INSERT INTO member_offer_state (id, member_id, offer_template_id, remaining_qty, initial_qty, status)
        VALUES
            ('mos-mob-07', 'mem-mob-5', 'off-mob-4', 1, 1, 'active'),  -- ₹500 off screen repair
            ('mos-mob-08', 'mem-mob-5', 'off-mob-3', 1, 1, 'active')   -- free data backup
        ON CONFLICT (id) DO NOTHING;

    END IF;
END$$;


-- ── FINAL : CONFIRMATION ─────────────────────────────────────────────────────
SELECT
    '✅ Metro Mobile & Tech Hub — Demo Seed Complete!' AS result,
    (SELECT COUNT(*) FROM members       WHERE merchant_id = 'mer-mob') AS total_members,
    (SELECT COUNT(*) FROM offer_templates WHERE merchant_id = 'mer-mob') AS total_offers,
    (SELECT COUNT(*) FROM reward_catalog WHERE merchant_id = 'mer-mob') AS reward_catalog_items,
    (SELECT COUNT(*) FROM scratch_cards  WHERE merchant_id = 'mer-mob') AS scratch_cards,
    (SELECT COUNT(*) FROM reminder_rules WHERE merchant_id = 'mer-mob') AS reminder_rules;
