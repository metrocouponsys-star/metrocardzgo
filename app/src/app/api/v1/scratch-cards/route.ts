/** GET /api/v1/scratch-cards?member_id=... */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const merchantId = getMerchantId(auth, request);
  const url = new URL(request.url);
  const memberId = url.searchParams.get('member_id');

  try {
    const cards = await prisma.scratchCard.findMany({
      where: {
        ...(merchantId && auth.role !== 'super_admin' ? { merchantId } : {}),
        ...(memberId ? { memberId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Map to snake_case for frontend
    const mapped = cards.map(c => ({
      id: c.id,
      merchant_id: c.merchantId,
      member_id: c.memberId,
      reward_type: c.rewardType,
      reward_value: c.rewardValue,
      is_revealed: c.isRevealed,
      revealed_at: c.revealedAt?.toISOString() || null,
      trigger_visit: c.triggerVisit,
      created_at: c.createdAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error('[scratch-cards/get]', err);
    return NextResponse.json([], { status: 200 });
  }
}
