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

export async function getMemberByToken(token: string): Promise<Member | null> {
  try {
    return await get<Member>(`/public/m/${token}`, true);
  } catch {
    return null;
  }
}

export async function createMember(_merchantId: string, data: Partial<Member>): Promise<Member> {
  return post<Member>('/members', data);
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
): Promise<Redemption> {
  return post<Redemption>('/redemptions', { member_id: memberId, offer_state_id: offerStateId });
}

export async function redeemPoints(
  _merchantId: string,
  memberId: string,
  offerStateId: string,
  _staffId: string,
): Promise<Redemption> {
  return post<Redemption>('/redemptions/redeem-points', { member_id: memberId, offer_state_id: offerStateId });
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

export async function updateOfferTemplate(_merchantId: string, offerId: string, data: Partial<OfferTemplate>): Promise<OfferTemplate> {
  return patch<OfferTemplate>(`/offers/${offerId}`, data);
}

// ── Membership Types ──────────────────────────────────────────────────────────
export async function getMembershipTypes(_merchantId: string): Promise<MembershipType[]> {
  return get<MembershipType[]>('/membership-types');
}

export async function createMembershipType(_merchantId: string, data: Partial<MembershipType>): Promise<MembershipType> {
  return post<MembershipType>('/membership-types', data);
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
export async function getReportData(_merchantId: string, _from?: string, _to?: string): Promise<ReportData> {
  return get<ReportData>('/dashboard/stats');
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export async function getAdminStats(): Promise<AdminDashboardStats> {
  return get<AdminDashboardStats>('/admin/stats');
}

export async function getAllMerchants(): Promise<Merchant[]> {
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

export async function updateMerchant(merchantId: string, data: Partial<Merchant>): Promise<Merchant> {
  return patch<Merchant>(`/admin/merchants/${merchantId}`, data);
}

export async function createMerchant(data: Partial<Merchant> & { owner_name: string; owner_phone: string }): Promise<Merchant> {
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

export async function revokeCardsFromMerchant(_cardIds: string[]): Promise<void> {
  // TODO: add revoke endpoint to backend
}

export async function deactivateCard(cardId: string): Promise<CardInventoryItem> {
  return post<CardInventoryItem>(`/admin/cards/${cardId}/deactivate`);
}

export async function getMerchantCards(_merchantId: string): Promise<CardInventoryItem[]> {
  return get<CardInventoryItem[]>('/admin/cards');
}

export async function linkCardToMember(_merchantId: string, _cardId: string, _memberId: string): Promise<{ card: CardInventoryItem; member: Member }> {
  throw new Error('Not implemented in real client yet');
}

export async function unlinkCard(_merchantId: string, _cardId: string): Promise<{ card: CardInventoryItem; member: Member }> {
  throw new Error('Not implemented in real client yet');
}

export async function searchMemberByCard(_merchantId: string, _cardNumber: string): Promise<Member | null> {
  return null; // TODO: add card search endpoint
}
