/**
 * Metro Cardz GO — Customer Data, Deals Catalog & State Management
 * 
 * Provides per-customer isolated persistence for:
 * 1. Authentication state (verified member & right person verification)
 * 2. Claimed offers with timestamp, voucher codes, and savings
 * 3. Remaining offers available in the catalog
 * 4. Loyalty points balance & earned rewards
 * 5. Money saved ledger & total savings record
 *
 * Multi-customer safe: Every customer's data is isolated by their verified
 * phone number or member code, preventing any customer data overlap.
 */

export interface GoDeal {
  id: string;
  brand: string;
  area: string;
  offer: string;
  meta: string;
  badge: string;
  category: string;
  image: string;
  price: string;
  savingsAmount: number; // in ₹
  pointsReward: number;  // points earned on claim
  terms: string;
}

export interface GoClaimedOffer {
  claimId: string;
  dealId: string;
  brand: string;
  offer: string;
  voucherCode: string;
  claimedAt: string;
  savingsAmount: number;
  pointsEarned: number;
  area: string;
  category: string;
  image: string;
  status: 'active' | 'redeemed';
}

export interface GoSavingsRecord {
  id: string;
  brand: string;
  offer: string;
  savingsAmount: number;
  pointsEarned: number;
  voucherCode: string;
  date: string;
}

export interface GoCustomerProfile {
  id: string;
  name: string;
  phone: string;
  memberCode: string;
  tier: string;
  status: string;
  points: number;
  totalSavedMoney: number;
  claimedOffers: GoClaimedOffer[];
  savingsHistory: GoSavingsRecord[];
  updatedAt: string;
}

export const GO_CATALOG_DEALS: GoDeal[] = [
  {
    id: 'imagicaa',
    brand: 'Imagicaa',
    area: 'Khopoli',
    offer: '40% OFF on combo tickets',
    meta: 'Theme + Water Park',
    badge: 'Hot Deal',
    category: 'Water Parks',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    price: 'From ₹699',
    savingsAmount: 450,
    pointsReward: 60,
    terms: 'Valid on weekdays & weekends. Show active Metro Cardz GO membership pass at the ticketing counter.',
  },
  {
    id: 'bastian',
    brand: 'Bastian',
    area: 'Mumbai',
    offer: 'Flat ₹500 off dining',
    meta: 'Premium dinner',
    badge: 'Flash Sale',
    category: 'Dining',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
    price: 'Saver ₹500',
    savingsAmount: 500,
    pointsReward: 80,
    terms: 'Minimum bill ₹2,500. Valid for dine-in reservations Monday through Thursday.',
  },
  {
    id: 'machan',
    brand: 'The Machan',
    area: 'Lonavala',
    offer: 'Sunset stay packages',
    meta: 'Weekend getaway',
    badge: 'Weekend',
    category: 'Resorts',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80',
    price: 'Save ₹1,200',
    savingsAmount: 1200,
    pointsReward: 150,
    terms: 'Applicable on canopy & forest machan bookings. Complimentary breakfast included.',
  },
  {
    id: 'cinepolis',
    brand: 'Cinepolis',
    area: 'Andheri',
    offer: 'Buy 1 get 1 movie nights',
    meta: 'Premium cinema',
    badge: 'New',
    category: 'Movies',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
    price: 'Save ₹350',
    savingsAmount: 350,
    pointsReward: 40,
    terms: 'Valid for standard 2D & 3D screenings on Tuesday and Wednesday.',
  },
  {
    id: 'cafewave',
    brand: 'Café Wave',
    area: 'Powai',
    offer: 'Free dessert with brunch',
    meta: 'Coffee + bites',
    badge: 'Popular',
    category: 'Food & Café',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80',
    price: 'Complimentary',
    savingsAmount: 280,
    pointsReward: 35,
    terms: 'Valid with any 2-course meal order. One dessert per table per bill.',
  },
  {
    id: 'muse',
    brand: 'Muse Spa',
    area: 'Bandra',
    offer: '30% OFF wellness rituals',
    meta: 'Relax & recharge',
    badge: 'Wellness',
    category: 'Wellness',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1000&q=80',
    price: 'Save ₹650',
    savingsAmount: 650,
    pointsReward: 90,
    terms: 'Prior booking required 24 hours in advance. Valid on all 60m+ therapies.',
  },
  {
    id: 'smaaash',
    brand: 'Smaaash Gaming',
    area: 'Lower Parel',
    offer: '25% OFF Bowling & VR combos',
    meta: 'Weekend fun',
    badge: 'Action',
    category: 'Gaming',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1000&q=80',
    price: 'Save ₹400',
    savingsAmount: 400,
    pointsReward: 50,
    terms: 'Valid all days from 12pm to 8pm. Arcade card required.',
  },
  {
    id: 'bluetokai',
    brand: 'Blue Tokai Roasters',
    area: 'Kala Ghoda',
    offer: 'Flat ₹150 off artisan brews',
    meta: 'Specialty coffee',
    badge: 'Staff Pick',
    category: 'Food & Café',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
    price: 'Save ₹150',
    savingsAmount: 150,
    pointsReward: 25,
    terms: 'Applicable on manual brew & coffee beans pack purchases over ₹600.',
  },
];

