// ============================================================
// Metro Cardz — Mock API Client
// Used when NEXT_PUBLIC_USE_MOCK_DATA=true (local development)
// The real API client lives in realClient.ts
// The router that picks between them is in index.ts
// ============================================================

import type {
  Member, MembershipType, OfferTemplate, MemberOfferState,
  Redemption, ReminderRule, Campaign, DashboardStats,
  AdminDashboardStats, AuthUser, PublicMemberView, Merchant,
  MerchantUser, ReportData, CardInventoryItem, LoyaltyTransaction,
} from '../types';

import * as db from './mockData';

const FAKE_DELAY = 350; // ms — realistic network latency

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ---- Auth ----
export async function login(phone: string, _password: string): Promise<{ user: AuthUser; token: string }> {
  await delay(FAKE_DELAY);
  const user = db.merchantUsers.find(u => u.phone.replace(/\s/g, '').includes(phone.replace(/\s/g, '')));
  if (!user) throw new Error('Invalid credentials');
  const merchant = db.merchants.find(m => m.id === user.merchant_id);
  return {
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      merchant_id: user.merchant_id,
      merchant_name: merchant?.business_name,
    },
    token: `mock-jwt-${user.id}`,
  };
}

export async function verifyOtp(_phone: string, otp: string): Promise<{ user: AuthUser; token: string }> {
  await delay(FAKE_DELAY);
  if (otp === '000000') throw new Error('Invalid OTP');
  // For demo: phone +91 90000 00000 = super admin, anything else = owner of mer-001
  const isSuperAdmin = _phone.replace(/\s/g, '').includes('9000000000');
  const user = isSuperAdmin ? db.merchantUsers[4] : db.merchantUsers[0];
  const merchant = db.merchants.find(m => m.id === user.merchant_id);
  return {
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role, merchant_id: user.merchant_id, merchant_name: merchant?.business_name },
    token: `mock-jwt-${user.id}`,
  };
}

// ---- Dashboard ----
export async function getDashboardStats(_merchantId: string): Promise<DashboardStats> {
  await delay(FAKE_DELAY);
  return db.dashboardStats;
}

// ---- Members ----
export async function searchMembers(merchantId: string, query: string): Promise<Member[]> {
  await delay(FAKE_DELAY);
  const q = query.toLowerCase().replace(/\s/g, '');
  return db.members.filter(m =>
    m.merchant_id === merchantId &&
    (m.name.toLowerCase().includes(q) ||
      m.phone.replace(/\s/g, '').includes(q) ||
      m.member_code.toLowerCase().includes(q) ||
      m.public_token.includes(q))
  ).map(m => ({
    ...m,
    membership_type: db.membershipTypes.find(mt => mt.id === m.membership_type_id),
  }));
}

export async function getMemberByToken(token: string): Promise<Member | null> {
  await delay(FAKE_DELAY);
  const m = db.members.find(mem => mem.public_token === token);
  if (!m) return null;
  return { ...m, membership_type: db.membershipTypes.find(mt => mt.id === m.membership_type_id) };
}

export async function getMember(merchantId: string, memberId: string): Promise<Member & { offer_states: MemberOfferState[] }> {
  await delay(FAKE_DELAY);
  const m = db.members.find(mem => mem.id === memberId && mem.merchant_id === merchantId);
  if (!m) throw new Error('Member not found');
  const offer_states = db.memberOfferStates.filter(s => s.member_id === memberId).map(s => ({
    ...s,
    offer: db.offerTemplates.find(o => o.id === s.offer_template_id),
  }));
  return {
    ...m,
    membership_type: db.membershipTypes.find(mt => mt.id === m.membership_type_id),
    offer_states,
  };
}

export async function createMember(merchantId: string, data: Partial<Member>): Promise<Member> {
  await delay(FAKE_DELAY);
  const existing = db.members.find(m => m.merchant_id === merchantId && m.phone.replace(/\s/g, '') === (data.phone || '').replace(/\s/g, ''));
  if (existing) throw new Error('DUPLICATE_PHONE');
  const newMember: Member = {
    id: `mem-${Date.now()}`,
    merchant_id: merchantId,
    member_code: `SAL${String(db.members.filter(m => m.merchant_id === merchantId).length + 1).padStart(3, '0')}`,
    public_token: `tok-${Math.random().toString(36).substr(2, 12)}`,
    name: data.name!,
    phone: data.phone!,
    date_of_birth: data.date_of_birth,
    anniversary_date: data.anniversary_date,
    membership_type_id: data.membership_type_id!,
    joined_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    loyalty_points: 0,
    status: 'active',
    created_at: new Date().toISOString(),
  };
  db.members.push(newMember);
  return newMember;
}

