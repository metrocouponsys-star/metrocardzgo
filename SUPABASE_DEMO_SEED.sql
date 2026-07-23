-- =============================================================================
-- METRO CARDZ — SUPABASE PRODUCTION MASTER DEMO SEED SCRIPT
-- =============================================================================
-- Copy & paste this ENTIRE script into your Supabase SQL Editor and click RUN.
-- Populates all 16 Target Vertical Merchant Accounts with pre-configured
-- membership tiers, offers, member cards, reward catalog, scratch cards,
-- reminder rules, and login passwords ("demo123").
-- =============================================================================

-- ── 1. SCHEMA INTEGRITY FIXES ──
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
END$$;

-- Enable pgcrypto for UUID & Hash functions if missing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fix secret_salt NOT NULL constraint on merchants table
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS secret_salt TEXT;
ALTER TABLE merchants ALTER COLUMN secret_salt SET DEFAULT md5(random()::text);
UPDATE merchants SET secret_salt = md5(random()::text) WHERE secret_salt IS NULL;

-- Ensure offer_type enum contains 'points_redemption'
ALTER TYPE offer_type ADD VALUE IF NOT EXISTS 'points_redemption';

-- Create Tables if missing
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


-- ── 2. INSERT / UPDATE MERCHANTS (ALL 16 VERTICALS) ──
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


-- ── 3. CLEAN UP EXISTING DEMO USERS TO AVOID EMAIL/PHONE UNIQUE CONSTRAINTS ──
DELETE FROM merchant_users 
WHERE phone IN ('9876500001','9876500002','9876500003','9876500004','9876500005','9876500006','9876543210','9876500007','9876500008','9876500009','9876500010','9876500011','9876500012','9876500013','9876500014','9876500015','9876500016','9000000000')
   OR email IN ('insurance@metrocardz.in','realestate@metrocardz.in','travels@metrocardz.in','acservices@metrocardz.in','supermarket@metrocardz.in','gym@metrocardz.in','salon@metrocardz.in','automobile@metrocardz.in','cafe@metrocardz.in','restaurant@metrocardz.in','jewellery@metrocardz.in','garments@metrocardz.in','boutique@metrocardz.in','optician@metrocardz.in','footwear@metrocardz.in','dental@metrocardz.in','mobile@metrocardz.in','admin@metrocardz.in');


