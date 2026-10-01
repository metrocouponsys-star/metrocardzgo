/** GET /api/v1/auth/me — return current user profile */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const user = await prisma.merchantUser.findUnique({
    where: { id: auth.userId },
    include: { merchant: { select: { businessName: true } } },
  });
  if (!user) return NextResponse.json({ detail: 'User not found' }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    merchant_id: user.merchantId,
    merchant_name: user.merchant?.businessName ?? null,
  });
}

/** POST /api/v1/auth/logout — stateless logout */
export async function POST() {
  return NextResponse.json({ message: 'Logged out successfully' });
}