export async function updateMember(merchantId: string, memberId: string, data: Partial<Member>): Promise<Member> {
  await delay(FAKE_DELAY);
  const idx = db.members.findIndex(m => m.id === memberId && m.merchant_id === merchantId);
  if (idx === -1) throw new Error('Member not found');
  db.members[idx] = { ...db.members[idx], ...data };
  return db.members[idx];
}

export async function getMembers(merchantId: string): Promise<Member[]> {
  await delay(FAKE_DELAY);
  return db.members.filter(m => m.merchant_id === merchantId).map(m => ({
    ...m,
    membership_type: db.membershipTypes.find(mt => mt.id === m.membership_type_id),
  }));
}

// ---- Redemptions ----
export async function redeemOffer(
  merchantId: string,
  memberId: string,
  offerStateId: string,
  staffId: string
): Promise<Redemption> {
  await delay(FAKE_DELAY);
  const member = db.members.find(m => m.id === memberId && m.merchant_id === merchantId);
  if (!member) throw new Error('Member not found');
  if (member.status === 'expired') throw new Error('Membership expired');

  const stateIdx = db.memberOfferStates.findIndex(s => s.id === offerStateId && s.member_id === memberId);
  if (stateIdx === -1) throw new Error('Offer not found');
  const state = db.memberOfferStates[stateIdx];
  if (state.status === 'exhausted') throw new Error('Offer already fully used');
  if (state.remaining_qty !== null && state.remaining_qty <= 0) throw new Error('Offer fully redeemed');

  // Atomic decrement
  if (state.remaining_qty !== null) {
    db.memberOfferStates[stateIdx].remaining_qty = state.remaining_qty - 1;
    if (db.memberOfferStates[stateIdx].remaining_qty === 0) {
      db.memberOfferStates[stateIdx].status = 'exhausted';
    }
  }

  const offer = db.offerTemplates.find(o => o.id === state.offer_template_id);
  const staff = db.merchantUsers.find(u => u.id === staffId);

  // Feature 1: simulate loyalty points earn
  if (offer?.loyalty_points_earn) {
    const memberIdx = db.members.findIndex(m => m.id === memberId && m.merchant_id === merchantId);
    if (memberIdx !== -1) {
      db.members[memberIdx].loyalty_points = (db.members[memberIdx].loyalty_points || 0) + offer.loyalty_points_earn;
      // Add to mock loyalty transaction history
      db.loyaltyTransactions.push({
        id: `ltx-${Date.now()}`,
        member_id: memberId,
        merchant_id: merchantId,
        type: 'earn',
        points: offer.loyalty_points_earn,
        source_offer_id: offer.id,
        source_offer_title: offer.title,
        balance_after: db.members[memberIdx].loyalty_points,
        created_at: new Date().toISOString(),
      });
    }
  }

  const redemption: Redemption = {
    id: `red-${Date.now()}`,
    member_id: memberId,
    offer_template_id: state.offer_template_id,
    merchant_user_id: staffId,
    staff_name: staff?.name,
    amount: 0,
    created_at: new Date().toISOString(),
    member: { name: member.name, member_code: member.member_code },
    offer: offer ? { title: offer.title, offer_type: offer.offer_type } : undefined,
  };
  db.redemptions.unshift(redemption);
  return redemption;
}

export async function getMemberRedemptions(merchantId: string, memberId: string): Promise<Redemption[]> {
  await delay(FAKE_DELAY);
  return db.redemptions.filter(r => r.member_id === memberId && db.members.find(m => m.id === memberId && m.merchant_id === merchantId));
}

