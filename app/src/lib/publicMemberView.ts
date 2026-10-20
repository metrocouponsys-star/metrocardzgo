import { prisma } from '@/lib/prisma';
import {
  members as mockMembers,
  merchants as mockMerchants,
  membershipTypes as mockMembershipTypes,
  offerTemplates as mockOfferTemplates,
  memberOfferStates as mockMemberOfferStates,
  loyaltyTransactions as mockLoyaltyTxns,
  redemptions as mockRedemptions,
} from '@/api/mockData';
import type { PublicMemberView, MemberStatus } from '@/types';

// Default demo coupons for mock fallback
const mockDefaultCoupons = [
  { id: 'coup-001', code: 'METRO20', discount_type: 'percent' as const, value: 20, min_purchase: 500, active_days: 'All Days', expires_at: '2026-12-31' },
  { id: 'coup-002', code: 'SAVE100', discount_type: 'flat' as const, value: 100, min_purchase: 1000, active_days: 'Sat, Sun', expires_at: '2026-12-31' },
];

// Default demo rewards for mock fallback
const mockDefaultRewards = [
  { id: 'rew-001', name: 'Free Welcome Gift / Service', description: 'Redeem loyalty points for free signature item.', points_cost: 250, quantity_available: 50 },
  { id: 'rew-002', name: '₹200 Privilege Store Voucher', description: 'Instant voucher applicable on next invoice.', points_cost: 500, quantity_available: 30 },
];

/**
 * Builds a complete, production-ready PublicMemberView from Prisma DB.
 * Queries member profile, merchant details, membership type, active offer states,
 * store coupons, reward catalog, redemption log, and loyalty audit history.
 */
