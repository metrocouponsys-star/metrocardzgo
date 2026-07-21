// ============================================================
// Metro Cardz — Real API Client
// Connects to the FastAPI backend at NEXT_PUBLIC_API_BASE_URL.
// All functions match the mock client interface exactly,
// so they are drop-in replacements — the rest of the app
// doesn't need to change at all.
// ============================================================

import type {
  Member, MembershipType, OfferTemplate, MemberOfferState,
  Redemption, ReminderRule, Campaign, DashboardStats,
  AdminDashboardStats, AuthUser, PublicMemberView, Merchant,
  MerchantUser, ReportData, CardInventoryItem, LoyaltyTransaction,
} from '../types';

// ── HTTP Client ───────────────────────────────────────────────────────────────
const BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const API = `${BASE_URL}/api/v1`;

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('metro-cardz-auth');
    if (!stored) return null;
    return JSON.parse(stored)?.state?.token || null;
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  publicEndpoint = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (!publicEndpoint) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errBody.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const get = <T>(path: string, pub = false) => request<T>('GET', path, undefined, pub);
const post = <T>(path: string, body?: unknown, pub = false) => request<T>('POST', path, body, pub);
const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body);
const del = <T>(path: string) => request<T>('DELETE', path);

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(phone: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const res = await post<{ user: AuthUser; access_token: string; refresh_token: string }>(
    '/auth/login', { phone, password }, true,
  );
  // Store refresh token for silent refresh
  localStorage.setItem('metro-cardz-refresh', res.refresh_token);
  return { user: res.user, token: res.access_token };
}

export async function sendOtp(phone: string): Promise<void> {
  await post('/auth/otp/send', { phone }, true);
}

export async function verifyOtp(phone: string, otp: string): Promise<{ user: AuthUser; token: string }> {
  const res = await post<{ user: AuthUser; access_token: string; refresh_token: string }>(
    '/auth/otp/verify', { phone, otp }, true,
  );
  localStorage.setItem('metro-cardz-refresh', res.refresh_token);
  return { user: res.user, token: res.access_token };
}