// ---- Loyalty Points (Feature 1) ----
export async function getLoyaltyHistory(merchantId: string, memberId: string): Promise<LoyaltyTransaction[]> {
  await delay(FAKE_DELAY);
  return db.loyaltyTransactions
    .filter(tx => tx.member_id === memberId && tx.merchant_id === merchantId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function redeemPoints(
  merchantId: string,
  memberId: string,
  offerStateId: string,
  staffId: string,
): Promise<Redemption> {
  await delay(FAKE_DELAY);
  const member = db.members.find(m => m.id === memberId && m.merchant_id === merchantId);
  if (!member) throw new Error('Member not found');

  const stateIdx = db.memberOfferStates.findIndex(s => s.id === offerStateId && s.member_id === memberId);
  if (stateIdx === -1) throw new Error('Offer not found');
  const state = db.memberOfferStates[stateIdx];
  const offer = db.offerTemplates.find(o => o.id === state.offer_template_id);
  if (!offer?.is_points_redemption || !offer.loyalty_points_cost) throw new Error('Not a points redemption offer');

  const pointsCost = offer.loyalty_points_cost;
  if ((member.loyalty_points || 0) < pointsCost) throw new Error(`Insufficient loyalty points. Required: ${pointsCost}`);

  // Atomic deduct
  const memberIdx = db.members.findIndex(m => m.id === memberId);
  db.members[memberIdx].loyalty_points = (member.loyalty_points || 0) - pointsCost;
  if (state.remaining_qty !== null) {
    db.memberOfferStates[stateIdx].remaining_qty = (state.remaining_qty || 0) - 1;
    if (db.memberOfferStates[stateIdx].remaining_qty === 0) db.memberOfferStates[stateIdx].status = 'exhausted';
  }
  db.loyaltyTransactions.push({
    id: `ltx-${Date.now()}`,
    member_id: memberId,
    merchant_id: merchantId,
    type: 'redeem',
    points: -pointsCost,
    source_offer_id: offer.id,
    source_offer_title: offer.title,
    balance_after: db.members[memberIdx].loyalty_points,
    created_at: new Date().toISOString(),
  });

  const staff = db.merchantUsers.find(u => u.id === staffId);
  const redemption: Redemption = {
    id: `red-${Date.now()}`,
    member_id: memberId,
    offer_template_id: state.offer_template_id,
    merchant_user_id: staffId,
    staff_name: staff?.name,
    amount: 0,
    created_at: new Date().toISOString(),
    member: { name: member.name, member_code: member.member_code },
    offer: { title: offer.title, offer_type: offer.offer_type },
  };
  db.redemptions.unshift(redemption);
  return redemption;
}

// ---- Offers ----
export async function getOfferTemplates(merchantId: string): Promise<OfferTemplate[]> {
  await delay(FAKE_DELAY);
  return db.offerTemplates.filter(o => o.merchant_id === merchantId);
}

export async function createOfferTemplate(merchantId: string, data: Partial<OfferTemplate>): Promise<OfferTemplate> {
  await delay(FAKE_DELAY);
  const newOffer: OfferTemplate = {
    id: `off-${Date.now()}`,
    merchant_id: merchantId,
    title: data.title!,
    description: data.description || '',
    offer_type: data.offer_type!,
    value: data.value || 0,
    active: true,
    applicable_membership_type_ids: data.applicable_membership_type_ids || [],
  };
  db.offerTemplates.push(newOffer);
  return newOffer;
}

export async function updateOfferTemplate(merchantId: string, offerId: string, data: Partial<OfferTemplate>): Promise<OfferTemplate> {
  await delay(FAKE_DELAY);
  const idx = db.offerTemplates.findIndex(o => o.id === offerId && o.merchant_id === merchantId);
  if (idx === -1) throw new Error('Offer not found');
  db.offerTemplates[idx] = { ...db.offerTemplates[idx], ...data };
  return db.offerTemplates[idx];
}

// ---- Membership Types ----
export async function getMembershipTypes(merchantId: string): Promise<MembershipType[]> {
  await delay(FAKE_DELAY);
  return db.membershipTypes.filter(mt => mt.merchant_id === merchantId).map(mt => ({
    ...mt,
    offers: db.offerTemplates.filter(o => o.applicable_membership_type_ids?.includes(mt.id)),
  }));
}

export async function createMembershipType(merchantId: string, data: Partial<MembershipType>): Promise<MembershipType> {
  await delay(FAKE_DELAY);
  const newType: MembershipType = {
    id: `mtype-${Date.now()}`,
    merchant_id: merchantId,
    name: data.name!,
    description: data.description || '',
    member_count: 0,
  };
  db.membershipTypes.push(newType);
  return newType;
}

// ---- Campaigns ----
export async function getCampaigns(merchantId: string): Promise<Campaign[]> {
  await delay(FAKE_DELAY);
  return db.campaigns.filter(c => c.merchant_id === merchantId);
}

export async function createCampaign(merchantId: string, data: Partial<Campaign>): Promise<Campaign> {
  await delay(FAKE_DELAY);
  const audience = db.members.filter(m => {
    if (!data.target_audience || data.target_audience === 'all') return m.merchant_id === merchantId;
    if (data.target_audience === 'expiring_soon') return m.merchant_id === merchantId && m.status === 'expiring_soon';
    if (data.target_audience === 'by_membership_type') return m.merchant_id === merchantId && m.membership_type_id === data.target_membership_type_id;
    return false;
  });
  const newCampaign: Campaign = {
    id: `camp-${Date.now()}`,
    merchant_id: merchantId,
    name: data.name!,
    target_audience: data.target_audience!,
    target_membership_type_id: data.target_membership_type_id,
    channel: data.channel!,
    template_text: data.template_text!,
    scheduled_at: data.scheduled_at,
    status: data.scheduled_at ? 'scheduled' : 'sent',
    audience_size: audience.length,
    sent_count: data.scheduled_at ? 0 : audience.length,
    created_at: new Date().toISOString(),
  };
  db.campaigns.unshift(newCampaign);
  return newCampaign;
}

// ---- Reminder Rules ----
export async function getReminderRules(merchantId: string): Promise<ReminderRule[]> {
  await delay(FAKE_DELAY);
  return db.reminderRules.filter(r => r.merchant_id === merchantId);
}

export async function updateReminderRule(merchantId: string, ruleId: string, data: Partial<ReminderRule>): Promise<ReminderRule> {
  await delay(FAKE_DELAY);
  const idx = db.reminderRules.findIndex(r => r.id === ruleId && r.merchant_id === merchantId);
  if (idx === -1) throw new Error('Rule not found');
  db.reminderRules[idx] = { ...db.reminderRules[idx], ...data };
  return db.reminderRules[idx];
}

// ---- Reports ----
export async function getReportData(merchantId: string, _from?: string, _to?: string): Promise<ReportData> {
  await delay(FAKE_DELAY * 2);
  const reds = db.redemptions.filter(r => db.members.find(m => m.id === r.member_id && m.merchant_id === merchantId));
  const typeCount: Record<string, number> = {};
  reds.forEach(r => {
    const t = r.offer?.offer_type || 'unknown';
    typeCount[t] = (typeCount[t] || 0) + 1;
  });
  const last7: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    last7.push({ date: dateStr, count: Math.floor(Math.random() * 30) + 5 });
  }
  return {
    redemptions_by_offer: Object.entries(typeCount).map(([k, v]) => ({ offer_type: k, count: v })),
    redemptions_over_time: last7,
    all_redemptions: reds,
    summary: {
      total_redemptions: reds.length,
      active_members: db.members.filter(m => m.merchant_id === merchantId && m.status === 'active').length,
      expiring_soon: db.members.filter(m => m.merchant_id === merchantId && m.status === 'expiring_soon').length,
      most_used_offer: 'Free Hair Wash',
      points_issued_month: db.loyaltyTransactions.filter(tx => tx.merchant_id === merchantId && tx.type === 'earn').reduce((s, t) => s + t.points, 0),
      points_redeemed_month: Math.abs(db.loyaltyTransactions.filter(tx => tx.merchant_id === merchantId && tx.type === 'redeem').reduce((s, t) => s + t.points, 0)),
    },
  };
}

// ---- Admin ----
export async function getAdminStats(): Promise<AdminDashboardStats> {
  await delay(FAKE_DELAY);
  return db.adminStats;
}

export async function getAllMerchants(): Promise<Merchant[]> {
  await delay(FAKE_DELAY);
  return db.merchants;
}

export async function updateMerchantStatus(merchantId: string, status: 'active' | 'suspended'): Promise<Merchant> {
  await delay(FAKE_DELAY);
  const idx = db.merchants.findIndex(m => m.id === merchantId);
  if (idx === -1) throw new Error('Merchant not found');
  db.merchants[idx].status = status;
  return db.merchants[idx];
}

export async function getMerchantUsers(merchantId: string): Promise<MerchantUser[]> {
  await delay(FAKE_DELAY);
  return db.merchantUsers.filter(u => u.merchant_id === merchantId);
}

export async function createMerchantUser(merchantId: string, data: Partial<MerchantUser>): Promise<MerchantUser> {
  await delay(FAKE_DELAY);
  const newUser: MerchantUser = {
    id: `usr-${Date.now()}`,
    merchant_id: merchantId,
    name: data.name!,
    phone: data.phone!,
    role: data.role || 'staff',
    created_at: new Date().toISOString(),
  };
  db.merchantUsers.push(newUser);
  return newUser;
}

export async function updateMerchant(merchantId: string, data: Partial<Merchant>): Promise<Merchant> {
  await delay(FAKE_DELAY);
  const idx = db.merchants.findIndex(m => m.id === merchantId);
  if (idx === -1) throw new Error('Merchant not found');
  db.merchants[idx] = { ...db.merchants[idx], ...data };
  return db.merchants[idx];
}

export async function createMerchant(data: Partial<Merchant> & { owner_name: string; owner_phone: string }): Promise<Merchant> {
  await delay(FAKE_DELAY);
  const merchant: Merchant = {
    id: `mer-${Date.now()}`,
    business_name: data.business_name!,
    category: data.category!,
    plan_tier: data.plan_tier || 'Starter',
    whatsapp_number: data.whatsapp_number || '',
    address: data.address,
    status: 'active',
    created_at: new Date().toISOString(),
    member_count: 0,
  };
  db.merchants.push(merchant);
  return merchant;
}

// ---- Public self-check ----
export async function getPublicMemberView(token: string): Promise<PublicMemberView | null> {
  await delay(FAKE_DELAY);
  return db.publicMemberViews[token] || null;
}

// ---- Card Inventory (Admin) ----

/** Get all cards in the global inventory, with optional filters */
export async function getCardInventory(filters?: {
  status?: string;
  merchant_id?: string;
  search?: string;
}): Promise<CardInventoryItem[]> {
  await delay(FAKE_DELAY);
  let cards = [...db.cardInventory];
  if (filters?.status && filters.status !== 'all') {
    cards = cards.filter(c => c.status === filters.status);
  }
  if (filters?.merchant_id) {
    cards = cards.filter(c => c.allocated_merchant_id === filters.merchant_id);
  }
  if (filters?.search) {
    const q = filters.search.replace(/\s/g, '').toLowerCase();
    cards = cards.filter(c =>
      c.card_number.replace(/\s/g, '').includes(q) ||
      (c.linked_member_name || '').toLowerCase().includes(q) ||
      (c.linked_member_phone || '').replace(/\s/g, '').includes(q)
    );
  }
  return cards;
}

/**
 * Add a list of card numbers to the inventory (Super Admin pastes/uploads a set of 16-digit numbers).
 * Validates format and skips duplicates.
 */
export async function addCardsToInventory(cardNumbers: string[]): Promise<{
  added: number;
  skipped: number;
  errors: string[];
}> {
  await delay(FAKE_DELAY);
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const raw of cardNumbers) {
    const normalized = raw.trim().replace(/\s+/g, ' ');
    const digits = normalized.replace(/\s/g, '');
    if (digits.length !== 16 || !/^\d+$/.test(digits)) {
      errors.push(`"${raw}" — invalid format (must be 16 digits)`);
      continue;
    }
    const existing = db.cardInventory.find(c => c.card_number.replace(/\s/g, '') === digits);
    if (existing) {
      skipped++;
      continue;
    }
    // Format as XXXX XXXX XXXX XXXX
    const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`;
    const newCard: CardInventoryItem = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      card_number: formatted,
      status: 'unassigned',
      created_by_admin_id: 'usr-admin',
      created_at: new Date().toISOString(),
    };
    db.cardInventory.push(newCard);
    added++;
  }
  return { added, skipped, errors };
}

/** Allocate a set of card IDs (or quantity of unassigned cards) to a merchant */
export async function allocateCardsToMerchant(
  merchantId: string,
  cardIds: string[]
): Promise<CardInventoryItem[]> {
  await delay(FAKE_DELAY);
  const merchant = db.merchants.find(m => m.id === merchantId);
  if (!merchant) throw new Error('Merchant not found');
  const updated: CardInventoryItem[] = [];
  for (const id of cardIds) {
    const idx = db.cardInventory.findIndex(c => c.id === id && c.status === 'unassigned');
    if (idx === -1) continue;
    db.cardInventory[idx] = {
      ...db.cardInventory[idx],
      status: 'merchant_allocated',
      allocated_merchant_id: merchantId,
      allocated_merchant_name: merchant.business_name,
      allocated_at: new Date().toISOString(),
    };
    updated.push(db.cardInventory[idx]);
  }
  return updated;
}

/** Revoke allocated (but not yet linked) cards back to the global pool */
export async function revokeCardsFromMerchant(cardIds: string[]): Promise<void> {
  await delay(FAKE_DELAY);
  for (const id of cardIds) {
    const idx = db.cardInventory.findIndex(c => c.id === id && c.status === 'merchant_allocated');
    if (idx === -1) continue;
    db.cardInventory[idx] = {
      ...db.cardInventory[idx],
      status: 'unassigned',
      allocated_merchant_id: undefined,
      allocated_merchant_name: undefined,
      allocated_at: undefined,
    };
  }
}

/** Deactivate a card (lost/stolen) */
export async function deactivateCard(cardId: string): Promise<CardInventoryItem> {
  await delay(FAKE_DELAY);
  const idx = db.cardInventory.findIndex(c => c.id === cardId);
  if (idx === -1) throw new Error('Card not found');
  db.cardInventory[idx].status = 'deactivated';
  return db.cardInventory[idx];
}

// ---- Card Inventory (Merchant) ----

/** Get all cards allocated to a specific merchant */
export async function getMerchantCards(merchantId: string): Promise<CardInventoryItem[]> {
  await delay(FAKE_DELAY);
  return db.cardInventory.filter(c =>
    c.allocated_merchant_id === merchantId &&
    c.status !== 'deactivated'
  );
}

/** Link a physical card to a member. Card must belong to the merchant. */
export async function linkCardToMember(
  merchantId: string,
  cardId: string,
  memberId: string
): Promise<{ card: CardInventoryItem; member: Member }> {
  await delay(FAKE_DELAY);

  const cardIdx = db.cardInventory.findIndex(
    c => c.id === cardId && c.allocated_merchant_id === merchantId && c.status === 'merchant_allocated'
  );
  if (cardIdx === -1) throw new Error('Card not available or not allocated to this merchant');

  const memberIdx = db.members.findIndex(m => m.id === memberId && m.merchant_id === merchantId);
  if (memberIdx === -1) throw new Error('Member not found');

  // Check member doesn't already have a card
  if (db.members[memberIdx].physical_card_number) {
    throw new Error('Member already has a card linked. Unlink the existing card first.');
  }

  const card = db.cardInventory[cardIdx];
  const member = db.members[memberIdx];

  // Update card
  db.cardInventory[cardIdx] = {
    ...card,
    status: 'member_linked',
    linked_member_id: memberId,
    linked_member_name: member.name,
    linked_member_phone: member.phone,
    linked_at: new Date().toISOString(),
  };

  // Update member
  db.members[memberIdx] = {
    ...member,
    physical_card_number: card.card_number,
  };

  return { card: db.cardInventory[cardIdx], member: db.members[memberIdx] };
}

/** Unlink a card from a member — card returns to merchant's available pool */
export async function unlinkCard(
  merchantId: string,
  cardId: string
): Promise<{ card: CardInventoryItem; member: Member }> {
  await delay(FAKE_DELAY);

  const cardIdx = db.cardInventory.findIndex(
    c => c.id === cardId && c.allocated_merchant_id === merchantId && c.status === 'member_linked'
  );
  if (cardIdx === -1) throw new Error('Card not found or not linked');

  const card = db.cardInventory[cardIdx];
  const memberIdx = db.members.findIndex(m => m.id === card.linked_member_id);
  if (memberIdx !== -1) {
    db.members[memberIdx] = { ...db.members[memberIdx], physical_card_number: undefined };
  }

  db.cardInventory[cardIdx] = {
    ...card,
    status: 'merchant_allocated',
    linked_member_id: undefined,
    linked_member_name: undefined,
    linked_member_phone: undefined,
    linked_at: undefined,
  };

  return { card: db.cardInventory[cardIdx], member: db.members[memberIdx] };
}

/**
 * Search a member by their 16-digit physical card number (or scanned QR value).
 * Used in the merchant's redeem/search screen.
 */
export async function searchMemberByCard(merchantId: string, cardNumber: string): Promise<Member | null> {
  await delay(FAKE_DELAY);
  const normalized = cardNumber.replace(/\s/g, '');
  const member = db.members.find(m =>
    m.merchant_id === merchantId &&
    m.physical_card_number?.replace(/\s/g, '') === normalized
  );
  if (!member) return null;
  return { ...member, membership_type: db.membershipTypes.find(mt => mt.id === member.membership_type_id) };
}

export async function applyReferral(merchantId: string, memberId: string, referralCode: string): Promise<Member> {
  await delay(FAKE_DELAY);
  const member = db.members.find(m => m.id === memberId);
  if (!member) throw new Error('Member not found');
  member.referred_by_member_id = 'some-referrer-id';
  return member;
}

export async function renewMember(merchantId: string, memberId: string): Promise<Member> {
  await delay(FAKE_DELAY);
  const member = db.members.find(m => m.id === memberId);
  if (!member) throw new Error('Member not found');
  const d = new Date(member.expiry_date);
  d.setFullYear(d.getFullYear() + 1);
  member.expiry_date = d.toISOString().split('T')[0];
  member.status = 'active';
  return member;
}

export async function getNewMembersReport(_merchantId: string, days = 30): Promise<{ date: string; count: number }[]> {
  await delay(FAKE_DELAY);
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    result.push({ date: d.toISOString().split('T')[0], count: Math.floor(Math.random() * 5) });
  }
  return result;
}

export async function getTopCustomersReport(_merchantId: string, limit = 10): Promise<any[]> {
  await delay(FAKE_DELAY);
  return db.members.slice(0, limit).map((m, i) => ({
    member_id: m.id,
    name: m.name,
    phone: m.phone,
    member_code: m.member_code,
    redemption_count: 10 - i,
    loyalty_points: m.loyalty_points,
    total_visits: 12 - i,
  }));
}

export async function getPointsReport(_merchantId: string, weeks = 12): Promise<any[]> {
  await delay(FAKE_DELAY);
  const result = [];
  for (let i = weeks - 1; i >= 0; i--) {
    result.push({
      week: `2026-W${10 + i}`,
      points_earned: 500 + Math.floor(Math.random() * 200),
      points_redeemed: 300 + Math.floor(Math.random() * 150),
    });
  }
  return result;
}

export async function approveMerchant(merchantId: string): Promise<Merchant> {
  await delay(FAKE_DELAY);
  const merchant = db.merchants.find(m => m.id === merchantId);
  if (!merchant) throw new Error('Merchant not found');
  merchant.approval_status = 'approved';
  merchant.status = 'active';
  return merchant;
}

export async function rejectMerchant(merchantId: string): Promise<Merchant> {
  await delay(FAKE_DELAY);
  const merchant = db.merchants.find(m => m.id === merchantId);
  if (!merchant) throw new Error('Merchant not found');
  merchant.approval_status = 'rejected';
  merchant.status = 'suspended';
  return merchant;
}

export async function sendCampaign(merchantId: string, campaignId: string): Promise<Campaign> {
  await delay(FAKE_DELAY);
  const campaign = db.campaigns.find(c => c.id === campaignId);
  if (!campaign) throw new Error('Campaign not found');
  campaign.status = 'sent';
  campaign.sent_count = campaign.audience_size;
  return campaign;
}