export async function buildPublicMemberViewFromDb(memberId: string): Promise<PublicMemberView & { id: string; name: string; phone?: string; points_balance: number; tier_name: string; card_design_url?: string | null } | null> {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      merchant: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
          whatsappNumber: true,
          cardDesignUrl: true,
          address: true,
        },
      },
      membershipType: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      offerStates: {
        include: {
          offerTemplate: true,
        },
      },
      redemptions: {
        include: {
          offerTemplate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      loyaltyTxns: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      linkedCards: true,
    },
  });

  if (!member) return null;

  // 1. Fetch store coupons
  let couponsOut: Array<{
    id: string;
    code: string;
    discount_type: 'flat' | 'percent';
    value: number;
    min_purchase: number;
    active_days?: string;
    expires_at?: string | null;
  }> = [];

  try {
    const coupons = await prisma.couponCode.findMany({
      where: {
        merchantId: member.merchantId,
        isActive: true,
      },
    });

    const now = new Date();
    couponsOut = coupons
      .filter((c) => !c.expiresAt || new Date(c.expiresAt) >= now)
      .map((c) => ({
        id: c.id,
        code: c.code,
        discount_type: (c.discountType === 'percent' ? 'percent' : 'flat') as 'flat' | 'percent',
        value: Number(c.value || 0),
        min_purchase: Number(c.minPurchase || 0),
        active_days: c.activeDays || undefined,
        expires_at: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : null,
      }));
  } catch (err) {
    console.warn('[publicMemberView] Error fetching coupons:', (err as Error).message);
  }

  // 2. Fetch reward catalog
  let rewardsOut: Array<{
    id: string;
    name: string;
    description: string;
    points_cost: number;
    quantity_available?: number | null;
  }> = [];

  try {
    const rewards = await prisma.rewardCatalog.findMany({
      where: {
        merchantId: member.merchantId,
        isActive: true,
      },
    });

    rewardsOut = rewards
      .filter((r) => r.quantityAvailable === null || r.quantityAvailable === undefined || r.quantityAvailable > 0)
      .map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        points_cost: Number(r.pointsCost || 0),
        quantity_available: r.quantityAvailable ?? null,
      }));
  } catch (err) {
    console.warn('[publicMemberView] Error fetching rewards:', (err as Error).message);
  }

  // 3. Assemble active and redeemed offers
  let offersOut: any[] = [];
  const relevantStates = (member.offerStates || []).filter(
    (s) => (s.status === 'active' || s.status === 'exhausted') && s.offerTemplate?.active !== false
  );

  if (relevantStates.length > 0) {
    offersOut = relevantStates.map((s) => {
      const rem = s.remainingQty !== null && s.remainingQty !== undefined ? Number(s.remainingQty) : null;
      let init = s.initialQty !== null && s.initialQty !== undefined ? Number(s.initialQty) : null;
      if (init === null && rem !== null) {
        init = Math.max(rem, 1);
      }
      return {
        id: s.id,
        title: s.offerTemplate.title,
        description: s.offerTemplate.description || '',
        offer_type: s.offerTemplate.offerType,
        value: Number(s.offerTemplate.value || 0),
        remaining_qty: rem,
        initial_qty: init,
        is_points_redemption: !!s.offerTemplate.isPointsRedemption,
        points_cost: Number(s.offerTemplate.loyaltyPointsCost || 0),
        loyalty_points_earn: s.offerTemplate.loyaltyPointsEarn ? Number(s.offerTemplate.loyaltyPointsEarn) : undefined,
        image_url: (s.offerTemplate as any).imageUrl || (s.offerTemplate as any).image_url || null,
      };
    });
  } else {
    // Fallback: If member has no specific states initialized yet, fetch active merchant offer templates
    try {
      const activeTemplates = await prisma.offerTemplate.findMany({
        where: {
          merchantId: member.merchantId,
          active: true,
        },
      });

      offersOut = activeTemplates.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        offer_type: t.offerType,
        value: Number(t.value || 0),
        remaining_qty: t.offerType === 'percent_off' ? null : 5,
        initial_qty: t.offerType === 'percent_off' ? null : 5,
        is_points_redemption: !!t.isPointsRedemption,
        points_cost: Number(t.loyaltyPointsCost || 0),
        loyalty_points_earn: t.loyaltyPointsEarn ? Number(t.loyaltyPointsEarn) : undefined,
        image_url: (t as any).imageUrl || (t as any).image_url || null,
      }));
    } catch (err) {
      console.warn('[publicMemberView] Error fetching fallback templates:', (err as Error).message);
    }
  }

  // 4. Redemptions
  const redemptionsOut = (member.redemptions || []).map((r) => ({
    id: r.id,
    offer_title: r.offerTemplate?.title || 'Offer Redeemed',
    redeemed_at: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    amount_spent: r.amount ? Number(r.amount) : undefined,
  }));

  // 5. Loyalty History
  const historyOut = (member.loyaltyTxns || []).map((t) => ({
    id: t.id,
    transaction_type: t.type,
    points: Number(t.points),
    description: t.note || `${t.type === 'earn' ? 'Earned' : 'Redeemed'} points`,
    created_at: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
  }));

  // 6. Other memberships for multi-store switcher
  let otherMemberships: any[] = [];
  try {
    const digits = (member.phone || '').replace(/\D/g, '');
    if (digits.length >= 10) {
      const otherMembers = await prisma.member.findMany({
        where: {
          phone: { contains: digits.slice(-10) },
          id: { not: member.id },
          status: { not: 'deactivated' },
        },
        include: {
          merchant: { select: { id: true, businessName: true, logoUrl: true, cardDesignUrl: true } },
          membershipType: { select: { name: true } },
          linkedCards: true,
        },
      });

      otherMemberships = otherMembers.map((o) => ({
        member_id: o.id,
        merchant_id: o.merchantId,
        merchant_name: o.merchant?.businessName || 'Metro Cardz Partner',
        merchant_logo: o.merchant?.logoUrl || undefined,
        card_design_url: o.merchant?.cardDesignUrl || null,
        member_code: o.memberCode,
        physical_card_number: o.physicalCardNumber || o.linkedCards?.[0]?.cardNumber || undefined,
        loyalty_points: Number(o.loyaltyPoints || 0),
        membership_type_name: o.membershipType?.name || 'Standard',
        status: o.status,
      }));
    }
  } catch (err) {
    console.warn('[publicMemberView] Error finding other memberships:', (err as Error).message);
  }

  const pts = Number(member.loyaltyPoints ?? 0);
  const tierName = member.membershipType?.name || 'Gold Member';
  const merchName = member.merchant?.businessName || 'Metro Cardz Partner';
  const resolvedCardNumber = member.physicalCardNumber || (member as any).linkedCards?.[0]?.cardNumber || undefined;

  return {
    member_id: member.id,
    merchant_id: member.merchantId,
    id: member.id,
    member_name: member.name,
    name: member.name,
    member_code: member.memberCode,
    phone: member.phone,
    status: member.status as MemberStatus,
    expiry_date: member.expiryDate ? new Date(member.expiryDate).toISOString() : '',
    loyalty_points: pts,
    points_balance: pts,
    total_visits: member.totalVisits ?? 0,
    membership_type_name: tierName,
    tier_name: tierName,
    merchant_name: merchName,
    merchant_logo: member.merchant?.logoUrl || undefined,
    merchant_phone: member.merchant?.whatsappNumber || undefined,
    card_design_url: member.merchant?.cardDesignUrl || null,
    referral_code: member.referralCode || undefined,
    physical_card_number: resolvedCardNumber,
    offers: offersOut,
    coupons: couponsOut,
    rewards: rewardsOut,
    redemptions: redemptionsOut,
    loyalty_history: historyOut,
    other_memberships: otherMemberships,
    open_lucky_draws: [],
  };
}

