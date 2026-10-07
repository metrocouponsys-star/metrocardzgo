import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  try {
    const body = await request.json();
    const { member_id, amount, points } = body;
    const pointsToRedeem = Number(points || amount || 0);

    if (pointsToRedeem <= 0 || isNaN(pointsToRedeem)) {
      return NextResponse.json({ detail: 'Valid positive points amount required' }, { status: 400 });
    }

    const member = await prisma.member.findFirst({
      where: { id: member_id, merchantId },
    });
    if (!member) return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
    if (member.status === 'expired' || member.status === 'deactivated') {
      return NextResponse.json({ detail: `Member is ${member.status}` }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const freshMember = await tx.member.findUniqueOrThrow({
        where: { id: member_id },
      });

      const currentPoints = Number(freshMember.loyaltyPoints ?? 0);
      if (currentPoints < pointsToRedeem) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      // Resolve or create points redemption offer template for this merchant
      let offerTemplateId = body.offer_template_id;
      if (!offerTemplateId) {
        const existingOffer = await tx.offerTemplate.findFirst({
          where: { merchantId, isPointsRedemption: true },
        }) || await tx.offerTemplate.findFirst({
          where: { merchantId },
        });

        if (existingOffer) {
          offerTemplateId = existingOffer.id;
        } else {
          const sysOffer = await tx.offerTemplate.create({
            data: {
              id: crypto.randomUUID(),
              merchantId,
              title: 'Points Redemption',
              offerType: 'points_redemption',
              isPointsRedemption: true,
              active: true,
            },
          });
          offerTemplateId = sysOffer.id;
        }
      }

      const newBalance = currentPoints - pointsToRedeem;
      await tx.member.update({
        where: { id: member_id },
        data: {
          loyaltyPoints: newBalance,
          totalVisits: { increment: 1 },
        },
      });

      const redemptionId = crypto.randomUUID();
      await tx.redemptionLog.create({
        data: {
          id: redemptionId,
          memberId: member_id,
          offerTemplateId,
          merchantUserId: auth.userId,
          amount: pointsToRedeem,
          ipAddress: request.headers.get('x-forwarded-for') ?? null,
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          id: crypto.randomUUID(),
          memberId: member_id,
          merchantId,
          type: 'redeem',
          points: -pointsToRedeem,
          sourceRedemptionId: redemptionId,
          balanceAfter: newBalance,
          note: `Points redemption: ${pointsToRedeem} points`,
        },
      });

      return {
        id: redemptionId,
        member_id,
        points_redeemed: pointsToRedeem,
        new_balance: newBalance,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err?.message === 'INSUFFICIENT_POINTS') {
      return NextResponse.json({ detail: 'Insufficient points balance' }, { status: 400 });
    }
    console.error('[redemptions/redeem-points POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
