/** POST /api/v1/scratch-cards/[id]/reveal */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const card = await prisma.scratchCard.findUnique({ where: { id } });
  if (!card) {
    return NextResponse.json({ detail: 'Scratch card not found' }, { status: 404 });
  }

  if (card.isRevealed) {
    return NextResponse.json({
      id: card.id,
      merchant_id: card.merchantId,
      member_id: card.memberId,
      reward_type: card.rewardType,
      reward_value: card.rewardValue,
      is_revealed: true,
      revealed_at: card.revealedAt?.toISOString(),
      trigger_visit: card.triggerVisit,
      created_at: card.createdAt.toISOString(),
    });
  }

  const now = new Date();
  // Atomic conditional update: only the first concurrent request reveals the card and credits points
  const updatedCount = await prisma.scratchCard.updateMany({
    where: { id, isRevealed: false },
    data: {
      isRevealed: true,
      revealedAt: now,
    },
  });

  const updated = await prisma.scratchCard.findUniqueOrThrow({ where: { id } });

  // Only credit points if this specific request won the reveal race (updatedCount.count === 1)
  if (updatedCount.count === 1 && updated.rewardType === 'points') {
    const pts = parseInt(updated.rewardValue, 10);
    if (!isNaN(pts) && pts > 0) {
      await prisma.member.update({
        where: { id: updated.memberId },
        data: {
          loyaltyPoints: { increment: pts },
        },
      }).catch(() => { });
    }
  }

  return NextResponse.json({
    id: updated.id,
    merchant_id: updated.merchantId,
    member_id: updated.memberId,
    reward_type: updated.rewardType,
    reward_value: updated.rewardValue,
    is_revealed: true,
    revealed_at: now.toISOString(),
    trigger_visit: updated.triggerVisit,
    created_at: updated.createdAt.toISOString(),
  });
}
