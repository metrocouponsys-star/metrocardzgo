/** GET/POST /api/v1/rewards — RewardCatalog CRUD + claim */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const rewards = await prisma.rewardCatalog.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(rewards);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();

  // If action=claim, redeem a reward
  if (body.action === 'claim') {
    const reward = await prisma.rewardCatalog.findFirst({
      where: { id: body.reward_id, merchantId, isActive: true },
    });
    if (!reward) return NextResponse.json({ detail: 'Reward not found' }, { status: 404 });

    const member = await prisma.member.findFirst({
      where: { id: body.member_id, merchantId },
    });
    if (!member) return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
    if (Number(member.loyaltyPoints ?? 0) < Number(reward.pointsCost)) {
      return NextResponse.json({ detail: 'Insufficient loyalty points' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const newBalance = Number(member.loyaltyPoints) - Number(reward.pointsCost);
      await tx.member.update({ where: { id: member.id }, data: { loyaltyPoints: newBalance } });
      await tx.rewardClaim.create({
        data: {
          id: crypto.randomUUID(),
          rewardId: reward.id,
          memberId: member.id,
          merchantId,
          pointsSpent: reward.pointsCost,
        },
      });
      await tx.loyaltyTransaction.create({
        data: {
          id: crypto.randomUUID(),
          memberId: member.id,
          merchantId,
          type: 'redeem',
          points: -Number(reward.pointsCost),
          sourceOfferId: null,
          balanceAfter: newBalance,
          note: `Redeemed: ${reward.name}`,
        },
      });
      if (reward.quantityAvailable !== null) {
        await tx.rewardCatalog.update({
          where: { id: reward.id },
          data: { quantityAvailable: { decrement: 1 } },
        });
      }
    });
    return NextResponse.json({ message: 'Reward claimed successfully' });
  }

  const reward = await prisma.rewardCatalog.create({
    data: {
      id: crypto.randomUUID(),
      merchantId,
      name: body.name,
      description: body.description ?? '',
      pointsCost: body.points_cost,
      quantityAvailable: body.quantity_available ?? null,
      isActive: body.is_active ?? true,
    },
  });
  return NextResponse.json(reward, { status: 201 });
}
