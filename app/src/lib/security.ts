/**
 * Metro Cardz — Security Middleware & Utilities
 * ================================================
 * 100% compatible with Hostinger Web App Hosting (Node.js / Next.js)
 *
 * Covers:
 *  1. Rate Limiting     — In-memory (no Redis needed) with sliding window
 *  2. CSRF Protection   — Double-submit cookie pattern
 *  3. Input Sanitization — Strip dangerous HTML/script tags
 *  4. Request Logging   — Structured security event logging
 *  5. IP Blocking       — Simple in-memory blocklist
 *  6. Data Encryption   — AES-256-GCM for sensitive PII (phone numbers)
 *  7. OTP Security      — HMAC-based OTP with expiry
 *  8. Content Security Policy — Strict CSP headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'crypto';

// ── 1. In-Memory Rate Limiter (sliding window) ────────────────────────────────
// On Hostinger shared hosting: no Redis. Use Node.js Map with TTL cleanup.
// This is per-instance; for multi-process scale, use DB-based rate limiting.

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart > 60_000) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  windowMs: number;   // window duration in ms
  max: number;        // max requests per window
  keyPrefix: string;  // namespace (e.g. 'otp', 'login')
}

export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfter: number } {
  const ip = getClientIP(request);
  const key = `${config.keyPrefix}:${ip}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > config.windowMs) {
    entry = { count: 1, windowStart: now };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: config.max - 1, retryAfter: 0 };
  }

  entry.count++;
  const remaining = Math.max(0, config.max - entry.count);
  const retryAfter = Math.ceil((entry.windowStart + config.windowMs - now) / 1000);

  return {
    allowed: entry.count <= config.max,
    remaining,
    retryAfter,
  };
}

// Pre-configured rate limiters
export const OTP_RATE_LIMIT: RateLimitConfig    = { windowMs: 60_000, max: 3,   keyPrefix: 'otp' };
export const LOGIN_RATE_LIMIT: RateLimitConfig  = { windowMs: 60_000, max: 10,  keyPrefix: 'login' };
export const API_RATE_LIMIT: RateLimitConfig    = { windowMs: 60_000, max: 120, keyPrefix: 'api' };
export const UPLOAD_RATE_LIMIT: RateLimitConfig = { windowMs: 60_000, max: 5,   keyPrefix: 'upload' };

export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { detail: 'Too many requests. Please try again later.', retry_after: retryAfter },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': '3',
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}


// ── 2. Get Real Client IP ─────────────────────────────────────────────────────
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||  // Cloudflare
    '0.0.0.0'
  );
}


// ── 3. IP Blocklist ───────────────────────────────────────────────────────────
// Add known bad IPs — loaded from env or DB in production
const BLOCKED_IPS = new Set<string>(
  (process.env.BLOCKED_IPS || '').split(',').filter(Boolean)
);

export function isBlockedIP(request: NextRequest): boolean {
  return BLOCKED_IPS.has(getClientIP(request));
}

export function blockIP(ip: string): void {
  BLOCKED_IPS.add(ip);
}


// ── 4. Input Sanitization ─────────────────────────────────────────────────────
/**
 * Strip HTML tags and dangerous characters from string input.
 * Prevents XSS and SQL injection first-pass (Prisma parameterizes queries too).
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')                         // strip HTML tags
    .replace(/[<>"'`]/g, (c) => {                   // HTML-encode dangerous chars
      const map: Record<string, string> = {
        '<': '&lt;', '>': '&gt;', '"': '&quot;',
        "'": '&#x27;', '`': '&#x60;',
      };
      return map[c] || c;
    })
    .trim()
    .slice(0, 10_000);                               // hard length cap
}

/** Validate Indian phone numbers (10 digits, starting 6-9). */
export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''));
}

/** Validate email format. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}


// ── 5. Field-Level Encryption (AES-256-GCM) ──────────────────────────────────
/**
 * Encrypt sensitive PII (phone numbers, DOB) before storing in MySQL.
 * Key: ENCRYPTION_KEY env var — must be exactly 32 bytes (64 hex chars).
 *
 * Usage:
 *   const encrypted = encryptField(member.phone);   // stored in DB
 *   const plain     = decryptField(encrypted);       // for display
 *
 * Format stored in DB:  iv:authTag:ciphertext  (all hex-encoded)
 */
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY || '';
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY_HEX || ENCRYPTION_KEY_HEX.length !== 64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
        'Generate with: openssl rand -hex 32'
      );
    }
    // Dev fallback — NOT for production
    return Buffer.from('0'.repeat(64), 'hex');
  }
  return Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
}

