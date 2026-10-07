import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const { id: rewardId } = await params;
  const url = new URL(request.url);

  let memberId = url.searchParams.get('member_id');
  if (!memberId) {
    try {
      const body = await request.json();
      memberId = body.member_id;
    } catch {}
  }

  if (!memberId) {
    return NextResponse.json({ detail: 'Member ID required' }, { status: 400 });
  }

  try {
    const claimResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch reward with ownership check
      const reward = await tx.rewardCatalog.findFirst({
        where: { id: rewardId, merchantId, isActive: true },
      });
      if (!reward) throw new Error('REWARD_NOT_FOUND');

      if (reward.quantityAvailable !== null && reward.quantityAvailable <= 0) {
        throw new Error('REWARD_OUT_OF_STOCK');
      }

      // 2. Fetch member with fresh points balance
      const member = await tx.member.findFirst({
        where: { id: memberId, merchantId },
      });
      if (!member) throw new Error('MEMBER_NOT_FOUND');
      if (member.status === 'expired' || member.status === 'deactivated') {
        throw new Error('MEMBER_INACTIVE');
      }

      const pointsCost = Number(reward.pointsCost);
      const currentPoints = Number(member.loyaltyPoints ?? 0);

      if (currentPoints < pointsCost) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      // 3. Deduct points atomically
      const newBalance = currentPoints - pointsCost;
      await tx.member.update({
        where: { id: member.id },
        data: {
          loyaltyPoints: newBalance,
          totalVisits: { increment: 1 },
        },
      });

      // 4. Record RewardClaim
      const claim = await tx.rewardClaim.create({
        data: {
          id: crypto.randomUUID(),
          rewardId: reward.id,
          memberId: member.id,
          merchantId,
          pointsSpent: pointsCost,
        },
        include: {
          reward: true,
          member: { select: { id: true, name: true, phone: true } },
        },
      });

      // 5. Create immutable LoyaltyTransaction audit record
      await tx.loyaltyTransaction.create({
        data: {
          id: crypto.randomUUID(),
          memberId: member.id,
          merchantId,
          type: 'redeem',
          points: -pointsCost,
          balanceAfter: newBalance,
          note: `Claimed: ${reward.name}`,
        },
      });

      // 6. Decrement inventory if applicable
      if (reward.quantityAvailable !== null) {
        await tx.rewardCatalog.update({
          where: { id: reward.id },
          data: { quantityAvailable: { decrement: 1 } },
        });
      }

      return claim;
    });

    return NextResponse.json({
      message: 'Reward claimed successfully',
      claim: claimResult,
    }, { status: 201 });
  } catch (err: any) {
    if (err?.message === 'REWARD_NOT_FOUND') {
      return NextResponse.json({ detail: 'Reward not found or inactive' }, { status: 404 });
    }
    if (err?.message === 'REWARD_OUT_OF_STOCK') {
      return NextResponse.json({ detail: 'Reward is out of stock' }, { status: 400 });
    }
    if (err?.message === 'MEMBER_NOT_FOUND') {
      return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
    }
    if (err?.message === 'MEMBER_INACTIVE') {
      return NextResponse.json({ detail: 'Member is inactive or expired' }, { status: 403 });
    }
    if (err?.message === 'INSUFFICIENT_POINTS') {
      return NextResponse.json({ detail: 'Insufficient loyalty points balance' }, { status: 400 });
    }
    console.error('[rewards/claim POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
