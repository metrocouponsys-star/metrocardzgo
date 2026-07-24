import type {
  Merchant, MerchantUser, MembershipType, Member, OfferTemplate,
  MemberOfferState, Redemption, ReminderRule, Campaign,
  DashboardStats, AdminDashboardStats, PublicMemberView, CardInventoryItem,
  LoyaltyTransaction
} from '../types';

// ===== MERCHANTS (16 Core Industry Verticals) =====
export const merchants: Merchant[] = [
  { id: 'mer-001', business_name: 'Glamour Salon & Spa', category: 'Salon', plan_tier: 'Professional', whatsapp_number: '+91 98765 43210', address: '12, MG Road, Bengaluru, Karnataka 560001', status: 'active', created_at: '2024-01-15T10:00:00Z', member_count: 284 },
  { id: 'mer-ins', business_name: 'Metro Insurance Agency', category: 'Insurance', plan_tier: 'Enterprise', whatsapp_number: '+91 98765 00001', address: 'Suite 402, Financial District, Mumbai', status: 'active', created_at: '2024-01-10T10:00:00Z', member_count: 412 },
  { id: 'mer-re', business_name: 'Metro Realty & Advisory', category: 'Real Estate', plan_tier: 'Professional', whatsapp_number: '+91 98765 00002', address: 'Floor 12, World Trade Center, Gurugram', status: 'active', created_at: '2024-01-12T10:00:00Z', member_count: 185 },
  { id: 'mer-trv', business_name: 'Metro Travels & Global Vacations', category: 'Travels', plan_tier: 'Professional', whatsapp_number: '+91 98765 00003', address: 'Connaught Place, New Delhi 110001', status: 'active', created_at: '2024-01-18T10:00:00Z', member_count: 320 },
  { id: 'mer-ac', business_name: 'Metro AC Services & HVAC Solutions', category: 'AC Services', plan_tier: 'Starter', whatsapp_number: '+91 98765 00004', address: 'Industrial Estate, Phase II, Ahmedabad', status: 'active', created_at: '2024-02-01T10:00:00Z', member_count: 540 },
  { id: 'mer-sup', business_name: 'Metro Supermarket & Hypermart', category: 'Supermarket', plan_tier: 'Enterprise', whatsapp_number: '+91 98765 00005', address: 'Main Road, Koramangala, Bengaluru', status: 'active', created_at: '2024-02-10T10:00:00Z', member_count: 1250 },
  { id: 'mer-gym', business_name: 'Metro Gym & Fitness Club', category: 'Gym', plan_tier: 'Professional', whatsapp_number: '+91 98765 00006', address: '8th Main, Indiranagar, Bengaluru', status: 'active', created_at: '2024-02-15T10:00:00Z', member_count: 610 },
  { id: 'mer-auto', business_name: 'Metro Auto Garage & Detailing', category: 'Automobile', plan_tier: 'Professional', whatsapp_number: '+91 98765 00008', address: 'GIDC Auto Hub, Pune, Maharashtra', status: 'active', created_at: '2024-03-01T10:00:00Z', member_count: 290 },
  { id: 'mer-caf', business_name: 'Metro Roasters & Fine Dining', category: 'Restaurant', plan_tier: 'Starter', whatsapp_number: '+91 98765 00009', address: 'Bandra West, Mumbai 400050', status: 'active', created_at: '2024-03-05T10:00:00Z', member_count: 890 },
  { id: 'mer-jwl', business_name: 'Metro Jewels & Diamond Heritage', category: 'Jewellery', plan_tier: 'Enterprise', whatsapp_number: '+91 98765 00010', address: 'Zaveri Bazaar, Mumbai 400002', status: 'active', created_at: '2024-03-10T10:00:00Z', member_count: 340 },
  { id: 'mer-grm', business_name: 'Metro Fashion & Garment Studio', category: 'Readymade Garments', plan_tier: 'Professional', whatsapp_number: '+91 98765 00011', address: 'Commercial Street, Bengaluru 560001', status: 'active', created_at: '2024-03-12T10:00:00Z', member_count: 430 },
  { id: 'mer-btq', business_name: 'Royal Bridal Boutique & Couture', category: 'Boutique', plan_tier: 'Professional', whatsapp_number: '+91 98765 00012', address: 'South Extension II, New Delhi 110049', status: 'active', created_at: '2024-03-15T10:00:00Z', member_count: 215 },
  { id: 'mer-opt', business_name: 'Vision Craft Opticians & Eyewear', category: 'Optician', plan_tier: 'Starter', whatsapp_number: '+91 98765 00013', address: 'FC Road, Pune, Maharashtra 411004', status: 'active', created_at: '2024-03-18T10:00:00Z', member_count: 310 },
  { id: 'mer-ftw', business_name: 'Sole Comfort Footwear Lounge', category: 'Footwear', plan_tier: 'Starter', whatsapp_number: '+91 98765 00014', address: 'Park Street, Kolkata, West Bengal 700016', status: 'active', created_at: '2024-03-20T10:00:00Z', member_count: 260 },
  { id: 'mer-dnt', business_name: 'Apex Dental Studio & Smile Clinic', category: 'Dental', plan_tier: 'Professional', whatsapp_number: '+91 98765 00015', address: 'Banjara Hills, Hyderabad, Telangana 500034', status: 'active', created_at: '2024-03-22T10:00:00Z', member_count: 195 },
  { id: 'mer-mob', business_name: 'Metro Mobile & Electronics Hub', category: 'Mobile', plan_tier: 'Professional', whatsapp_number: '+91 98765 00016', address: 'Nehru Place, New Delhi 110019', status: 'active', created_at: '2024-03-25T10:00:00Z', member_count: 520 },
];

