/**
 * Metro Cardz Deals — Admin JWT Authentication Helpers
 *
 * Lightweight JWT-based auth for the Deals admin panel.
 * Uses Web Crypto API (fully Edge-compatible) instead of the jose webapi build
 * so the middleware runs cleanly in Next.js Edge Runtime.
 *
 * Token is a simple signed JWT: base64url(header).base64url(payload).signature
 * Algorithm: HS256 (HMAC-SHA256)
 */

export const DEALS_ADMIN_COOKIE = 'deals_admin_token';
export const TOKEN_MAX_AGE_SECONDS = 86400; // 24 hours

export interface DealsAdminPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ── Edge-compatible HMAC helpers ─────────────────────────────────────────────

function b64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function fromB64url(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return view;
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.DEALS_ADMIN_JWT_SECRET ?? 'change-me-in-production-please';
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signAdminToken(payload: Omit<DealsAdminPayload, 'iat' | 'exp'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: DealsAdminPayload = {
    ...payload,
    iat: now,
    exp: now + TOKEN_MAX_AGE_SECONDS,
  };

  const header  = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body    = b64url(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const signing = new TextEncoder().encode(`${header}.${body}`);

  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, signing);
  const signature = b64url(new Uint8Array(sig));

  return `${header}.${body}.${signature}`;
}

export async function verifyAdminToken(token: string): Promise<DealsAdminPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, sig] = parts;
    const signing = new TextEncoder().encode(`${header}.${body}`);
    const key = await getKey();

    const valid = await crypto.subtle.verify('HMAC', key, fromB64url(sig), signing);
    if (!valid) return null;

    const payload: DealsAdminPayload = JSON.parse(
      new TextDecoder().decode(fromB64url(body))
    );

    // Check expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}
