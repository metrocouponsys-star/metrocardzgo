/** POST /api/v1/auth/login-email — email + password login */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/bcrypt';
import { buildLoginResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ detail: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.merchantUser.findUnique({
      where: { email: (email as string).trim().toLowerCase() },
    });
    if (!user || !user.passwordHash || !(await verifyPassword(password as string, user.passwordHash))) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 });
    }
    const loginRes = await buildLoginResponse(user.id);
    if (!loginRes) {
      return NextResponse.json({ detail: 'User account error' }, { status: 500 });
    }
    return NextResponse.json(loginRes);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    // Also capture cause chain (Prisma wraps DB errors)
    const causeMsg = (err instanceof Error && err.cause instanceof Error)
      ? err.cause.message : '';
    const fullMsg = `${errMsg} ${causeMsg}`.toLowerCase();

    // Categorise the error for easier diagnosis in Hostinger logs
    if (
      fullMsg.includes('connect') ||
      fullMsg.includes('econnrefused') ||
      fullMsg.includes('access denied') ||
      fullMsg.includes('enotfound')
    ) {
      console.error('[auth/login-email] DATABASE CONNECTION ERROR:', errMsg);
      return NextResponse.json(
        { detail: 'Database connection failed. Check DATABASE_URL env var on Hostinger hPanel.' },
        { status: 503 }
      );
    }
    if (
      fullMsg.includes('unknown column') ||
      fullMsg.includes("unknown field `email`") ||
      fullMsg.includes('card_design_url') ||
      fullMsg.includes('column') ||
      fullMsg.includes('field')
    ) {
      console.error('[auth/login-email] SCHEMA MISMATCH — column missing in live DB:', errMsg);
      return NextResponse.json(
        { detail: 'Database schema out of date. Run HOSTINGER_LOGIN_FIX.sql in phpMyAdmin.' },
        { status: 503 }
      );
    }

    console.error('[auth/login-email] UNEXPECTED ERROR:', errMsg);
    return NextResponse.json({ detail: 'Internal server error', hint: errMsg }, { status: 500 });
  }
}