// ===== MERCHANT USERS (Login Credentials for all 16 Verticals) =====
export const merchantUsers: MerchantUser[] = [
  { id: 'usr-001', merchant_id: 'mer-001', name: 'Rajesh Kumar (Salon Owner)', phone: '+91 98765 43210', email: 'salon@metrocardz.in', role: 'owner', created_at: '2024-01-15T10:00:00Z' },
  { id: 'usr-002', merchant_id: 'mer-001', name: 'Priya Nair (Stylist)', phone: '+91 98765 11111', role: 'staff', created_at: '2024-02-01T10:00:00Z' },
  { id: 'usr-ins', merchant_id: 'mer-ins', name: 'Suresh Gupta (Insurance Dir.)', phone: '+91 98765 00001', email: 'insurance@metrocardz.in', role: 'owner', created_at: '2024-01-10T10:00:00Z' },
  { id: 'usr-re', merchant_id: 'mer-re', name: 'Vikram Malhotra (Realty Advisor)', phone: '+91 98765 00002', email: 'realestate@metrocardz.in', role: 'owner', created_at: '2024-01-12T10:00:00Z' },
  { id: 'usr-trv', merchant_id: 'mer-trv', name: 'Rohan Mehta (Travel Director)', phone: '+91 98765 00003', email: 'travels@metrocardz.in', role: 'owner', created_at: '2024-01-18T10:00:00Z' },
  { id: 'usr-ac', merchant_id: 'mer-ac', name: 'Sunil Verma (HVAC Service Lead)', phone: '+91 98765 00004', email: 'acservices@metrocardz.in', role: 'owner', created_at: '2024-02-01T10:00:00Z' },
  { id: 'usr-sup', merchant_id: 'mer-sup', name: 'Sangeeta Patel (Store Manager)', phone: '+91 98765 00005', email: 'supermarket@metrocardz.in', role: 'owner', created_at: '2024-02-10T10:00:00Z' },
  { id: 'usr-gym', merchant_id: 'mer-gym', name: 'Karan Malhotra (Head Coach)', phone: '+91 98765 00006', email: 'gym@metrocardz.in', role: 'owner', created_at: '2024-02-15T10:00:00Z' },
  { id: 'usr-auto', merchant_id: 'mer-auto', name: 'Vikramaditya Rao (Studio Owner)', phone: '+91 98765 00008', email: 'automobile@metrocardz.in', role: 'owner', created_at: '2024-03-01T10:00:00Z' },
  { id: 'usr-caf', merchant_id: 'mer-caf', name: 'Anish Giri (Head Chef & Barista)', phone: '+91 98765 00009', email: 'cafe@metrocardz.in', role: 'owner', created_at: '2024-03-05T10:00:00Z' },
  { id: 'usr-jwl', merchant_id: 'mer-jwl', name: 'Ramesh Agrawal (Managing Dir.)', phone: '+91 98765 00010', email: 'jewellery@metrocardz.in', role: 'owner', created_at: '2024-03-10T10:00:00Z' },
  { id: 'usr-grm', merchant_id: 'mer-grm', name: 'Manish Kapoor (Fashion Owner)', phone: '+91 98765 00011', email: 'garments@metrocardz.in', role: 'owner', created_at: '2024-03-12T10:00:00Z' },
  { id: 'usr-btq', merchant_id: 'mer-btq', name: 'Anita Singhania (Head Designer)', phone: '+91 98765 00012', email: 'boutique@metrocardz.in', role: 'owner', created_at: '2024-03-15T10:00:00Z' },
  { id: 'usr-opt', merchant_id: 'mer-opt', name: 'Dr. Alok Verma (Optometrist)', phone: '+91 98765 00013', email: 'optician@metrocardz.in', role: 'owner', created_at: '2024-03-18T10:00:00Z' },
  { id: 'usr-ftw', merchant_id: 'mer-ftw', name: 'Deepak Chhabra (Lounge Mgr)', phone: '+91 98765 00014', email: 'footwear@metrocardz.in', role: 'owner', created_at: '2024-03-20T10:00:00Z' },
  { id: 'usr-dnt', merchant_id: 'mer-dnt', name: 'Dr. Kavita Rao (Chief Dentist)', phone: '+91 98765 00015', email: 'dental@metrocardz.in', role: 'owner', created_at: '2024-03-22T10:00:00Z' },
  { id: 'usr-mob', merchant_id: 'mer-mob', name: 'Sanjay Sharma (Tech Director)', phone: '+91 98765 00016', email: 'mobile@metrocardz.in', role: 'owner', created_at: '2024-03-25T10:00:00Z' },
  { id: 'usr-admin', merchant_id: undefined as any, name: 'Super Admin Platform', phone: '+91 90000 00000', email: 'admin@metrocardz.in', role: 'super_admin', created_at: '2024-01-01T00:00:00Z' },
];

