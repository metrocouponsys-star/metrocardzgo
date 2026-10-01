/**
 * POST /api/v1/auth/login
 * Phone + password login (exact port of Python auth.py /login)
 * Supports fuzzy phone matching: exact, digits-only, last-10 digits.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/bcrypt';
import { buildLoginResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone: string = (body.phone ?? '').trim();
    const password: string = body.password ?? '';

    const digitsOnly = rawPhone.replace(/\D/g, '');
    const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    // Fuzzy phone search — same logic as Python backend
    const user =
      (await prisma.merchantUser.findFirst({ where: { phone: rawPhone } })) ??
      (await prisma.merchantUser.findFirst({ where: { phone: digitsOnly } })) ??
      (await prisma.merchantUser.findFirst({
        where: { phone: { endsWith: last10 } },
      }));

    if (!user || !user.passwordHash) {
      return NextResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
    }

    const digitsOnlyPwd = password.replace(/\D/g, '');
    const last10Pwd = digitsOnlyPwd.length >= 10 ? digitsOnlyPwd.slice(-10) : '';

    const valid =
      (await verifyPassword(password, user.passwordHash)) ||
      (digitsOnlyPwd && (await verifyPassword(digitsOnlyPwd, user.passwordHash))) ||
      (last10Pwd && (await verifyPassword(last10Pwd, user.passwordHash)));

    if (!valid) {
      return NextResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
    }

    const response = await buildLoginResponse(user.id);
    return NextResponse.json(response);
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
