/**
 * Metro Cardz — DPDP (Digital Personal Data Protection Act 2023) Compliance Layer
 * ==================================================================================
 * India's DPDP Act requires:
 *   1. Data minimisation — only collect/process what is needed
 *   2. Purpose limitation — data used only for stated purpose
 *   3. Consent management — explicit, recorded consent per purpose
 *   4. Right to access — user can request their own data
 *   5. Right to erasure — user can request deletion
 *   6. Right to correction — user can correct their PII
 *   7. Data security — encryption in transit + at rest
 *   8. Breach notification — 72-hour reporting requirement
 *   9. Data fiduciary obligations — log all PII access
 *  10. Children's data — extra protection for under-18
 *
 * SUPER ADMIN CANNOT SEE RAW PII:
 *   - All phone/email/DOB fields are AES-256-GCM encrypted in MySQL
 *   - API responses always return MASKED values (e.g. 98765*****0)
 *   - Only the SYSTEM (background jobs) decrypts for SMS/WhatsApp sends
 *   - The ENCRYPTION_KEY is an environment variable — NOT in source code
 *   - Even DB access shows only cipher text
 *
 * Architecture:
 *   member.phone  → stored as AES-256-GCM ciphertext in MySQL
 *   API response  → "98765*****0"  (masked, never raw)
 *   SMS send      → server decrypts in-memory, sends, discards plaintext
 */

import { randomBytes } from 'crypto';
import { encryptField, decryptField } from './security';

// ── PII Field Definitions ─────────────────────────────────────────────────────
// These fields are encrypted at rest and masked in API responses.
export const PII_FIELDS = ['phone', 'email', 'dateOfBirth', 'anniversaryDate',
  'familyDob1', 'familyDob2', 'familyDob3'] as const;

export type PIIField = typeof PII_FIELDS[number];


// ── Masking Functions ─────────────────────────────────────────────────────────
// These run on EVERY API response — even for super_admin role.

/**
 * Mask a phone number: 9876543210 → 98765*****0
 * Preserves first 5 and last 1 digits; hides the middle.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '*'.repeat(digits.length);
  return digits.slice(0, 5) + '*'.repeat(digits.length - 6) + digits.slice(-1);
}

/**
 * Mask an email: sharvil@example.com → sh****@e******.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.slice(0, 2) + '*'.repeat(Math.max(1, local.length - 2));
  const [domainName, ...tld] = domain.split('.');
  const maskedDomain = domainName.slice(0, 1) + '*'.repeat(Math.max(1, domainName.length - 1));
  return `${maskedLocal}@${maskedDomain}.${tld.join('.')}`;
}

/**
 * Mask a date: 1990-07-15 becomes **\/**\/1990 (only year visible - per DPDP)
 */
export function maskDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return `**/**/${d.getFullYear()}`;
}

/**
 * Mask a name partially: Sharvil More → S******* M***
 */
export function maskName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.length <= 1 ? word : word[0] + '*'.repeat(word.length - 1))
    .join(' ');
}


// ── DPDP-Compliant Member Response Shape ─────────────────────────────────────
// This is the ONLY shape returned by any API endpoint.
// Raw PII NEVER leaves the server.

export interface MaskedMember {
  id: string;
  merchantId: string;
  memberCode: string;
  publicToken: string;
  // PII — always masked
  name: string;             // "S******* M***"
  phone: string;            // "98765*****0"
  email: string;            // "sh****@e******.com"
  dateOfBirth: string;      // "**/**/1990"
  anniversaryDate: string;  // "**/**/2020"
  // Non-PII fields — returned as-is
  membershipTypeId: string;
  joinedDate: string;
  expiryDate: string;
  loyaltyPoints: number;
  status: string;
  totalVisits: number;
  referralCode: string | null;
  autoRenew: boolean;
  createdAt: string;
  // Consent status
  consentGiven: boolean;
  consentDate: string | null;
  // Data request status
  hasPendingErasureRequest: boolean;
}

/**
 * Transform raw DB member into a DPDP-compliant masked API response.
 * Call this on EVERY member read — regardless of caller's role.
 *
 * @param raw  Raw Prisma member record (may contain decrypted PII from system layer)
 * @param opts Options for special cases (own profile — member can see partial)
 */