// ===== MEMBERSHIP TYPES =====
export const membershipTypes: MembershipType[] = [
  { id: 'mtype-001', merchant_id: 'mer-001', name: 'Prime', description: 'Premium salon membership with priority booking and free styling.', member_count: 189 },
  { id: 'mtype-002', merchant_id: 'mer-001', name: 'Standard', description: 'Basic salon membership for discounts on grooming.', member_count: 95 },
  { id: 'mtype-ins-1', merchant_id: 'mer-ins', name: 'Shield Elite', description: 'Multi-policy health + auto holder with 1.5x points and free checkup.', member_count: 210 },
  { id: 'mtype-re-1', merchant_id: 'mer-re', name: 'Prestige Buyer VIP', description: 'Property buyer with snagging inspection and interior subsidies.', member_count: 84 },
  { id: 'mtype-trv-1', merchant_id: 'mer-trv', name: 'Globetrotter', description: 'Frequent traveler with 5% Miles cashback and free visa assistance.', member_count: 145 },
  { id: 'mtype-ac-1', merchant_id: 'mer-ac', name: 'AMC Gold VIP', description: '4 Free Servicings/Year + 20% Gas Charging Discount.', member_count: 320 },
  { id: 'mtype-sup-1', merchant_id: 'mer-sup', name: 'Super Shopper', description: 'Monthly grocery spend > ₹5,000 with 2x Kirana Points.', member_count: 780 },
  { id: 'mtype-gym-1', merchant_id: 'mer-gym', name: 'Pro Athlete', description: 'Annual gym access + 2 PT sessions + free locker.', member_count: 380 },
  { id: 'mtype-auto-1', merchant_id: 'mer-auto', name: 'Shield Ceramic VIP', description: 'Ceramic/PPF Coated vehicle with free quarterly hydrophobic boost.', member_count: 120 },
  { id: 'mtype-caf-1', merchant_id: 'mer-caf', name: 'Brew Master Club', description: '10% off coffee beans & digital punch card (Buy 5 Get 1 Free).', member_count: 540 },
  { id: 'mtype-jwl-1', merchant_id: 'mer-jwl', name: 'Gold Elite', description: 'Gold Savings Scheme subscriber with 30% Off Making Charges.', member_count: 210 },
  { id: 'mtype-grm-1', merchant_id: 'mer-grm', name: 'Fashionista Elite', description: '15% flat cashback + complimentary alterations.', member_count: 260 },
  { id: 'mtype-btq-1', merchant_id: 'mer-btq', name: 'Royal Couture VIP', description: 'Custom fitting specialist + VIP Trial Lounge access.', member_count: 120 },
  { id: 'mtype-opt-1', merchant_id: 'mer-opt', name: 'Vision Care VIP', description: 'Free annual computer eye exam + 20% off anti-glare lenses.', member_count: 180 },
  { id: 'mtype-ftw-1', merchant_id: 'mer-ftw', name: 'Sole Club VIP', description: 'Free leather conditioning + 15% cashback on footwear.', member_count: 140 },
  { id: 'mtype-dnt-1', merchant_id: 'mer-dnt', name: 'Smile Care VIP', description: '2 Free scaling & polishing sessions/year + 15% off Aligners.', member_count: 110 },
  { id: 'mtype-mob-1', merchant_id: 'mer-mob', name: 'Tech Elite', description: '1-year free tempered glass replacement + 10% off accessories.', member_count: 310 },
];