/**
 * Builds a fallback PublicMemberView for mock / demo members.
 */
export function buildPublicMemberViewFromMock(candidate: any): PublicMemberView & { id: string; name: string; phone?: string; points_balance: number; tier_name: string; card_design_url?: string | null } {
  const merch = mockMerchants.find((x) => x.id === candidate.merchant_id);
  const mtype = mockMembershipTypes.find((x) => x.id === candidate.membership_type_id);

  // Offers
  let templates = mockOfferTemplates.filter((o) => o.merchant_id === candidate.merchant_id && o.active);
  if (templates.length === 0) {
    templates = mockOfferTemplates.filter((o) => o.active);
  }
  const existingStates = mockMemberOfferStates.filter((s) => s.member_id === candidate.id);
  const offers = templates.map((tmpl) => {
    const state = existingStates.find((s) => s.offer_template_id === tmpl.id);
    const isPercent = tmpl.offer_type === 'percent_off';
    const rem = isPercent ? null : (state?.remaining_qty !== undefined && state?.remaining_qty !== null ? state.remaining_qty : 4);
    const init = isPercent ? null : (state?.initial_qty !== undefined && state?.initial_qty !== null ? state.initial_qty : (rem !== null ? Math.max(rem, 10) : 10));
    return {
      id: state?.id || `mos-auto-${candidate.id}-${tmpl.id}`,
      title: tmpl.title,
      description: tmpl.description || '',
      offer_type: tmpl.offer_type,
      value: Number(tmpl.value || 0),
      remaining_qty: rem,
      initial_qty: init,
      is_points_redemption: !!tmpl.is_points_redemption,
      points_cost: tmpl.loyalty_points_cost || 0,
      loyalty_points_earn: tmpl.loyalty_points_earn || undefined,
    };
  });

  // Redemptions
  const reds = (mockRedemptions || [])
    .filter((r) => r.member_id === candidate.id)
    .map((r) => ({
      id: r.id,
      offer_title: r.offer?.title || 'Offer Redeemed',
      redeemed_at: r.created_at,
      amount_spent: r.amount || undefined,
    }));

  // Loyalty History
  const history = (mockLoyaltyTxns || [])
    .filter((t) => t.member_id === candidate.id)
    .map((t) => ({
      id: t.id,
      transaction_type: t.type,
      points: Number(t.points),
      description: t.source_offer_title || t.note || 'Points update',
      created_at: t.created_at,
    }));

  const pts = candidate.loyalty_points ?? 350;
  const tierName = mtype?.name || 'Gold Member';
  const merchName = merch?.business_name || 'Metro Cardz GO Partner';

  return {
    member_id: candidate.id,
    merchant_id: candidate.merchant_id,
    id: candidate.id,
    member_name: candidate.name,
    name: candidate.name,
    member_code: candidate.member_code,
    phone: candidate.phone,
    status: candidate.status || 'active',
    expiry_date: candidate.expiry_date || '2026-12-31',
    loyalty_points: pts,
    points_balance: pts,
    total_visits: candidate.total_visits || 12,
    membership_type_name: tierName,
    tier_name: tierName,
    merchant_name: merchName,
    merchant_logo: merch?.logo_url || undefined,
    merchant_phone: merch?.whatsapp_number || undefined,
    card_design_url: merch?.card_design_url || null,
    referral_code: candidate.referral_code || undefined,
    physical_card_number: candidate.physical_card_number || undefined,
    offers,
    coupons: mockDefaultCoupons,
    rewards: mockDefaultRewards,
    redemptions: reds,
    loyalty_history: history,
    other_memberships: [],
    open_lucky_draws: [],
  };
}