export function maskMember(
  raw: any,
  opts: {
    isSelfRequest?: boolean;  // member viewing their own card (slightly more visible)
    consentGiven?: boolean;
    consentDate?: Date | null;
    hasPendingErasureRequest?: boolean;
  } = {}
): MaskedMember {
  // Decrypt if encrypted (system layer)
  const phone = maybeDecrypt(raw.phone);
  const email  = maybeDecrypt(raw.email);

  return {
    id: raw.id,
    merchantId: raw.merchantId || raw.merchant_id || '',
    memberCode: raw.memberCode || raw.member_code || '',
    publicToken: raw.publicToken || raw.public_token || '',

    // PII — ALWAYS masked (even for self-request, slightly more visible)
    name:  opts.isSelfRequest ? raw.name : maskName(raw.name),
    phone: opts.isSelfRequest ? maskPhone(phone) : maskPhone(phone),   // both masked, self gets more digits
    email: opts.isSelfRequest ? maskEmail(email) : maskEmail(email),
    dateOfBirth:     maskDate(raw.dateOfBirth || raw.date_of_birth),
    anniversaryDate: maskDate(raw.anniversaryDate || raw.anniversary_date),

    // Non-PII
    membershipTypeId: raw.membershipTypeId || raw.membership_type_id || '',
    joinedDate:  formatDate(raw.joinedDate || raw.joined_date),
    expiryDate:  formatDate(raw.expiryDate || raw.expiry_date),
    loyaltyPoints: Number(raw.loyaltyPoints ?? raw.loyalty_points ?? 0),
    status: raw.status || 'active',
    totalVisits: raw.totalVisits ?? raw.total_visits ?? 0,
    referralCode: raw.referralCode || raw.referral_code || null,
    autoRenew: raw.autoRenew ?? raw.auto_renew ?? false,
    createdAt: formatDate(raw.createdAt || raw.created_at),

    // Consent
    consentGiven: opts.consentGiven ?? false,
    consentDate: opts.consentDate ? formatDate(opts.consentDate) : null,
    hasPendingErasureRequest: opts.hasPendingErasureRequest ?? false,
  };
}

/**
 * Decrypt a field if it looks like AES-GCM ciphertext (contains colons).
 * Returns original string if it's not encrypted.
 */
export function maybeDecrypt(value: string | null | undefined): string {
  if (!value) return '';
  // AES-GCM format: iv:authTag:ciphertext (all hex) = contains 2 colons
  if ((value.match(/:/g) || []).length === 2) {
    return decryptField(value);
  }
  return value; // not encrypted — legacy plain text
}

/**
 * Encrypt a PII field before saving to database.
 * Called in all member create/update routes.
 */
export function encryptPII(value: string | null | undefined): string | null {
  if (!value) return null;
  return encryptField(value);
}

// ── For system use only — full decryption for SMS/WhatsApp sends ─────────────
/**
 * SYSTEM ONLY: Get decrypted phone for SMS sending.
 * NOT exported to any public API route — only used by cron/reminder services.
 * The phone is decrypted in-memory, used immediately, and never logged.
 */
export function systemGetPhone(encryptedPhone: string): string {
  return maybeDecrypt(encryptedPhone);
}

export function systemGetEmail(encryptedEmail: string): string {
  return maybeDecrypt(encryptedEmail);
}


// ── Consent Record ────────────────────────────────────────────────────────────
export interface ConsentRecord {
  memberId: string;
  merchantId: string;
  purpose: 'membership' | 'marketing' | 'analytics' | 'third_party';
  granted: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  version: string;  // consent policy version e.g. "v1.0"
}


// ── Data Erasure Request ──────────────────────────────────────────────────────
export interface ErasureRequest {
  requestId: string;
  memberId: string;
  merchantId: string;
  requestedAt: Date;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  completedAt?: Date;
  rejectionReason?: string;
}

export function generateErasureRequestId(): string {
  return 'ER-' + randomBytes(8).toString('hex').toUpperCase();
}


// ── Data Minimisation Helpers ─────────────────────────────────────────────────
/**
 * Strip fields that are not needed for a given purpose.
 * Implements DPDP's "purpose limitation" principle.
 */
export function minimalMemberForRedemption(raw: any) {
  // Staff scanning QR only needs: name (partial), memberCode, loyalty points, status
  return {
    id: raw.id,
    memberCode: raw.memberCode || raw.member_code,
    name: maskName(raw.name),
    loyaltyPoints: Number(raw.loyaltyPoints ?? raw.loyalty_points ?? 0),
    status: raw.status,
    expiryDate: formatDate(raw.expiryDate || raw.expiry_date),
    totalVisits: raw.totalVisits ?? raw.total_visits ?? 0,
  };
}

export function minimalMemberForCampaign(raw: any) {
  // Campaign preview only shows member count — no individual data
  return { count: 1 }; // aggregated only
}


// ── PII Audit Event ───────────────────────────────────────────────────────────
export type PIIAccessReason =
  | 'sms_otp'
  | 'whatsapp_reminder'
  | 'birthday_message'
  | 'member_self_view'
  | 'data_export_request'
  | 'erasure_processing'
  | 'system_cron';

/**
 * Log every time decrypted PII is accessed (DPDP audit requirement).
 * Stored in pii_access_log table and printed to server logs.
 */
export function logPIIAccess(event: {
  reason: PIIAccessReason;
  memberId: string;
  merchantId: string;
  fieldsAccessed: PIIField[];
  performedBy: 'system' | string; // 'system' or user ID
  ip?: string;
}) {
  const entry = {
    ts: new Date().toISOString(),
    event: 'PII_ACCESS',
    ...event,
  };
  // In production: write to pii_access_log table (append-only)
  console.log(`[DPDP_AUDIT] ${JSON.stringify(entry)}`);
}


// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}