// ===== OFFER TEMPLATES =====
export const offerTemplates: OfferTemplate[] = [
  { id: 'off-001', merchant_id: 'mer-001', title: 'Free Hair Wash', description: 'Valid on hair styling above ₹800.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-001'], loyalty_points_earn: 10 },
  { id: 'off-002', merchant_id: 'mer-001', title: '10% Off All Services', description: 'Flat 10% discount on total billing.', offer_type: 'percent_off', value: 10, active: true, applicable_membership_type_ids: ['mtype-001'], loyalty_points_earn: 20 },
  { id: 'off-008', merchant_id: 'mer-001', title: '100 Points = ₹100 Off', description: 'Redeem 100 loyalty points for ₹100 off.', offer_type: 'points_redemption', value: 100, active: true, applicable_membership_type_ids: ['mtype-001'], is_points_redemption: true, loyalty_points_cost: 100 },

  { id: 'off-ins-1', merchant_id: 'mer-ins', title: 'Early Renewal Cashback Pass', description: 'Earn 500 Safety Points if renewed 30 days before expiry.', offer_type: 'wallet_points', value: 500, active: true, applicable_membership_type_ids: ['mtype-ins-1'], loyalty_points_earn: 500 },
  { id: 'off-ins-2', merchant_id: 'mer-ins', title: 'Complimentary Full Body Health Checkup', description: '1 Free diagnostic checkup voucher at Metropolis/Apollo.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-ins-1'] },

  { id: 'off-re-1', merchant_id: 'mer-re', title: 'Home Buyer Referral Reward (₹25,000)', description: 'Earn ₹25,000 voucher when a referred friend purchases a home.', offer_type: 'referral', value: 25000, active: true, applicable_membership_type_ids: ['mtype-re-1'] },
  { id: 'off-re-2', merchant_id: 'mer-re', title: 'Free Home Snagging & Quality Inspection', description: 'Complimentary structural snag check before registry.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-re-1'] },

  { id: 'off-trv-1', merchant_id: 'mer-trv', title: '₹5,000 Holiday Package Instant Off', description: 'Flat ₹5,000 off international holiday packages.', offer_type: 'percent_off', value: 5000, active: true, applicable_membership_type_ids: ['mtype-trv-1'] },

  { id: 'off-ac-1', merchant_id: 'mer-ac', title: 'Pre-Summer High-Pressure Foam Wash', description: '1 Free Deep Hydro-Foam Jet Service per AMC year.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-ac-1'] },

  { id: 'off-sup-1', merchant_id: 'mer-sup', title: 'Mid-Week 2x Kirana Points', description: 'Earn 2x reward points on Tue/Wed billings.', offer_type: 'wallet_points', value: 2, active: true, applicable_membership_type_ids: ['mtype-sup-1'] },
  { id: 'off-sup-3', merchant_id: 'mer-sup', title: '500 Points = ₹50 Instant Cash Discount', description: 'Burn 500 points at checkout for ₹50 cash credit.', offer_type: 'points_redemption', value: 50, active: true, applicable_membership_type_ids: ['mtype-sup-1'], is_points_redemption: true, loyalty_points_cost: 500 },

  { id: 'off-gym-1', merchant_id: 'mer-gym', title: '12-Workout Monthly Streak Perk', description: 'Earn 200 bonus FitCoins for completing 12 workouts in a month.', offer_type: 'wallet_points', value: 200, active: true, applicable_membership_type_ids: ['mtype-gym-1'], loyalty_points_earn: 200 },

  { id: 'off-auto-1', merchant_id: 'mer-auto', title: 'Complimentary Hydro-Foam Wash', description: '1 Free car wash with full service.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-auto-1'] },

  { id: 'off-caf-1', merchant_id: 'mer-caf', title: 'Coffee Punch Card (Buy 5 Get 1 Free)', description: 'Digital 6-slot coffee stamp card.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-caf-1'] },

  { id: 'off-jwl-1', merchant_id: 'mer-jwl', title: '30% Off Making Charges', description: 'Flat 30% discount on gold/diamond making charges.', offer_type: 'percent_off', value: 30, active: true, applicable_membership_type_ids: ['mtype-jwl-1'] },

  { id: 'off-grm-1', merchant_id: 'mer-grm', title: 'Flat ₹500 Off Men Suit & Blazers', description: 'Flat ₹500 discount on formal wear.', offer_type: 'percent_off', value: 500, active: true, applicable_membership_type_ids: ['mtype-grm-1'] },
  { id: 'off-btq-1', merchant_id: 'mer-btq', title: 'Free Bridal Fitting & Custom Dyeing', description: 'Complimentary trial and dupatta dyeing pass.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-btq-1'] },
  { id: 'off-opt-1', merchant_id: 'mer-opt', title: 'Free Computerized Eye Exam & Vision Test', description: '16-point computer eye scan pass.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-opt-1'] },
  { id: 'off-ftw-1', merchant_id: 'mer-ftw', title: 'Free Leather Shoe Shine & Conditioning Pass', description: '1 Free spa conditioning for leather shoes.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-ftw-1'] },
  { id: 'off-dnt-1', merchant_id: 'mer-dnt', title: 'Complimentary Ultrasonic Scaling & Polishing', description: 'Full teeth cleaning & polishing voucher.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-dnt-1'] },
  { id: 'off-mob-1', merchant_id: 'mer-mob', title: 'Free 11D Tempered Glass Installation', description: 'Free screen guard with any purchase or repair.', offer_type: 'free_service', value: 1, active: true, applicable_membership_type_ids: ['mtype-mob-1'] },
];

