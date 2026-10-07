import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const url = new URL(request.url);
  const memberId = url.searchParams.get('member_id') ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  const claims = await prisma.rewardClaim.findMany({
    where: {
      ...(merchantId ? { merchantId } : {}),
      ...(memberId ? { memberId } : {}),
    },
    include: {
      reward: true,
      member: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(claims);
}
