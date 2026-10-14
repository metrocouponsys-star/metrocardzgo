/**
 * Metro Cardz — Universal Member & Card Data Normalizer
 * Bridges Prisma (camelCase) and Supabase/UI (snake_case) formats,
 * decrypts AES-256-GCM ciphertexts, and guarantees clean, consistent member records.
 */
import { maybeDecrypt } from './dpdp';
import { safeFormat } from './dateUtils';

export function normalizeMemberData(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;

  // Extract raw values checking both snake_case and camelCase
  const rawCard = raw.physical_card_number ?? raw.physicalCardNumber ?? '';
  const rawPhone = raw.phone ?? '';
  const rawEmail = raw.email ?? '';

  // Decrypt if encrypted with AES-256-GCM (iv:authTag:ciphertext)
  const physicalCard = maybeDecrypt(rawCard) || rawCard;
  const phone = maybeDecrypt(rawPhone) || rawPhone;
  const email = maybeDecrypt(rawEmail) || rawEmail;

  const memberCode = raw.member_code ?? raw.memberCode ?? '';
  const publicToken = raw.public_token ?? raw.publicToken ?? '';
  const membershipTypeId = raw.membership_type_id ?? raw.membershipTypeId ?? '';
  const membershipType = raw.membership_type ?? raw.membershipType ?? null;

  // Format dates safely
  const joinedDate = raw.joined_date ?? raw.joinedDate;
  const expiryDate = raw.expiry_date ?? raw.expiryDate;
  const dateOfBirth = raw.date_of_birth ?? raw.dateOfBirth;
  const anniversaryDate = raw.anniversary_date ?? raw.anniversaryDate;
  const createdAt = raw.created_at ?? raw.createdAt;

  const loyaltyPoints = Number(raw.loyalty_points ?? raw.loyaltyPoints ?? 0);
  const totalVisits = Number(raw.total_visits ?? raw.totalVisits ?? 0);
  const status = raw.status || 'active';
  const autoRenew = Boolean(raw.auto_renew ?? raw.autoRenew ?? false);
  const referralCode = raw.referral_code ?? raw.referralCode ?? null;

  const offerStates = (raw.offer_states ?? raw.offerStates ?? []).map((s: any) => ({
    id: s.id,
    member_id: s.member_id ?? s.memberId ?? raw.id,
    offer_template_id: s.offer_template_id ?? s.offerTemplateId,
    remaining_qty: s.remaining_qty ?? s.remainingQty ?? null,
    initial_qty: s.initial_qty ?? s.initialQty ?? null,
    status: s.status,
    offer: s.offer ?? s.offerTemplate ?? null,
    offer_template: s.offer_template ?? s.offerTemplate ?? null,
  }));

  return {
    ...raw,
    id: raw.id,
    merchant_id: raw.merchant_id ?? raw.merchantId,
    merchantId: raw.merchant_id ?? raw.merchantId,

    // Identifiers
    member_code: memberCode,
    memberCode: memberCode,
    public_token: publicToken,
    publicToken: publicToken,
    physical_card_number: physicalCard || undefined,
    physicalCardNumber: physicalCard || undefined,

    // Core info
    name: raw.name || '',
    phone: phone,
    email: email || undefined,
    date_of_birth: dateOfBirth ? (typeof dateOfBirth === 'string' ? dateOfBirth : safeFormat(dateOfBirth, 'yyyy-MM-dd')) : undefined,
    dateOfBirth: dateOfBirth ? (typeof dateOfBirth === 'string' ? dateOfBirth : safeFormat(dateOfBirth, 'yyyy-MM-dd')) : undefined,
    anniversary_date: anniversaryDate ? (typeof anniversaryDate === 'string' ? anniversaryDate : safeFormat(anniversaryDate, 'yyyy-MM-dd')) : undefined,
    anniversaryDate: anniversaryDate ? (typeof anniversaryDate === 'string' ? anniversaryDate : safeFormat(anniversaryDate, 'yyyy-MM-dd')) : undefined,

    // Membership details
    membership_type_id: membershipTypeId,
    membershipTypeId: membershipTypeId,
    membership_type: membershipType,
    membershipType: membershipType,
    joined_date: joinedDate ? (typeof joinedDate === 'string' ? joinedDate : safeFormat(joinedDate, 'yyyy-MM-dd')) : '',
    joinedDate: joinedDate ? (typeof joinedDate === 'string' ? joinedDate : safeFormat(joinedDate, 'yyyy-MM-dd')) : '',
    expiry_date: expiryDate ? (typeof expiryDate === 'string' ? expiryDate : safeFormat(expiryDate, 'yyyy-MM-dd')) : '',
    expiryDate: expiryDate ? (typeof expiryDate === 'string' ? expiryDate : safeFormat(expiryDate, 'yyyy-MM-dd')) : '',

    // Stats
    loyalty_points: loyaltyPoints,
    loyaltyPoints: loyaltyPoints,
    total_visits: totalVisits,
    totalVisits: totalVisits,
    status: status,
    auto_renew: autoRenew,
    autoRenew: autoRenew,
    referral_code: referralCode,
    referralCode: referralCode,
    notes: raw.notes ?? undefined,
    created_at: createdAt ? (typeof createdAt === 'string' ? createdAt : safeFormat(createdAt, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')) : new Date().toISOString(),
    createdAt: createdAt ? (typeof createdAt === 'string' ? createdAt : safeFormat(createdAt, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')) : new Date().toISOString(),

    // Offers & relations
    offer_states: offerStates,
    offerStates: offerStates,
    redemptions: raw.redemptions,
    loyalty_txns: raw.loyalty_txns ?? raw.loyaltyTxns,
  };
}