// ===== MEMBERS (All 16 Industry Demo Accounts) =====
export const members: Member[] = [
  { id: 'mem-001', merchant_id: 'mer-001', member_code: 'SAL001', public_token: 'tok-sal001', physical_card_number: '4821 6739 0012 3847', name: 'Arjun Sharma', phone: '+91 98450 12345', date_of_birth: '1990-07-15', anniversary_date: '2018-02-14', membership_type_id: 'mtype-001', joined_date: '2024-01-20', expiry_date: '2026-12-12', loyalty_points: 350, status: 'active', created_at: '2024-01-20T10:00:00Z' },
  { id: 'mem-ins-1', merchant_id: 'mer-ins', member_code: 'INS001', public_token: 'tok-ins001', physical_card_number: '4000 1000 0001 0001', name: 'Rajesh Sharma', phone: '+91 98111 22334', date_of_birth: '1982-08-25', membership_type_id: 'mtype-ins-1', joined_date: '2024-01-15', expiry_date: '2026-08-15', loyalty_points: 1450, status: 'active', created_at: '2024-01-15T10:00:00Z' },
  { id: 'mem-re-1', merchant_id: 'mer-re', member_code: 'RE001', public_token: 'tok-re001', physical_card_number: '4000 1000 0002 0001', name: 'Ananya Deshmukh', phone: '+91 98222 33445', date_of_birth: '1987-11-12', membership_type_id: 'mtype-re-1', joined_date: '2024-02-01', expiry_date: '2027-02-01', loyalty_points: 5000, status: 'active', created_at: '2024-02-01T10:00:00Z' },
  { id: 'mem-trv-1', merchant_id: 'mer-trv', member_code: 'TRV001', public_token: 'tok-trv001', physical_card_number: '4000 1000 0003 0001', name: 'Priya & Rohan Mehta', phone: '+91 98333 44556', date_of_birth: '1991-04-18', membership_type_id: 'mtype-trv-1', joined_date: '2024-01-25', expiry_date: '2026-01-25', loyalty_points: 4800, status: 'active', created_at: '2024-01-25T10:00:00Z' },
  { id: 'mem-ac-1', merchant_id: 'mer-ac', member_code: 'AC001', public_token: 'tok-ac001', physical_card_number: '4000 1000 0004 0001', name: 'Sunil Verma Jr', phone: '+91 98444 55667', date_of_birth: '1984-03-30', membership_type_id: 'mtype-ac-1', joined_date: '2024-02-10', expiry_date: '2027-02-10', loyalty_points: 1850, status: 'active', created_at: '2024-02-10T10:00:00Z' },
  { id: 'mem-sup-1', merchant_id: 'mer-sup', member_code: 'SUP001', public_token: 'tok-sup001', physical_card_number: '4000 1000 0005 0001', name: 'Sangeeta Patel', phone: '+91 98555 66778', date_of_birth: '1979-09-09', membership_type_id: 'mtype-sup-1', joined_date: '2024-02-15', expiry_date: '2026-02-15', loyalty_points: 680, status: 'active', created_at: '2024-02-15T10:00:00Z' },
  { id: 'mem-gym-1', merchant_id: 'mer-gym', member_code: 'GYM001', public_token: 'tok-gym001', physical_card_number: '4000 1000 0006 0001', name: 'Karan Malhotra', phone: '+91 98666 77889', date_of_birth: '1994-06-21', membership_type_id: 'mtype-gym-1', joined_date: '2024-02-20', expiry_date: '2026-02-20', loyalty_points: 850, status: 'active', created_at: '2024-02-20T10:00:00Z' },
  { id: 'mem-auto-1', merchant_id: 'mer-auto', member_code: 'AUT001', public_token: 'tok-aut001', physical_card_number: '4000 1000 0008 0001', name: 'Vikramaditya Rao', phone: '+91 98777 88990', date_of_birth: '1986-12-05', membership_type_id: 'mtype-auto-1', joined_date: '2024-03-01', expiry_date: '2027-03-01', loyalty_points: 2100, status: 'active', created_at: '2024-03-01T10:00:00Z' },
  { id: 'mem-caf-1', merchant_id: 'mer-caf', member_code: 'CAF001', public_token: 'tok-caf001', physical_card_number: '4000 1000 0009 0001', name: 'Anish Giri', phone: '+91 98888 99001', date_of_birth: '1997-01-14', membership_type_id: 'mtype-caf-1', joined_date: '2024-03-05', expiry_date: '2026-03-05', loyalty_points: 420, status: 'active', created_at: '2024-03-05T10:00:00Z' },
  { id: 'mem-jwl-1', merchant_id: 'mer-jwl', member_code: 'JWL001', public_token: 'tok-jwl001', physical_card_number: '4000 1000 0010 0001', name: 'Sunita Agrawal', phone: '+91 98999 00112', date_of_birth: '1975-10-20', membership_type_id: 'mtype-jwl-1', joined_date: '2024-03-10', expiry_date: '2027-03-10', loyalty_points: 14500, status: 'active', created_at: '2024-03-10T10:00:00Z' },
  { id: 'mem-grm-1', merchant_id: 'mer-grm', member_code: 'GRM001', public_token: 'tok-grm001', physical_card_number: '4000 1000 0011 0001', name: 'Manish Kapoor Jr', phone: '+91 98123 45678', date_of_birth: '1989-05-12', membership_type_id: 'mtype-grm-1', joined_date: '2024-03-12', expiry_date: '2026-03-12', loyalty_points: 920, status: 'active', created_at: '2024-03-12T10:00:00Z' },
  { id: 'mem-btq-1', merchant_id: 'mer-btq', member_code: 'BTQ001', public_token: 'tok-btq001', physical_card_number: '4000 1000 0012 0001', name: 'Anita Singhania', phone: '+91 98234 56789', date_of_birth: '1992-09-18', membership_type_id: 'mtype-btq-1', joined_date: '2024-03-15', expiry_date: '2027-03-15', loyalty_points: 3200, status: 'active', created_at: '2024-03-15T10:00:00Z' },
  { id: 'mem-opt-1', merchant_id: 'mer-opt', member_code: 'OPT001', public_token: 'tok-opt001', physical_card_number: '4000 1000 0013 0001', name: 'Dr. Alok Verma', phone: '+91 98345 67890', date_of_birth: '1980-11-04', membership_type_id: 'mtype-opt-1', joined_date: '2024-03-18', expiry_date: '2026-03-18', loyalty_points: 1150, status: 'active', created_at: '2024-03-18T10:00:00Z' },
  { id: 'mem-ftw-1', merchant_id: 'mer-ftw', member_code: 'FTW001', public_token: 'tok-ftw001', physical_card_number: '4000 1000 0014 0001', name: 'Deepak Chhabra', phone: '+91 98456 78901', date_of_birth: '1988-04-22', membership_type_id: 'mtype-ftw-1', joined_date: '2024-03-20', expiry_date: '2026-03-20', loyalty_points: 780, status: 'active', created_at: '2024-03-20T10:00:00Z' },
  { id: 'mem-dnt-1', merchant_id: 'mer-dnt', member_code: 'DNT001', public_token: 'tok-dnt001', physical_card_number: '4000 1000 0015 0001', name: 'Dr. Kavita Rao', phone: '+91 98567 89012', date_of_birth: '1985-12-10', membership_type_id: 'mtype-dnt-1', joined_date: '2024-03-22', expiry_date: '2026-03-22', loyalty_points: 1650, status: 'active', created_at: '2024-03-22T10:00:00Z' },
  { id: 'mem-mob-1', merchant_id: 'mer-mob', member_code: 'MOB001', public_token: 'tok-mob001', physical_card_number: '4000 1000 0016 0001', name: 'Sanjay Sharma', phone: '+91 98678 90123', date_of_birth: '1995-02-28', membership_type_id: 'mtype-mob-1', joined_date: '2024-03-25', expiry_date: '2026-03-25', loyalty_points: 1280, status: 'active', created_at: '2024-03-25T10:00:00Z' },
];

