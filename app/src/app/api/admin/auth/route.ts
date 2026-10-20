import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAdminToken, DEALS_ADMIN_COOKIE, TOKEN_MAX_AGE_SECONDS } from '@/lib/dealsAuth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Brute-force: simple in-memory rate limit (per-IP, resets on server restart)
// For production hardening, replace with Redis-backed counter
const ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * POST /api/admin/auth
 * Login for the Deals Platform admin panel.
 * Issues a HttpOnly JWT cookie on success.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();

  // Rate limit check
  const attempts = ATTEMPTS.get(ip);
  if (attempts) {
    if (now < attempts.resetAt && attempts.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: true, message: 'Too many login attempts. Try again in 15 minutes.' },
        { status: 429 }
      );
    }
    if (now >= attempts.resetAt) {
      ATTEMPTS.delete(ip); // reset window
    }
  }

  let body: { email?: string; phone?: string; identifier?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: true, message: 'Invalid request body' }, { status: 400 });
  }

  const rawId = (body.identifier || body.email || body.phone || '').trim();
  const password = (body.password || '').trim();

  if (!rawId || !password) {
    return NextResponse.json(
      { error: true, message: 'Email/Mobile number and password are required' },
      { status: 400 }
    );
  }

  const cleanEmail = rawId.toLowerCase();
  const cleanPhone = rawId.replace(/\D/g, '');

  // 1. Try DealAdminUser first
  let admin = await prisma.dealAdminUser.findFirst({
    where: {
      OR: [
        { email: cleanEmail },
        ...(cleanPhone.length >= 10 ? [{ email: { contains: cleanPhone } }] : []),
      ],
    },
  });

  let matched = false;
  let userEmail = admin?.email || cleanEmail;
  let userRole = admin?.role || 'superadmin';
  let userId = admin?.id ? String(admin.id) : '';

  if (admin && admin.passwordHash) {
    matched = await bcrypt.compare(password, admin.passwordHash);
  }

  // 2. If not matched in DealAdminUser, check MerchantUser (supports 9029999614 & metrocouponsys@gmail.com)
  if (!matched) {
    const merchantAdmin = await prisma.merchantUser.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(cleanPhone.length >= 10 ? [{ phone: { contains: cleanPhone.slice(-10) } }] : []),
          ...(cleanPhone.includes('9029999614') ? [{ phone: '9029999614' }] : []),
          ...(cleanEmail.includes('metrocouponsys') ? [{ email: 'metrocouponsys@gmail.com' }] : []),
        ],
      },
    });

    if (merchantAdmin && merchantAdmin.passwordHash) {
      const valid = await bcrypt.compare(password, merchantAdmin.passwordHash);
      if (valid) {
        matched = true;
        userEmail = merchantAdmin.email || 'metrocouponsys@gmail.com';
        userRole = 'superadmin';
        userId = String(merchantAdmin.id);

        // Auto-sync into dealAdminUser so DealAdmin table stays synchronized
        try {
          await prisma.dealAdminUser.upsert({
            where: { email: userEmail },
            update: { passwordHash: merchantAdmin.passwordHash, role: 'superadmin' },
            create: {
              email: userEmail,
              passwordHash: merchantAdmin.passwordHash,
              name: merchantAdmin.name || 'Metro Cardz Deal Manager',
              role: 'superadmin',
            },
          });
        } catch {}
      }
    }
  }

  if (!matched) {
    // Increment rate limit counter
    const entry = ATTEMPTS.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };
    entry.count++;
    ATTEMPTS.set(ip, entry);

    return NextResponse.json(
      { error: true, message: 'Invalid credentials. Only authorized GO deal managers (9029999614 / metrocouponsys@gmail.com) can access.' },
      { status: 401 }
    );
  }

  // Clear failed attempts on success
  ATTEMPTS.delete(ip);

  const token = await signAdminToken({
    sub:   userId || 'admin_root',
    email: userEmail,
    role:  userRole,
  });

  const response = NextResponse.json({ ok: true, email: userEmail });
  response.cookies.set(DEALS_ADMIN_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   TOKEN_MAX_AGE_SECONDS,
  });

  return response;
}

/**
 * DELETE /api/admin/auth
 * Logout — clears the session cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(DEALS_ADMIN_COOKIE);
  return response;
}