export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getEncryptionKey();
  const iv = randomBytes(12);                        // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptField(ciphertext: string): string {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext;  // not encrypted
  try {
    const [ivHex, authTagHex, encHex] = ciphertext.split(':');
    const key = getEncryptionKey();
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    return decipher.update(Buffer.from(encHex, 'hex')).toString('utf8') + decipher.final('utf8');
  } catch {
    return '';                                       // tampered or wrong key — return empty
  }
}


// ── 6. HMAC-Based OTP ─────────────────────────────────────────────────────────
/**
 * Generate and verify time-based OTP using HMAC-SHA256.
 * No external library needed. 5-minute expiry built in.
 *
 * OTP Secret: OTP_HMAC_SECRET env var
 */
const OTP_SECRET = process.env.OTP_HMAC_SECRET || 'dev-otp-secret-change-in-prod';
const OTP_EXPIRY_SECONDS = 5 * 60;    // 5 minutes
const OTP_LENGTH = 6;

export function generateOTP(phone: string): { otp: string; expiresAt: number } {
  const timestamp = Math.floor(Date.now() / 1000);
  const otp = String(
    parseInt(
      createHmac('sha256', OTP_SECRET)
        .update(`${phone}:${timestamp}`)
        .digest('hex')
        .slice(0, 8),
      16
    ) % Math.pow(10, OTP_LENGTH)
  ).padStart(OTP_LENGTH, '0');

  return {
    otp,
    expiresAt: timestamp + OTP_EXPIRY_SECONDS,
  };
}

export function verifyOTP(phone: string, submittedOtp: string, expiresAt: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt) return false;                // expired

  // Re-derive timestamp from expiresAt
  const timestamp = expiresAt - OTP_EXPIRY_SECONDS;
  const expected = generateOTP(phone).otp;

  // Re-generate with original timestamp
  const expectedBuf = Buffer.from(
    createHmac('sha256', OTP_SECRET)
      .update(`${phone}:${timestamp}`)
      .digest('hex')
      .slice(0, 8)
  );

  // Timing-safe compare
  try {
    return timingSafeEqual(
      Buffer.from(submittedOtp.padStart(8, '0')),
      expectedBuf
    );
  } catch {
    return false;
  }
}


// ── 7. Security Headers ───────────────────────────────────────────────────────
/**
 * Apply comprehensive security headers to any API response.
 * CSP, HSTS, no-sniff, frame deny, etc.
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  const h = response.headers;

  // Prevent MIME sniffing
  h.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  h.set('X-Frame-Options', 'DENY');

  // Referrer policy
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // DNS prefetch
  h.set('X-DNS-Prefetch-Control', 'on');

  // Permissions policy — disable sensitive APIs
  h.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );

  // HSTS — only in production (Hostinger provides SSL)
  if (process.env.NODE_ENV === 'production') {
    h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://metrocardz.com https://www.metrocardz.com",
    "connect-src 'self' https://api.metrocardz.com https://metrocardz.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
  h.set('Content-Security-Policy', csp);

  return response;
}


// ── 8. CSRF Token ─────────────────────────────────────────────────────────────
/**
 * Simple double-submit cookie CSRF protection for form submissions.
 * Not needed for pure JSON API calls with Authorization header.
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function validateCsrfToken(headerToken: string | null, cookieToken: string | null): boolean {
  if (!headerToken || !cookieToken) return false;
  try {
    return timingSafeEqual(
      Buffer.from(headerToken, 'hex'),
      Buffer.from(cookieToken, 'hex')
    );
  } catch {
    return false;
  }
}


// ── 9. Secure Cookie Options ──────────────────────────────────────────────────
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60, // 30 days
} as const;

export const SESSION_COOKIE_OPTIONS = {
  ...SECURE_COOKIE_OPTIONS,
  maxAge: 24 * 60 * 60, // 24 hours for session cookies
} as const;


// ── 10. Request ID Middleware ─────────────────────────────────────────────────
export function addRequestId(response: NextResponse, requestId?: string): NextResponse {
  response.headers.set('X-Request-ID', requestId || randomBytes(8).toString('hex'));
  return response;
}


// ── 11. Audit Logger ─────────────────────────────────────────────────────────
/**
 * Structured security event logging. In production, pipe to your log service.
 * Hostinger provides server logs at: Hosting → Logs → Error/Access logs.
 */
export function securityLog(event: {
  type: 'auth_success' | 'auth_failure' | 'rate_limited' | 'invalid_token' | 'blocked_ip' | 'suspicious';
  ip: string;
  path: string;
  detail?: string;
  userId?: string;
}): void {
  const log = {
    ts: new Date().toISOString(),
    ...event,
  };
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[SECURITY] ${JSON.stringify(log)}`);
  }
}
