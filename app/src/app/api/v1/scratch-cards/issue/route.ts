/** POST /api/v1/scratch-cards/issue?member_id=... */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const merchantId = getMerchantId(auth, request);
  const url = new URL(request.url);
  const memberId = url.searchParams.get('member_id');

  if (!memberId) {
    return NextResponse.json({ detail: 'member_id query param is required' }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
  }

  const rewards = [
    { type: 'points', value: '50' },
    { type: 'points', value: '100' },
    { type: 'points', value: '25' },
    { type: 'discount', value: '10% OFF next bill' },
  ];
  const selected = rewards[Math.floor(Math.random() * rewards.length)];

  const card = await prisma.scratchCard.create({
    data: {
      id: crypto.randomUUID(),
      merchantId: member.merchantId,
      memberId: member.id,
      rewardType: selected.type,
      rewardValue: selected.value,
      isRevealed: false,
      triggerVisit: member.totalVisits + 1,
    },
  });

  return NextResponse.json({
    id: card.id,
    merchant_id: card.merchantId,
    member_id: card.memberId,
    reward_type: card.rewardType,
    reward_value: card.rewardValue,
    is_revealed: card.isRevealed,
    revealed_at: null,
    trigger_visit: card.triggerVisit,
    created_at: card.createdAt.toISOString(),
  }, { status: 201 });
}