// ===== MEMBER OFFER STATES =====
export const memberOfferStates: MemberOfferState[] = [
  { id: 'mos-001', member_id: 'mem-001', offer_template_id: 'off-001', remaining_qty: 3, initial_qty: 6, status: 'active' },
  { id: 'mos-ins-1', member_id: 'mem-ins-1', offer_template_id: 'off-ins-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-re-1', member_id: 'mem-re-1', offer_template_id: 'off-re-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-trv-1', member_id: 'mem-trv-1', offer_template_id: 'off-trv-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-ac-1', member_id: 'mem-ac-1', offer_template_id: 'off-ac-1', remaining_qty: 2, initial_qty: 4, status: 'active' },
  { id: 'mos-sup-1', member_id: 'mem-sup-1', offer_template_id: 'off-sup-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-gym-1', member_id: 'mem-gym-1', offer_template_id: 'off-gym-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-auto-1', member_id: 'mem-auto-1', offer_template_id: 'off-auto-1', remaining_qty: 1, initial_qty: 4, status: 'active' },
  { id: 'mos-caf-1', member_id: 'mem-caf-1', offer_template_id: 'off-caf-1', remaining_qty: 4, initial_qty: 6, status: 'active' },
  { id: 'mos-jwl-1', member_id: 'mem-jwl-1', offer_template_id: 'off-jwl-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-grm-1', member_id: 'mem-grm-1', offer_template_id: 'off-grm-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-btq-1', member_id: 'mem-btq-1', offer_template_id: 'off-btq-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-opt-1', member_id: 'mem-opt-1', offer_template_id: 'off-opt-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-ftw-1', member_id: 'mem-ftw-1', offer_template_id: 'off-ftw-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-dnt-1', member_id: 'mem-dnt-1', offer_template_id: 'off-dnt-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
  { id: 'mos-mob-1', member_id: 'mem-mob-1', offer_template_id: 'off-mob-1', remaining_qty: 1, initial_qty: 1, status: 'active' },
];

// ===== REDEMPTIONS =====
export const redemptions: Redemption[] = [
  { id: 'red-001', member_id: 'mem-001', offer_template_id: 'off-001', merchant_user_id: 'usr-002', staff_name: 'Priya', amount: 0, created_at: '2024-10-14T11:30:00Z', member: { name: 'Arjun Sharma', member_code: 'SAL001' }, offer: { title: 'Free Hair Wash', offer_type: 'free_service' } },
  { id: 'red-ins-1', member_id: 'mem-ins-1', offer_template_id: 'off-ins-2', merchant_user_id: 'usr-ins', staff_name: 'Suresh', amount: 0, created_at: '2024-11-01T10:00:00Z', member: { name: 'Rajesh Sharma', member_code: 'INS001' }, offer: { title: 'Health Checkup Voucher', offer_type: 'free_service' } },
  { id: 'red-re-1', member_id: 'mem-re-1', offer_template_id: 'off-re-2', merchant_user_id: 'usr-re', staff_name: 'Vikram', amount: 0, created_at: '2024-11-05T14:20:00Z', member: { name: 'Ananya Deshmukh', member_code: 'RE001' }, offer: { title: 'Home Snagging Inspection', offer_type: 'free_service' } },
  { id: 'red-trv-1', member_id: 'mem-trv-1', offer_template_id: 'off-trv-1', merchant_user_id: 'usr-trv', staff_name: 'Rohan', amount: 0, created_at: '2024-11-10T09:15:00Z', member: { name: 'Priya Mehta', member_code: 'TRV001' }, offer: { title: 'Holiday Package Off', offer_type: 'percent_off' } },
  { id: 'red-dnt-1', member_id: 'mem-dnt-1', offer_template_id: 'off-dnt-1', merchant_user_id: 'usr-dnt', staff_name: 'Dr. Kavita', amount: 0, created_at: '2024-11-15T11:00:00Z', member: { name: 'Dr. Kavita Rao', member_code: 'DNT001' }, offer: { title: 'Teeth Scaling & Polishing', offer_type: 'free_service' } },
];

// ===== REMINDER RULES =====
export const reminderRules: ReminderRule[] = [
  { id: 'rr-001', merchant_id: 'mer-001', trigger_type: 'birthday', channel: 'whatsapp', template_text: 'Happy Birthday {name}! 🎂 Enjoy your complimentary facial at Glamour Salon this month.', active: true, send_time: '09:00:00', days_before: 0, timezone: 'Asia/Kolkata' },
  { id: 'rr-ins-1', merchant_id: 'mer-ins', trigger_type: 'expiry', channel: 'whatsapp', template_text: 'Hi {name}, your insurance policy expires in 30 days. Renew early to claim 500 bonus Safety Points!', active: true, send_time: '09:00:00', days_before: 30, timezone: 'Asia/Kolkata' },
];

// ===== CAMPAIGNS =====
export const campaigns: Campaign[] = [
  { id: 'camp-001', merchant_id: 'mer-001', name: 'Diwali Festive Glamour', target_audience: 'all', channel: 'whatsapp', template_text: '✨ Diwali Special! Get 20% off all spa & styling packages.', scheduled_at: '2024-10-28T09:00:00Z', status: 'sent', audience_size: 284, sent_count: 279, created_at: '2024-10-25T10:00:00Z' },
  { id: 'camp-caf-1', merchant_id: 'mer-caf', name: 'Weekend Brew Festival', target_audience: 'all', channel: 'whatsapp', template_text: '☕ Enjoy 2x Points on gourmet coffees this Saturday!', scheduled_at: '2024-11-02T09:00:00Z', status: 'sent', audience_size: 890, sent_count: 875, created_at: '2024-10-30T10:00:00Z' },
  { id: 'camp-opt-1', merchant_id: 'mer-opt', name: 'Clear Vision Checkup Drive', target_audience: 'all', channel: 'whatsapp', template_text: '👓 Book your complimentary computerized eye exam this week.', scheduled_at: '2024-11-10T09:00:00Z', status: 'sent', audience_size: 310, sent_count: 305, created_at: '2024-11-08T10:00:00Z' },
];

// ===== DASHBOARD STATS =====
export const dashboardStats: DashboardStats = {
  total_active_members: 1284,
  redemptions_today: 42,
  expiring_this_month: 18,
  expiring_this_week: 18,
  wallet_points_issued_month: 24500,
  recent_redemptions: redemptions,
};

// ===== ADMIN STATS =====
export const adminStats: AdminDashboardStats = {
  total_merchants: 16,
  total_members: 6420,
  redemptions_today: 215,
  active_merchants: 16,
  inactive_merchants: 0,
  pending_approvals: 0,
  recent_merchant_activity: [
    { merchant_id: 'mer-ins', business_name: 'Metro Insurance Agency', action: 'Early Renewal Campaign executed', at: new Date().toISOString() },
    { merchant_id: 'mer-re', business_name: 'Metro Realty & Advisory', action: 'Referral reward paid (₹25,000)', at: new Date(Date.now() - 3600000).toISOString() },
    { merchant_id: 'mer-dnt', business_name: 'Apex Dental Studio', action: 'Smile VIP Scalings issued', at: new Date(Date.now() - 5400000).toISOString() },
    { merchant_id: 'mer-001', business_name: 'Glamour Salon & Spa', action: '42 redemptions today', at: new Date(Date.now() - 7200000).toISOString() },
  ],
};

// ===== PUBLIC TOKEN LOOKUP =====
export const publicMemberViews: Record<string, PublicMemberView> = {
  'tok-sal001': {
    member_id: 'mem-001',
    merchant_name: 'Glamour Salon & Spa',
    merchant_phone: '+91 98765 43210',
    member_name: 'Arjun Sharma',
    member_code: 'SAL001',
    membership_type_name: 'Prime',
    status: 'active',
    expiry_date: '2026-12-12',
    loyalty_points: 350,
    total_visits: 14,
    offers: [
      { id: 'off-001', title: 'Free Hair Wash', description: 'Valid on styling above ₹800.', offer_type: 'free_service', value: 1 },
      { id: 'off-002', title: '10% Off All Services', description: 'Flat 10% on total billing.', offer_type: 'percent_off', value: 10 },
    ],
  },
  'tok-ins001': {
    member_id: 'mem-ins-1',
    merchant_name: 'Metro Insurance Agency',
    merchant_phone: '+91 98765 00001',
    member_name: 'Rajesh Sharma',
    member_code: 'INS001',
    membership_type_name: 'Shield Elite',
    status: 'active',
    expiry_date: '2026-08-15',
    loyalty_points: 1450,
    total_visits: 7,
    offers: [
      { id: 'off-ins-1', title: 'Early Renewal Cashback Pass', description: 'Earn 500 Safety Points if renewed early.', offer_type: 'wallet_points', value: 500 },
      { id: 'off-ins-2', title: 'Free Health Checkup Voucher', description: 'Full diagnostic checkup at Apollo.', offer_type: 'free_service', value: 1 },
    ],
  },
  'tok-caf001': {
    member_id: 'mem-caf-1',
    merchant_name: 'Metro Roasters & Fine Dining',
    merchant_phone: '+91 98765 00009',
    member_name: 'Anish Giri',
    member_code: 'CAF001',
    membership_type_name: 'Brew Master Club',
    status: 'active',
    expiry_date: '2026-03-05',
    loyalty_points: 420,
    total_visits: 22,
    offers: [
      { id: 'off-caf-1', title: 'Coffee Punch Card (Buy 5 Get 1 Free)', description: 'Digital stamp card.', offer_type: 'free_service', value: 1 },
    ],
  },
  'tok-dnt001': {
    member_id: 'mem-dnt-1',
    merchant_name: 'Apex Dental Studio & Smile Clinic',
    merchant_phone: '+91 98765 00015',
    member_name: 'Dr. Kavita Rao',
    member_code: 'DNT001',
    membership_type_name: 'Smile Care VIP',
    status: 'active',
    expiry_date: '2026-03-22',
    loyalty_points: 1650,
    total_visits: 5,
    offers: [
      { id: 'off-dnt-1', title: 'Complimentary Ultrasonic Scaling & Polishing', description: 'Full teeth cleaning voucher.', offer_type: 'free_service', value: 1 },
    ],
  },
};

// ===== LOYALTY TRANSACTIONS =====
export const loyaltyTransactions: LoyaltyTransaction[] = [
  { id: 'ltx-001', member_id: 'mem-001', merchant_id: 'mer-001', type: 'earn', points: 350, source_redemption_id: 'red-001', source_offer_id: 'off-001', source_offer_title: 'Hair Wash Service Loyalty Bonus', balance_after: 350, created_at: '2024-10-14T11:30:00Z' },
  { id: 'ltx-ins-1', member_id: 'mem-ins-1', merchant_id: 'mer-ins', type: 'earn', points: 1450, source_offer_id: 'off-ins-1', source_offer_title: 'Early Renewal Safety Points', balance_after: 1450, created_at: '2024-11-01T10:00:00Z' },
  { id: 'ltx-re-1', member_id: 'mem-re-1', merchant_id: 'mer-re', type: 'earn', points: 5000, source_offer_id: 'off-re-1', source_offer_title: 'Property Referral Credit', balance_after: 5000, created_at: '2024-11-05T14:20:00Z' },
  { id: 'ltx-trv-1', member_id: 'mem-trv-1', merchant_id: 'mer-trv', type: 'earn', points: 4800, source_offer_id: 'off-trv-1', source_offer_title: 'Globetrotter Travel Miles', balance_after: 4800, created_at: '2024-11-10T09:15:00Z' },
  { id: 'ltx-jwl-1', member_id: 'mem-jwl-1', merchant_id: 'mer-jwl', type: 'earn', points: 14500, source_offer_id: 'off-jwl-1', source_offer_title: 'Gold Elite Savings Perk', balance_after: 14500, created_at: '2024-11-12T16:00:00Z' },
  { id: 'ltx-dnt-1', member_id: 'mem-dnt-1', merchant_id: 'mer-dnt', type: 'earn', points: 1650, source_offer_id: 'off-dnt-1', source_offer_title: 'Dental Preventive Care Bonus', balance_after: 1650, created_at: '2024-11-15T11:00:00Z' },
  { id: 'ltx-grm-1', member_id: 'mem-grm-1', merchant_id: 'mer-grm', type: 'earn', points: 920, source_offer_id: 'off-grm-1', source_offer_title: 'Wardrobe Shopping Points', balance_after: 920, created_at: '2024-11-16T14:00:00Z' },
];

// ===== PHYSICAL CARD INVENTORY =====
export const cardInventory: CardInventoryItem[] = [
  { id: 'card-001', card_number: '1234 5678 9012 3456', status: 'unassigned', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-ins-01', card_number: '4000 1000 0001 0001', status: 'member_linked', allocated_merchant_id: 'mer-ins', allocated_merchant_name: 'Metro Insurance Agency', linked_member_id: 'mem-ins-1', linked_member_name: 'Rajesh Sharma', linked_member_phone: '+91 98111 22334', linked_at: '2024-01-15T10:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-re-01', card_number: '4000 1000 0002 0001', status: 'member_linked', allocated_merchant_id: 'mer-re', allocated_merchant_name: 'Metro Realty & Advisory', linked_member_id: 'mem-re-1', linked_member_name: 'Ananya Deshmukh', linked_member_phone: '+91 98222 33445', linked_at: '2024-02-01T10:00:00Z', created_at: '2024-01-01T00:00:00Z' },
  { id: 'card-dnt-01', card_number: '4000 1000 0015 0001', status: 'member_linked', allocated_merchant_id: 'mer-dnt', allocated_merchant_name: 'Apex Dental Studio', linked_member_id: 'mem-dnt-1', linked_member_name: 'Dr. Kavita Rao', linked_member_phone: '+91 98567 89012', linked_at: '2024-03-22T10:00:00Z', created_at: '2024-01-01T00:00:00Z' },
];