-- ── 4. INSERT MERCHANT USERS (PASSWORD = "demo123") ──
INSERT INTO merchant_users (id, merchant_id, name, phone, email, role, password_hash)
VALUES
  ('usr-ins',  'mer-ins', 'Suresh Gupta (Insurance Dir.)',  '9876500001', 'insurance@metrocardz.in',  'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-re',   'mer-re',  'Vikram Malhotra (Realty Dir.)',  '9876500002', 'realestate@metrocardz.in', 'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-trv',  'mer-trv', 'Rohan Mehta (Travel Dir.)',     '9876500003', 'travels@metrocardz.in',    'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-ac',   'mer-ac',  'Sunil Verma (HVAC Lead)',        '9876500004', 'acservices@metrocardz.in', 'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-sup',  'mer-sup', 'Sangeeta Patel (Store Mgr.)',    '9876500005', 'supermarket@metrocardz.in','owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-gym',  'mer-gym', 'Karan Malhotra (Head Coach)',   '9876500006', 'gym@metrocardz.in',        'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-sln',  'mer-sln', 'Rajesh Kumar (Salon Owner)',     '9876543210', 'salon@metrocardz.in',      'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-auto', 'mer-auto', 'Vikramaditya Rao (Studio Owner)','9876500008', 'automobile@metrocardz.in', 'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-caf',  'mer-caf', 'Anish Giri (Head Barista)',      '9876500009', 'cafe@metrocardz.in',       'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-jwl',  'mer-jwl', 'Ramesh Agrawal (Managing Dir.)','9876500010', 'jewellery@metrocardz.in',  'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-grm',  'mer-grm', 'Manish Kapoor (Fashion Dir.)',   '9876500011', 'garments@metrocardz.in',   'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-btq',  'mer-btq', 'Anita Singhania (Head Designer)','9876500012', 'boutique@metrocardz.in',   'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-opt',  'mer-opt', 'Dr. Alok Verma (Optometrist)',   '9876500013', 'optician@metrocardz.in',   'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-ftw',  'mer-ftw', 'Deepak Chhabra (Lounge Mgr)',    '9876500014', 'footwear@metrocardz.in',   'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-dnt',  'mer-dnt', 'Dr. Kavita Rao (Chief Dentist)', '9876500015', 'dental@metrocardz.in',     'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-mob',  'mer-mob', 'Sanjay Sharma (Tech Director)',  '9876500016', 'mobile@metrocardz.in',     'owner',       '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'),
  ('usr-admin', NULL,      'Super Admin Platform',           '9000000000', 'admin@metrocardz.in',      'super_admin', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW');


-- ── 5. INSERT MEMBERSHIP TYPES (TIERS) ──
INSERT INTO membership_types (id, merchant_id, name, description)
VALUES
  ('mtype-ins-1', 'mer-ins', 'Shield Elite', 'Multi-policy health + auto holder with 1.5x Safety Points'),
  ('mtype-ins-2', 'mer-ins', 'Heritage VIP', 'High net worth client with dedicated claims manager'),
  ('mtype-re-1',  'mer-re',  'Prestige Buyer VIP', 'Property buyer with snagging inspection and interior subsidies'),
  ('mtype-re-2',  'mer-re',  'Home Owner Preferred', 'Verified buyer with legal agreement benefits'),
  ('mtype-trv-1', 'mer-trv', 'Globetrotter', 'Frequent traveler with 5% Miles cashback and free visa assistance'),
  ('mtype-trv-2', 'mer-trv', 'Explorer', 'Standard travel package member'),
  ('mtype-ac-1',  'mer-ac',  'AMC Gold VIP', '4 Free Servicings/Year + 20% Gas Charging Discount'),
  ('mtype-ac-2',  'mer-ac',  'AMC Silver', '2 Free Servicings/Year + 10% parts discount'),
  ('mtype-sup-1', 'mer-sup', 'Super Shopper', 'Monthly grocery spend > ₹5,000 with 2x Kirana Cash'),
  ('mtype-sup-2', 'mer-sup', 'VIP Family Club', 'Monthly spend > ₹15,000 with express checkout counter access'),
  ('mtype-gym-1', 'mer-gym', 'Pro Athlete', 'Annual gym access + 2 PT sessions + free locker'),
  ('mtype-gym-2', 'mer-gym', 'Elite Champion VIP', 'Unlimited InBody scans + towel service + bar discounts'),
  ('mtype-sln-1', 'mer-sln', 'Prime', 'Premium salon membership with priority booking and styling'),
  ('mtype-sln-2', 'mer-sln', 'Standard', 'Basic salon membership for grooming discounts'),
  ('mtype-auto-1','mer-auto', 'Shield Ceramic VIP', 'Ceramic/PPF Coated vehicle with free hydrophobic boost'),
  ('mtype-auto-2','mer-auto', 'Drive Pro', 'Multi-car family pass with free wheel alignment'),
  ('mtype-caf-1', 'mer-caf', 'Brew Master Club', '10% off coffee beans & digital punch card (Buy 5 Get 1 Free)'),
  ('mtype-caf-2', 'mer-caf', 'Work-From-Cafe VIP', 'Dedicated charging table + free muffin on 5th visit'),
  ('mtype-jwl-1', 'mer-jwl', 'Gold Elite', 'Gold Savings Scheme subscriber with 30% Off Making Charges'),
  ('mtype-jwl-2', 'mer-jwl', 'Solitaire Crown VIP', 'High-value diamond buyer with 50% making charge waiver'),
  ('mtype-grm-1', 'mer-grm', 'Fashionista Elite', '15% flat cashback + complimentary alterations'),
  ('mtype-btq-1', 'mer-btq', 'Royal Couture VIP', 'Custom fitting specialist + VIP Trial Lounge access'),
  ('mtype-opt-1', 'mer-opt', 'Vision Care VIP', 'Free annual computer eye exam + 20% off anti-glare lenses'),
  ('mtype-ftw-1', 'mer-ftw', 'Sole Club VIP', 'Free leather shoe conditioning + 15% cashback on footwear'),
  ('mtype-dnt-1', 'mer-dnt', 'Smile Care VIP', '2 Free scaling & polishing sessions/year + 15% off Aligners'),
  ('mtype-mob-1', 'mer-mob', 'Tech Elite', '1-year free tempered glass replacement + 10% off accessories')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ── 6. INSERT OFFER TEMPLATES ──
INSERT INTO offer_templates (id, merchant_id, title, description, offer_type, value, active, loyalty_points_earn, is_points_redemption, loyalty_points_cost)
VALUES
  ('off-ins-1', 'mer-ins', 'Early Renewal Cashback Pass', 'Earn 500 Safety Points if renewed early', 'wallet_points', 500, true, 500, false, NULL),
  ('off-ins-2', 'mer-ins', 'Complimentary Full Body Checkup', '1 Free diagnostic checkup at Apollo', 'free_service', 1, true, NULL, false, NULL),
  ('off-re-1',  'mer-re',  'Home Buyer Referral Reward (₹25,000)', 'Earn ₹25,000 voucher when a referred friend buys a home', 'referral', 25000, true, NULL, false, NULL),
  ('off-re-2',  'mer-re',  'Free Home Snagging Inspection', 'Complimentary structural snag check before registry', 'free_service', 1, true, NULL, false, NULL),
  ('off-trv-1', 'mer-trv', '₹5,000 Holiday Package Off', 'Flat ₹5,000 off international holiday packages', 'percent_off', 5000, true, NULL, false, NULL),
  ('off-ac-1',  'mer-ac',  'Pre-Summer Foam Jet Wash', '1 Free Deep Hydro-Foam Jet Service per AMC year', 'free_service', 1, true, NULL, false, NULL),
  ('off-sup-1', 'mer-sup', 'Mid-Week 2x Kirana Points', 'Earn 2x reward points on Tue/Wed billings', 'wallet_points', 2, true, NULL, false, NULL),
  ('off-sup-2', 'mer-sup', '500 Points = ₹50 Instant Cash Discount', 'Burn 500 points at checkout for ₹50 cash credit', 'points_redemption', 50, true, NULL, true, 500),
  ('off-gym-1', 'mer-gym', '12-Workout Monthly Streak Perk', 'Earn 200 bonus FitCoins for completing 12 workouts', 'wallet_points', 200, true, 200, false, NULL),
  ('off-sln-1', 'mer-sln', 'Free Hair Wash', 'Valid on hair styling above ₹800', 'free_service', 1, true, 10, false, NULL),
  ('off-auto-1','mer-auto', 'Complimentary Hydro-Foam Wash', '1 Free car wash with full service', 'free_service', 1, true, NULL, false, NULL),
  ('off-caf-1', 'mer-caf', 'Handcrafted Coffee Punch Card (Buy 5 Get 1 Free)', 'Digital 6-slot coffee stamp card', 'free_service', 1, true, NULL, false, NULL),
  ('off-jwl-1', 'mer-jwl', '30% Off Making Charges', 'Flat 30% discount on making charges', 'percent_off', 30, true, NULL, false, NULL),
  ('off-grm-1', 'mer-grm', 'Flat ₹500 Off Men Suits', 'Flat ₹500 discount on formal suits & blazers', 'percent_off', 500, true, NULL, false, NULL),
  ('off-btq-1', 'mer-btq', 'Complimentary Bridal Styling Consultation', 'Free trial & dupatta dyeing pass', 'free_service', 1, true, NULL, false, NULL),
  ('off-opt-1', 'mer-opt', 'Free 16-Point Computerized Eye Checkup', 'Comprehensive computer vision scan pass', 'free_service', 1, true, NULL, false, NULL),
  ('off-ftw-1', 'mer-ftw', 'Free Leather Shoe Polish & Conditioning Pass', 'Free spa treatment for leather footwear', 'free_service', 1, true, NULL, false, NULL),
  ('off-dnt-1', 'mer-dnt', 'Complimentary Ultrasonic Scaling & Polishing', 'Full teeth cleaning & polishing voucher', 'free_service', 1, true, NULL, false, NULL),
  ('off-mob-1', 'mer-mob', 'Free 11D Tempered Glass Guard Installation', 'Free screen guard with purchase or repair', 'free_service', 1, true, NULL, false, NULL)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- ── 7. INSERT DUMMY MEMBERS & CARDS FOR EACH MERCHANT ──
INSERT INTO members (id, merchant_id, member_code, public_token, physical_card_number, name, phone, membership_type_id, joined_date, expiry_date, loyalty_points, status)
VALUES
  ('mem-ins-1', 'mer-ins', 'INS001', 'tok-ins001', '4000 1000 0001 0001', 'Rajesh Sharma',    '9811122334', 'mtype-ins-1', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', 1450, 'active'),
  ('mem-re-1',  'mer-re',  'RE001',  'tok-re001',  '4000 1000 0002 0001', 'Ananya Deshmukh',  '9822233445', 'mtype-re-1',  CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', 5000, 'active'),
  ('mem-trv-1', 'mer-trv', 'TRV001', 'tok-trv001', '4000 1000 0003 0001', 'Priya Mehta',      '9833344556', 'mtype-trv-1', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', 4800, 'active'),
  ('mem-ac-1',  'mer-ac',  'AC001',  'tok-ac001',  '4000 1000 0004 0001', 'Sunil Verma Jr',   '9844455667', 'mtype-ac-1',  CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '8 months', 1850, 'active'),
  ('mem-sup-1', 'mer-sup', 'SUP001', 'tok-sup001', '4000 1000 0005 0001', 'Sangeeta Patel',   '9855566778', 'mtype-sup-1', CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '7 months', 680,  'active'),
  ('mem-gym-1', 'mer-gym', 'GYM001', 'tok-gym001', '4000 1000 0006 0001', 'Karan Malhotra',   '9866677889', 'mtype-gym-1', CURRENT_DATE - INTERVAL '1 month',  CURRENT_DATE + INTERVAL '11 months', 850,  'active'),
  ('mem-sln-1', 'mer-sln', 'SAL001', 'tok-sln001', '4821 6739 0012 3847', 'Arjun Sharma',     '9845012345', 'mtype-sln-1', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', 350,  'active'),
  ('mem-auto-1','mer-auto','AUT001', 'tok-aut001', '4000 1000 0008 0001', 'Vikramaditya Rao', '9877788990', 'mtype-auto-1',CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', 2100, 'active'),
  ('mem-caf-1', 'mer-caf', 'CAF001', 'tok-caf001', '4000 1000 0009 0001', 'Anish Giri',       '9888899001', 'mtype-caf-1', CURRENT_DATE - INTERVAL '1 month',  CURRENT_DATE + INTERVAL '11 months', 420,  'active'),
  ('mem-jwl-1', 'mer-jwl', 'JWL001', 'tok-jwl001', '4000 1000 0010 0001', 'Sunita Agrawal',   '9899900112', 'mtype-jwl-1', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', 14500,'active'),
  ('mem-grm-1', 'mer-grm', 'GRM001', 'tok-grm001', '4000 1000 0011 0001', 'Manish Kapoor Jr', '9812345678', 'mtype-grm-1', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', 920,  'active'),
  ('mem-btq-1', 'mer-btq', 'BTQ001', 'tok-btq001', '4000 1000 0012 0001', 'Anita Singhania',  '9823456789', 'mtype-btq-1', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', 3200, 'active'),
  ('mem-opt-1', 'mer-opt', 'OPT001', 'tok-opt001', '4000 1000 0013 0001', 'Dr. Alok Verma',   '9834567890', 'mtype-opt-1', CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '8 months', 1150, 'active'),
  ('mem-ftw-1', 'mer-ftw', 'FTW001', 'tok-ftw001', '4000 1000 0014 0001', 'Deepak Chhabra',   '9845678901', 'mtype-ftw-1', CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '7 months', 780,  'active'),
  ('mem-dnt-1', 'mer-dnt', 'DNT001', 'tok-dnt001', '4000 1000 0015 0001', 'Dr. Kavita Rao',   '9856789012', 'mtype-dnt-1', CURRENT_DATE - INTERVAL '1 month',  CURRENT_DATE + INTERVAL '11 months', 1650, 'active'),
  ('mem-mob-1', 'mer-mob', 'MOB001', 'tok-mob001', '4000 1000 0016 0001', 'Sanjay Sharma',    '9867890123', 'mtype-mob-1', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', 1280, 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  loyalty_points = EXCLUDED.loyalty_points;

-- ── 8. SEED REWARD CATALOG ──
INSERT INTO reward_catalog (id, merchant_id, name, description, points_cost, quantity_available, is_active)
VALUES
  ('rew-dnt-1', 'mer-dnt', 'Complimentary Teeth Scaling & Polishing', 'Full ultrasonic scaling session', 400, 30, true),
  ('rew-opt-1', 'mer-opt', 'Free 16-Point Eye Checkup', 'Computerized vision exam voucher', 200, 50, true),
  ('rew-grm-1', 'mer-grm', '₹500 Garments Billing Credit', 'Flat ₹500 discount on shopping bill', 500, 100, true),
  ('rew-btq-1', 'mer-btq', 'Custom Dupatta Dyeing & Fitting Pass', 'Free trial & fitting consultation', 300, 20, true),
  ('rew-ftw-1', 'mer-ftw', 'Leather Shoe Shine & Conditioning Kit', 'Horsehair brush & neutral polish kit', 300, 25, true),
  ('rew-mob-1', 'mer-mob', 'Fast 65W GaN Dual-Port Charger', 'Type-C ultra-fast charger', 600, 15, true),
  ('rew-sln-1', 'mer-sln', 'Free Hair Wash & Blow-Dry', 'Deep hair wash & conditioning styling', 250, NULL, true),
  ('rew-jwl-1', 'mer-jwl', '10g 999 Fine Silver Coin', 'Hallmarked pure silver coin', 1500, 10, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  points_cost = EXCLUDED.points_cost;

-- ── 9. SEED SCRATCH CARDS ──
INSERT INTO scratch_cards (id, merchant_id, member_id, reward_type, reward_value, is_revealed, trigger_visit)
VALUES
  ('sc-dnt-1', 'mer-dnt', 'mem-dnt-1', 'points',  '200 Bonus Points', false, 5),
  ('sc-sln-1', 'mer-sln', 'mem-sln-1', 'voucher', 'Free Manicure Pass', true, 10),
  ('sc-opt-1', 'mer-opt', 'mem-opt-1', 'points',  '100 Bonus Points', false, 3)
ON CONFLICT (id) DO UPDATE SET
  reward_value = EXCLUDED.reward_value;

-- ── 10. SEED REMINDER RULES ──
INSERT INTO reminder_rules (id, merchant_id, trigger_type, channel, template_text, days_before, active)
VALUES
  ('rr-sln-1', 'mer-sln', 'birthday', 'whatsapp', 'Happy Birthday {name}! 🎂 Enjoy a complimentary hair spa at Glamour Salon this month.', 0, true),
  ('rr-ins-1', 'mer-ins', 'expiry',   'whatsapp', 'Hi {name}, your insurance policy expires in 30 days. Renew early for 500 bonus Safety Points!', 30, true),
  ('rr-dnt-1', 'mer-dnt', 'expiry',   'whatsapp', 'Hi {name}, it has been 6 months since your last dental cleaning! Book your checkup today.', 7, true)
ON CONFLICT (id) DO UPDATE SET
  template_text = EXCLUDED.template_text;

-- ── 11. CONFIRMATION MESSAGE ──
SELECT '✅ Successfully seeded 16 Merchant Accounts into Supabase!' AS result;