function normalizeCustomerKey(identifierOrPhone?: string | null): string {
  if (!identifierOrPhone) return 'guest';
  const clean = identifierOrPhone.replace(/\D/g, '');
  if (clean.length >= 10) return clean.slice(-10);
  return identifierOrPhone.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Loads isolated customer data for a specific customer identity.
 * Creates an initial customer record if this is the first visit for this customer.
 */
export function getCustomerData(idOrPhone: string, initialMeta?: Partial<GoCustomerProfile>): GoCustomerProfile {
  if (typeof window === 'undefined') {
    return {
      id: idOrPhone,
      name: initialMeta?.name || 'Member',
      phone: initialMeta?.phone || '',
      memberCode: initialMeta?.memberCode || 'MC-NEW',
      tier: initialMeta?.tier || 'Gold Member',
      status: 'active',
      points: initialMeta?.points || 1000,
      totalSavedMoney: 0,
      claimedOffers: [],
      savingsHistory: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const key = `mc_cust_data_${normalizeCustomerKey(idOrPhone)}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const parsed: GoCustomerProfile = JSON.parse(stored);
      // Merge any newly passed info (like updated name or initial points)
      if (initialMeta?.name && initialMeta.name !== 'Member' && parsed.name === 'Member') {
        parsed.name = initialMeta.name;
      }
      if (initialMeta?.memberCode && !parsed.memberCode) {
        parsed.memberCode = initialMeta.memberCode;
      }
      return parsed;
    } catch {}
  }

  // Create clean isolated profile for this customer
  const newProfile: GoCustomerProfile = {
    id: initialMeta?.id || `cust_${Date.now()}`,
    name: initialMeta?.name || 'Verified Member',
    phone: initialMeta?.phone || idOrPhone,
    memberCode: initialMeta?.memberCode || (idOrPhone.startsWith('MC') ? idOrPhone : `MC-${idOrPhone.slice(-4)}`),
    tier: initialMeta?.tier || 'Gold Tier',
    status: 'active',
    points: initialMeta?.points !== undefined ? initialMeta.points : 1200,
    totalSavedMoney: 0,
    claimedOffers: [],
    savingsHistory: [],
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(key, JSON.stringify(newProfile));
  return newProfile;
}

/**
 * Saves customer data to their isolated storage key.
 */
export function saveCustomerData(customer: GoCustomerProfile): void {
  if (typeof window === 'undefined') return;
  const key = `mc_cust_data_${normalizeCustomerKey(customer.phone || customer.memberCode || customer.id)}`;
  customer.updatedAt = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(customer));

  // Also update active session reference
  localStorage.setItem(
    'mc_go_active_session',
    JSON.stringify({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      memberCode: customer.memberCode,
      tier: customer.tier,
      points: customer.points,
      totalSavedMoney: customer.totalSavedMoney,
      claimedCount: customer.claimedOffers.length,
    })
  );
}

/**
 * Returns the currently active logged-in customer, or null if unauthenticated.
 */
export function getActiveCustomer(): GoCustomerProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawSession = localStorage.getItem('mc_go_active_session');
    const legacyMember = localStorage.getItem('mc_member') || localStorage.getItem('mc_go_member');

    let identifier = '';
    let fallbackMeta: Partial<GoCustomerProfile> | undefined;

    if (rawSession) {
      const s = JSON.parse(rawSession);
      identifier = s.phone || s.memberCode || s.id;
      fallbackMeta = s;
    } else if (legacyMember) {
      const m = JSON.parse(legacyMember);
      identifier = m.phone || m.memberCode || m.id;
      fallbackMeta = {
        name: m.name,
        phone: m.phone,
        memberCode: m.memberCode,
        points: m.points,
        tier: m.tier,
      };
    }

    if (!identifier) return null;
    return getCustomerData(identifier, fallbackMeta);
  } catch {
    return null;
  }
}

/**
 * Logs out the active customer session without erasing their isolated history.
 */
export function logoutCustomer(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('mc_go_active_session');
  localStorage.removeItem('mc_member');
  localStorage.removeItem('mc_go_member');
}

/**
 * Claims an offer specifically for the given customer.
 * - Prevents duplicate claim of the same deal
 * - Generates customer-specific voucher code
 * - Increments customer points
 * - Increments total saved money
 * - Updates remaining offers count
 */
export function claimDealForCustomer(
  customer: GoCustomerProfile,
  deal: GoDeal
): { success: boolean; message: string; claim?: GoClaimedOffer; customer: GoCustomerProfile } {
  // Check if already claimed
  const existingClaim = customer.claimedOffers.find((c) => c.dealId === deal.id);
  if (existingClaim) {
    return {
      success: false,
      message: `You have already claimed this ${deal.brand} offer. Voucher code: ${existingClaim.voucherCode}`,
      claim: existingClaim,
      customer,
    };
  }

  // Generate unique voucher code
  const brandSlug = deal.brand.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const voucherCode = `GO-${brandSlug}-${randomSuffix}`;

  const newClaim: GoClaimedOffer = {
    claimId: `clm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    dealId: deal.id,
    brand: deal.brand,
    offer: deal.offer,
    voucherCode,
    claimedAt: new Date().toISOString(),
    savingsAmount: deal.savingsAmount,
    pointsEarned: deal.pointsReward,
    area: deal.area,
    category: deal.category,
    image: deal.image,
    status: 'active',
  };

  const savingsRecord: GoSavingsRecord = {
    id: `sav_${Date.now()}`,
    brand: deal.brand,
    offer: deal.offer,
    savingsAmount: deal.savingsAmount,
    pointsEarned: deal.pointsReward,
    voucherCode,
    date: new Date().toISOString(),
  };

  const updatedCustomer: GoCustomerProfile = {
    ...customer,
    points: customer.points + deal.pointsReward,
    totalSavedMoney: customer.totalSavedMoney + deal.savingsAmount,
    claimedOffers: [newClaim, ...customer.claimedOffers],
    savingsHistory: [savingsRecord, ...customer.savingsHistory],
  };

  saveCustomerData(updatedCustomer);

  return {
    success: true,
    message: `Offer claimed! You saved ₹${deal.savingsAmount} and earned +${deal.pointsReward} points.`,
    claim: newClaim,
    customer: updatedCustomer,
  };
}

/**
 * Calculates remaining offers for a customer against the total catalog.
 */
export function getRemainingOffersCount(customer: GoCustomerProfile | null): number {
  if (!customer) return GO_CATALOG_DEALS.length;
  const claimedIds = new Set(customer.claimedOffers.map((c) => c.dealId));
  const remaining = GO_CATALOG_DEALS.filter((d) => !claimedIds.has(d.id));
  return remaining.length;
}