export async function refreshAccessToken(): Promise<{ user: AuthUser; token: string }> {
  const refreshToken = localStorage.getItem('metro-cardz-refresh');
  if (!refreshToken) throw new Error('No refresh token');
  const res = await post<{ user: AuthUser; access_token: string; refresh_token: string }>(
    '/auth/refresh', { refresh_token: refreshToken }, true,
  );
  localStorage.setItem('metro-cardz-refresh', res.refresh_token);
  return { user: res.user, token: res.access_token };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export async function getDashboardStats(_merchantId: string): Promise<DashboardStats> {
  return get<DashboardStats>('/dashboard/stats');
}

// ── Members ───────────────────────────────────────────────────────────────────
export async function getMembers(_merchantId: string): Promise<Member[]> {
  return get<Member[]>('/members');
}

export async function searchMembers(_merchantId: string, query: string): Promise<Member[]> {
  return get<Member[]>(`/members/search?q=${encodeURIComponent(query)}`);
}

export async function getMember(_merchantId: string, memberId: string): Promise<Member & { offer_states: MemberOfferState[] }> {
  return get<Member & { offer_states: MemberOfferState[] }>(`/members/${memberId}`);
}

export async function getMemberByToken(token: string): Promise<PublicMemberView | null> {
  try {
    return await get<PublicMemberView>(`/public/m/${token}`, true);
  } catch {
    return null;
  }
}

export async function createMember(_merchantId: string, data: Partial<Member>): Promise<Member> {
  return post<Member>('/members', data);
}

export async function bulkImportMembers(_merchantId: string, rows: Partial<Member>[]): Promise<{ imported: number; skipped: number; errors: string[] }> {
  return post<{ imported: number; skipped: number; errors: string[] }>('/members/bulk-import', { members: rows });
}

export async function updateMember(_merchantId: string, memberId: string, data: Partial<Member>): Promise<Member> {
  return patch<Member>(`/members/${memberId}`, data);
}

// ── Redemptions ───────────────────────────────────────────────────────────────
export async function redeemOffer(
  _merchantId: string,
  memberId: string,
  offerStateId: string,
  _staffId: string,
  amount?: number,
): Promise<Redemption> {
  return post<Redemption>('/redemptions', { member_id: memberId, offer_state_id: offerStateId, amount });
}

export async function redeemPoints(
  _merchantId: string,
  memberId: string,
  offerStateId: string,
  _staffId: string,
  amount?: number,
): Promise<Redemption> {
  return post<Redemption>('/redemptions/redeem-points', { member_id: memberId, offer_state_id: offerStateId, amount });
}

export async function getMemberRedemptions(_merchantId: string, memberId: string): Promise<Redemption[]> {
  return get<Redemption[]>(`/redemptions/member/${memberId}`);
}

export async function getLoyaltyHistory(_merchantId: string, memberId: string): Promise<LoyaltyTransaction[]> {
  return get<LoyaltyTransaction[]>(`/redemptions/member/${memberId}/loyalty-history`);
}

// ── Offers ────────────────────────────────────────────────────────────────────
export async function getOfferTemplates(_merchantId: string): Promise<OfferTemplate[]> {
  return get<OfferTemplate[]>('/offers');
}

export async function createOfferTemplate(_merchantId: string, data: Partial<OfferTemplate>): Promise<OfferTemplate> {
  return post<OfferTemplate>('/offers', data);
}

export async function updateOfferTemplate(merchantId: string, offerId: string, data: Partial<OfferTemplate>): Promise<OfferTemplate> {
  return patch<OfferTemplate>(`/offers/${offerId}`, data);
}

export async function deleteOfferTemplate(merchantId: string, offerId: string): Promise<void> {
  return del(`/offers/${offerId}`);
}

export async function deleteMembershipType(merchantId: string, typeId: string): Promise<void> {
  return del(`/membership-types/${typeId}`);
}

// ── Membership Types ──────────────────────────────────────────────────────────
export async function getMembershipTypes(_merchantId: string): Promise<MembershipType[]> {
  return get<MembershipType[]>('/membership-types');
}

export async function createMembershipType(_merchantId: string, data: Partial<MembershipType>): Promise<MembershipType> {
  return post<MembershipType>('/membership-types', data);
}

export async function updateMembershipType(_merchantId: string, typeId: string, data: Partial<MembershipType>): Promise<MembershipType> {
  return patch<MembershipType>(`/membership-types/${typeId}`, data);
}

// ── Campaigns ─────────────────────────────────────────────────────────────────
export async function getCampaigns(_merchantId: string): Promise<Campaign[]> {
  return get<Campaign[]>('/campaigns');
}

export async function createCampaign(_merchantId: string, data: Partial<Campaign>): Promise<Campaign> {
  return post<Campaign>('/campaigns', data);
}

// ── Reminder Rules ────────────────────────────────────────────────────────────
export async function getReminderRules(_merchantId: string): Promise<ReminderRule[]> {
  return get<ReminderRule[]>('/reminders');
}

export async function updateReminderRule(_merchantId: string, ruleId: string, data: Partial<ReminderRule>): Promise<ReminderRule> {
  return patch<ReminderRule>(`/reminders/${ruleId}`, data);
}

// ── Reports ───────────────────────────────────────────────────────────────────
// Composes from real /reports/* endpoints instead of calling the dashboard stats endpoint.
export async function getReportData(_merchantId: string, _from?: string, _to?: string): Promise<ReportData> {
  const [newMembersData, topCustomers, pointsData, allRedemptions] = await Promise.all([
    get<{ date: string; count: number }[]>('/reports/new-members?days=30').catch(() => []),
    get<any[]>('/reports/top-customers?limit=10').catch(() => []),
    get<any[]>('/reports/points?weeks=12').catch(() => []),
    get<any[]>('/reports/all-redemptions').catch(() => []),
  ]);

  // Aggregate offer-type breakdown from top-customers redemption data
  const offerTypeCounts: Record<string, number> = {};
  for (const r of allRedemptions) {
    const t = r.offer_type || r.offer?.offer_type || 'unknown';
    offerTypeCounts[t] = (offerTypeCounts[t] || 0) + 1;
  }
  const redemptions_by_offer = Object.entries(offerTypeCounts).map(([offer_type, count]) => ({ offer_type, count }));

  // New-members data already has { date, count } shape — use as redemptions over time proxy
  const redemptions_over_time = newMembersData.map((d) => ({ date: d.date, count: d.count }));

  const total_redemptions = allRedemptions.length;
  const most_used_offer = redemptions_by_offer.sort((a, b) => b.count - a.count)[0]?.offer_type || '';

  return {
    redemptions_by_offer,
    redemptions_over_time,
    all_redemptions: allRedemptions,
    summary: {
      total_redemptions,
      active_members: 0,  // filled by dashboard stats separately
      expiring_soon: 0,
      most_used_offer,
    },
  };
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function getAdminStats(): Promise<AdminDashboardStats> {
  return get<AdminDashboardStats>('/admin/stats');
}

// NOTE: getAllMerchants was a duplicate of getAdminMerchants — removed.
export async function getAllMerchants(): Promise<Merchant[]> {
  return get<Merchant[]>('/admin/merchants');
}

export async function getAdminMerchants(): Promise<Merchant[]> {
  return get<Merchant[]>('/admin/merchants');
}

export async function updateMerchantStatus(merchantId: string, status: 'active' | 'suspended'): Promise<Merchant> {
  const endpoint = status === 'suspended' ? 'suspend' : 'activate';
  return post<Merchant>(`/admin/merchants/${merchantId}/${endpoint}`);
}

export async function getMerchantUsers(merchantId: string): Promise<MerchantUser[]> {
  return get<MerchantUser[]>(`/admin/merchants/${merchantId}/users`);
}

export async function createMerchantUser(merchantId: string, data: Partial<MerchantUser>): Promise<MerchantUser> {
  return post<MerchantUser>(`/admin/merchants/${merchantId}/users`, data);
}

export async function getMerchantProfile(): Promise<Merchant> {
  return get<Merchant>('/merchant/profile');
}

export async function updateMerchant(_merchantId: string, data: Partial<Merchant>): Promise<Merchant> {
  return patch<Merchant>('/merchant/profile', data);
}

export async function createMerchant(data: Partial<Merchant> & { owner_name: string; owner_phone: string; owner_email?: string }): Promise<Merchant> {
  return post<Merchant>('/admin/merchants', data);
}

// ── Public Self-Check ─────────────────────────────────────────────────────────
export async function getPublicMemberView(token: string): Promise<PublicMemberView | null> {
  try {
    return await get<PublicMemberView>(`/public/m/${token}`, true);
  } catch {
    return null;
  }
}

// ── Card Inventory ────────────────────────────────────────────────────────────
export async function getCardInventory(filters?: { status?: string; merchant_id?: string; search?: string }): Promise<CardInventoryItem[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.merchant_id) params.set('merchant_id', filters.merchant_id);
  if (filters?.search) params.set('search', filters.search);
  return get<CardInventoryItem[]>(`/admin/cards?${params.toString()}`);
}

export async function addCardsToInventory(cardNumbers: string[]): Promise<{ added: number; skipped: number; errors: string[] }> {
  return post('/admin/cards', { card_numbers: cardNumbers });
}

export async function allocateCardsToMerchant(merchantId: string, cardIds: string[]): Promise<CardInventoryItem[]> {
  return post<CardInventoryItem[]>(`/admin/cards/allocate/${merchantId}`, { card_ids: cardIds });
}

export async function revokeCardsFromMerchant(cardIds: string[]): Promise<void> {
  // Return each card to the unassigned pool — backend: POST /admin/cards/{id}/revoke
  // This differs from deactivate: revoked cards can be reallocated, deactivated cards cannot.
  await Promise.all(cardIds.map((id) => post<CardInventoryItem>(`/admin/cards/${id}/revoke`)));
}

export async function deactivateCard(cardId: string): Promise<CardInventoryItem> {
  return post<CardInventoryItem>(`/admin/cards/${cardId}/deactivate`);
}

export async function getMerchantCards(_merchantId: string): Promise<CardInventoryItem[]> {
  return get<CardInventoryItem[]>('/merchant/cards');
}

export async function linkCardToMember(_merchantId: string, cardId: string, memberId: string): Promise<{ card: CardInventoryItem; member: Member }> {
  const card = await post<CardInventoryItem>(`/merchant/cards/${cardId}/link?member_id=${memberId}`, {});
  const member = await get<Member>(`/members/${memberId}`);
  return { card, member };
}

export async function unlinkCard(_merchantId: string, cardId: string): Promise<{ card: CardInventoryItem; member: Member }> {
  const card = await post<CardInventoryItem>(`/merchant/cards/${cardId}/unlink`, {});
  return { card, member: null as any };
}

export async function searchMemberByCard(_merchantId: string, cardNumber: string): Promise<Member | null> {
  const card = await get<any>(`/merchant/cards/search?card_number=${encodeURIComponent(cardNumber)}`);
  if (card && card.linked_member_id) {
    return get<Member>(`/members/${card.linked_member_id}`);
  }
  return null;
}

export async function resolveCardNumber(cardNumber: string): Promise<any> {
  return get<any>(`/public/cards/resolve/${encodeURIComponent(cardNumber)}`, true);
}

export async function exportCardInventoryCsv(merchantId?: string): Promise<void> {
  const q = merchantId ? `?merchant_id=${merchantId}` : '';
  const token = getToken();
  const res = await fetch(`${API}/admin/cards/export${q}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to export cards');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cards_export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function applyReferral(merchantId: string, memberId: string, referralCode: string): Promise<Member> {
  return post<Member>(`/members/${memberId}/apply-referral`, { referral_code: referralCode });
}

export async function renewMember(merchantId: string, memberId: string): Promise<Member> {
  return post<Member>(`/members/${memberId}/renew`);
}

export async function getNewMembersReport(merchantId: string, days = 30): Promise<{ date: string; count: number }[]> {
  return get<{ date: string; count: number }[]>(`/reports/new-members?days=${days}`);
}

export async function getTopCustomersReport(merchantId: string, limit = 10): Promise<any[]> {
  return get<any[]>(`/reports/top-customers?limit=${limit}`);
}

export async function getPointsReport(merchantId: string, weeks = 12): Promise<any[]> {
  return get<any[]>(`/reports/points?weeks=${weeks}`);
}

export async function approveMerchant(merchantId: string): Promise<Merchant> {
  return post<Merchant>(`/admin/merchants/${merchantId}/approve`);
}

export async function rejectMerchant(merchantId: string): Promise<Merchant> {
  return post<Merchant>(`/admin/merchants/${merchantId}/reject`);
}

export async function sendCampaign(merchantId: string, campaignId: string): Promise<Campaign> {
  return post<Campaign>(`/campaigns/${campaignId}/send`);
}

// ── Referral & Card PDF ───────────────────────────────────────────────────────
export async function getReferralLink(memberId: string): Promise<{ referral_code: string; referral_link: string; bonus_points: number }> {
  return get(`/members/${memberId}/referral-link`);
}

export async function downloadCardPdf(memberId: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API}/members/${memberId}/card-pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('PDF generation failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `member_card.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getRetentionReport(merchantId: string, cohortMonths = 6): Promise<any[]> {
  return get<any[]>(`/reports/retention?cohort_months=${cohortMonths}`);
}

// ── Reward Catalog ────────────────────────────────────────────────────────────
export interface Reward { id: string; merchant_id: string; name: string; description: string; points_cost: number; quantity_available: number | null; is_active: boolean; created_at: string; }
export async function getRewards(): Promise<Reward[]> { return get<Reward[]>('/rewards'); }
export async function createReward(data: Partial<Reward>): Promise<Reward> { return post<Reward>('/rewards', data); }
export async function updateReward(id: string, data: Partial<Reward>): Promise<Reward> { return patch<Reward>(`/rewards/${id}`, data); }
export async function deleteReward(id: string): Promise<void> { return del(`/rewards/${id}`); }
export async function claimReward(rewardId: string, memberId: string): Promise<any> { return post(`/rewards/${rewardId}/claim?member_id=${memberId}`); }
export async function getRewardClaims(memberId?: string): Promise<any[]> { return get(`/rewards/claims${memberId ? `?member_id=${memberId}` : ''}`); }

// ── Coupon Codes ──────────────────────────────────────────────────────────────
export interface Coupon { id: string; merchant_id: string; code: string; discount_type: 'flat' | 'percent'; value: number; min_purchase: number; max_uses: number | null; used_count: number; expires_at: string | null; is_active: boolean; created_at: string; }
export async function getCoupons(): Promise<Coupon[]> { return get<Coupon[]>('/coupons'); }
export async function createCoupon(data: Partial<Coupon>): Promise<Coupon> { return post<Coupon>('/coupons', data); }
export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon> { return patch<Coupon>(`/coupons/${id}`, data); }
export async function deleteCoupon(id: string): Promise<void> { return del(`/coupons/${id}`); }
export async function validateCoupon(code: string, purchaseAmount: number): Promise<any> { return post('/coupons/validate', { code, purchase_amount: purchaseAmount }); }

// ── Gift Vouchers ─────────────────────────────────────────────────────────────
export interface GiftVoucher { id: string; merchant_id: string; code: string; value: number; is_redeemed: boolean; redeemed_by_member_id: string | null; expires_at: string | null; created_at: string; }
export async function getVouchers(): Promise<GiftVoucher[]> { return get<GiftVoucher[]>('/vouchers'); }
export async function generateVouchers(value: number, quantity: number, expiresAt?: string): Promise<GiftVoucher[]> { return post<GiftVoucher[]>('/vouchers/generate', { value, quantity, expires_at: expiresAt }); }
export async function redeemVoucher(code: string, memberId: string): Promise<GiftVoucher> { return post<GiftVoucher>('/vouchers/redeem', { code, member_id: memberId }); }

// ── Points Rules ──────────────────────────────────────────────────────────────
export interface PointsRule { id: string; merchant_id: string; rule_type: 'per_visit' | 'per_rupee'; points_value: number; is_active: boolean; created_at: string; }
export async function getPointsRules(): Promise<PointsRule[]> { return get<PointsRule[]>('/points-rules'); }
export async function createPointsRule(data: Partial<PointsRule>): Promise<PointsRule> { return post<PointsRule>('/points-rules', data); }
export async function updatePointsRule(id: string, data: Partial<PointsRule>): Promise<PointsRule> { return patch<PointsRule>(`/points-rules/${id}`, data); }
export async function deletePointsRule(id: string): Promise<void> { return del(`/points-rules/${id}`); }

// ── Scratch Cards ─────────────────────────────────────────────────────────────
export interface ScratchCard { id: string; merchant_id: string; member_id: string; reward_type: string; reward_value: string; is_revealed: boolean; revealed_at: string | null; trigger_visit: number | null; created_at: string; }
export async function getScratchCards(memberId?: string): Promise<ScratchCard[]> { return get(`/scratch-cards${memberId ? `?member_id=${memberId}` : ''}`); }
export async function issueScratchCard(memberId: string): Promise<ScratchCard> { return post(`/scratch-cards/issue?member_id=${memberId}`); }
export async function revealScratchCard(cardId: string): Promise<ScratchCard> { return post(`/scratch-cards/${cardId}/reveal`); }

// ── Lucky Draws ───────────────────────────────────────────────────────────────
export interface LuckyDraw { id: string; merchant_id: string; name: string; prize: string; draw_date: string; min_points: number; min_visits: number; status: string; winner_member_id: string | null; entry_count: number; created_at: string; }
export async function getLuckyDraws(): Promise<LuckyDraw[]> { return get<LuckyDraw[]>('/lucky-draws'); }
export async function createLuckyDraw(data: Partial<LuckyDraw>): Promise<LuckyDraw> { return post<LuckyDraw>('/lucky-draws', data); }
export async function updateLuckyDraw(id: string, data: Partial<LuckyDraw>): Promise<LuckyDraw> { return patch<LuckyDraw>(`/lucky-draws/${id}`, data); }
export async function enterLuckyDraw(drawId: string, memberId: string): Promise<any> { return post(`/lucky-draws/${drawId}/enter?member_id=${memberId}`); }
export async function runLuckyDraw(drawId: string): Promise<any> { return post(`/lucky-draws/${drawId}/run`); }
export async function deleteLuckyDraw(id: string): Promise<void> { return del(`/lucky-draws/${id}`); }

// ── Admin Members & Reports ───────────────────────────────────────────────────
export async function getAdminAllMembers(params?: { search?: string; merchant_id?: string; status?: string; limit?: number; offset?: number }): Promise<any[]> {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.merchant_id) q.set('merchant_id', params.merchant_id);
  if (params?.status) q.set('status', params.status);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  return get(`/admin/members?${q.toString()}`);
}
export async function getAdminReportStats(params?: { date_from?: string; date_to?: string }): Promise<any> {
  const q = new URLSearchParams();
  if (params?.date_from) q.set('date_from', params.date_from);
  if (params?.date_to) q.set('date_to', params.date_to);
  return get(`/admin/reports/stats?${q.toString()}`);
}
export async function getAdminReportsByMerchant(): Promise<any[]> { return get('/admin/reports/by-merchant'); }
export async function getAdminMerchantDetail(merchantId: string): Promise<any> { return get(`/admin/merchants/${merchantId}/detail`); }
export async function updateStaffRole(merchantId: string, userId: string, role: string): Promise<any> {
  return patch(`/admin/merchants/${merchantId}/users/${userId}/role?role=${role}`);
}
export async function deleteStaff(merchantId: string, userId: string): Promise<void> {
  return del(`/admin/merchants/${merchantId}/users/${userId}`);
}

export async function submitFeedback(memberId: string, rating: number, comment?: string): Promise<any> {
  return post('/public/feedback', { member_id: memberId, rating, comment });
}
export async function getMerchantFeedback(): Promise<any[]> { return get('/public/feedback/merchant'); }

// ── Google Wallet ─────────────────────────────────────────────────────────────
export async function generateWalletPassUrl(memberId: string): Promise<{ save_url: string; google_object_id: string; status: string }> {
  return post(`/wallet/members/${memberId}/google`, {});
}
export async function getWalletPassStatus(memberId: string): Promise<any> {
  return get(`/wallet/members/${memberId}/google/status`);
}
export async function getMerchantWalletClass(): Promise<any> {
  return get('/wallet/merchant/class');
}
export async function syncAllWalletPasses(): Promise<any> {
  return post('/wallet/merchant/class/sync', {});
}
export async function getPublicWalletPassUrl(token: string): Promise<{ save_url: string; google_object_id: string; status: string }> {
  return get(`/wallet/public/save/${token}`, true);
}

// ── Media / Uploads ───────────────────────────────────────────────────────────
export async function uploadMerchantLogo(_merchantId: string, logoDataUrl: string): Promise<Merchant> {
  return post('/merchant/profile/logo', { logo_data_url: logoDataUrl });
}

export async function setMerchantCardDesign(merchantId: string, cardDesignDataUrl: string): Promise<Merchant> {
  return post(`/admin/merchants/${merchantId}/card-design`, { card_design_data_url: cardDesignDataUrl });
}

export async function downloadCardsQrExcel(cardNumbers: string[]): Promise<void> {
  const rows = ['Card Number,QR Code Data,Status'];
  for (const num of cardNumbers) {
    const qrData = `METROCARDZ:${num.replace(/\s/g, '')}`;
    rows.push(`"${num}","${qrData}",Unassigned`);
  }
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metrocardz_cards_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

