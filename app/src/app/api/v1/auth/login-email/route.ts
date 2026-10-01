/** POST /api/v1/auth/login-email — email + password login */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/bcrypt';
import { buildLoginResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const user = await prisma.merchantUser.findUnique({
      where: { email: (email ?? '').trim().toLowerCase() },
    });
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ detail: 'Invalid email or password' }, { status: 401 });
    }
    return NextResponse.json(await buildLoginResponse(user.id));
  } catch (err) {
    console.error('[auth/login-email]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
