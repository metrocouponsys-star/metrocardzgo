/** POST /api/v1/auth/login-email — email + password login */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/bcrypt';
import { buildLoginResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ detail: 'Email and password are required' }, { status: 400 });
    }

    // Step 1 — look up user by email
    let user;
    try {
      user = await prisma.merchantUser.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error('[login-email] DB error on findUnique:', msg);
      return NextResponse.json(
        {
          detail: 'Database error during login',
          hint: msg,
          action: 'Check /api/v1/health to diagnose. Run HOSTINGER_LOGIN_FIX.sql in phpMyAdmin.',
        },
        { status: 503 }
      );
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 });
    }

    // Step 2 — verify password
    const passwordOk = await verifyPassword(password, user.passwordHash).catch(() => false);
    if (!passwordOk) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 });
    }

    // Step 3 — build JWT response (includes merchant lookup)
    let loginRes;
    try {
      loginRes = await buildLoginResponse(user.id);
    } catch (authErr) {
      const msg = authErr instanceof Error ? authErr.message : String(authErr);
      console.error('[login-email] Error in buildLoginResponse:', msg);
      return NextResponse.json(
        {
          detail: 'Error building login response',
          hint: msg,
          action: 'Check /api/v1/health. Run HOSTINGER_LOGIN_FIX.sql if column errors.',
        },
        { status: 503 }
      );
    }

    if (!loginRes) {
      return NextResponse.json({ detail: 'User account error' }, { status: 500 });
    }

    return NextResponse.json(loginRes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[login-email] Uncaught error:', msg);
    return NextResponse.json(
      {
        detail: 'Internal server error',
        hint: msg,
        action: 'Visit /api/v1/health for diagnostics.',
      },
      { status: 500 }
    );
  }
}
