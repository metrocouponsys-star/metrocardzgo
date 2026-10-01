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

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: true, message: 'Invalid request body' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: true, message: 'Email and password are required' },
      { status: 400 }
    );
  }

  const admin = await prisma.dealAdminUser.findUnique({ where: { email } });

  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    // Increment rate limit counter
    const entry = ATTEMPTS.get(ip) ?? { count: 0, resetAt: now + WINDOW_MS };
    entry.count++;
    ATTEMPTS.set(ip, entry);

    return NextResponse.json(
      { error: true, message: 'Invalid credentials' },
      { status: 401 }
    );
  }

  // Clear failed attempts on success
  ATTEMPTS.delete(ip);

  const token = await signAdminToken({
    sub:   String(admin.id),
    email: admin.email,
    role:  admin.role,
  });

  const response = NextResponse.json({ ok: true, email: admin.email });
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
