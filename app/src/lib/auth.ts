/**
 * Metro Cardz — JWT Auth Utilities
 *
 * Uses `jose` (already in package.json) for edge-compatible JWT operations.
 * Mirrors the Python backend's token structure exactly:
 *   { sub: userId, merchant_id, role, type: "access"|"refresh" }
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

// ── Token Configuration ───────────────────────────────────────────────────────
const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-in-production-access'
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? 'change-me-in-production-refresh'
);

const ACCESS_TTL  = '15m';   // 15 minutes  (same as Python backend)
const REFRESH_TTL = '30d';   // 30 days

// ── Token Payload Shape ───────────────────────────────────────────────────────
export interface TokenPayload extends JWTPayload {
  sub: string;           // MerchantUser.id
  merchant_id: string | null;
  role: string;
  type: 'access' | 'refresh';
}

// ── Sign Tokens ───────────────────────────────────────────────────────────────
export async function createAccessToken(data: {
  sub: string;
  merchant_id: string | null;
  role: string;
}): Promise<string> {
  return new SignJWT({ ...data, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(ACCESS_SECRET);
}

export async function createRefreshToken(data: {
  sub: string;
  merchant_id: string | null;
  role: string;
}): Promise<string> {
  return new SignJWT({ ...data, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(REFRESH_SECRET);
}

// ── Verify Tokens ─────────────────────────────────────────────────────────────
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

// ── Extract Bearer Token ──────────────────────────────────────────────────────
export function extractBearerToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

// ── Auth Guard — use in route handlers ───────────────────────────────────────
export type AuthContext = {
  userId: string;
  merchantId: string | null;
  role: string;
};

/**
 * requireAuth(request)
 * Returns AuthContext if valid JWT, or a NextResponse(401) to return immediately.
 *
 * Usage:
 *   const auth = await requireAuth(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.userId, auth.merchantId, auth.role are safe to use
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }
  const payload = await verifyAccessToken(token);
  if (!payload || payload.type !== 'access') {
    return NextResponse.json({ detail: 'Invalid or expired token' }, { status: 401 });
  }
  return {
    userId: payload.sub!,
    merchantId: payload.merchant_id ?? null,
    role: payload.role,
  };
}

/**
 * requireSuperAdmin(request) — only super_admin role may proceed.
 */
export async function requireSuperAdmin(
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'super_admin') {
    return NextResponse.json({ detail: 'Super admin access required' }, { status: 403 });
  }
  return auth;
}

/**
 * requireOwnerOrAdmin(request) — owner or super_admin only.
 */
export async function requireOwnerOrAdmin(
  request: NextRequest
): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (!['owner', 'super_admin'].includes(auth.role)) {
    return NextResponse.json({ detail: 'Owner access required' }, { status: 403 });
  }
  return auth;
}

/**
 * getMerchantId(auth) — extracts merchant_id from auth context.
 * Super admins can also pass ?merchant_id= query param.
 */
export function getMerchantId(
  auth: AuthContext,
  request: NextRequest
): string | null {
  if (auth.role === 'super_admin') {
    const url = new URL(request.url);
    return url.searchParams.get('merchant_id') ?? auth.merchantId;
  }
  return auth.merchantId;
}

// ── Build Login Response ──────────────────────────────────────────────────────
export async function buildLoginResponse(userId: string) {
  const user = await prisma.merchantUser.findUnique({
    where: { id: userId },
    include: { merchant: { select: { businessName: true } } },
  });
  if (!user) return null;

  const cleanMerchantId = user.merchantId?.trim() || null;
  const tokenData = {
    sub: user.id,
    merchant_id: cleanMerchantId,
    role: user.role,
  };

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(tokenData),
    createRefreshToken(tokenData),
  ]);

  return {
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      merchant_id: cleanMerchantId,
      merchant_name: user.merchant?.businessName ?? null,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}
