/**
 * POST /api/v1/redemptions — redeem an offer for a member
 * Port of Python redemptions.py redeem_offer
 * Handles: offer state deduction, loyalty points earning, LoyaltyTransaction audit trail
 */
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
    const { member_id, offer_template_id, amount } = body;

    // 1. Fetch member and verify belongs to merchant
    const member = await prisma.member.findFirst({
      where: { id: member_id, merchantId },
    });
    if (!member) return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
    if (member.status === 'expired') {
      return NextResponse.json({ detail: 'Member membership has expired' }, { status: 403 });
    }

    // 2. Fetch offer template
    const offer = await prisma.offerTemplate.findFirst({
      where: { id: offer_template_id, merchantId, active: true },
    });
    if (!offer) return NextResponse.json({ detail: 'Offer not found or inactive' }, { status: 404 });

    // 3. Check offer state (qty remaining)
    const offerState = await prisma.memberOfferState.findFirst({
      where: { memberId: member_id, offerTemplateId: offer_template_id },
    });
    if (offerState?.status === 'exhausted') {
      return NextResponse.json({ detail: 'Offer exhausted for this member' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 4. Log redemption
      const redemptionId = crypto.randomUUID();
      await tx.redemptionLog.create({
        data: {
          id: redemptionId,
          memberId: member_id,
          offerTemplateId: offer_template_id,
          merchantUserId: auth.userId,
          amount: amount ? parseFloat(amount) : null,
          ipAddress: request.headers.get('x-forwarded-for') ?? null,
        },
      });

      // 5. Deduct qty if applicable
      if (offerState && offerState.remainingQty !== null) {
        const newQty = Number(offerState.remainingQty) - 1;
        await tx.memberOfferState.update({
          where: { id: offerState.id },
          data: {
            remainingQty: newQty,
            status: newQty <= 0 ? 'exhausted' : 'active',
          },
        });
      }

      // 6. Credit loyalty points if offer earns points
      if (offer.loyaltyPointsEarn && Number(offer.loyaltyPointsEarn) > 0) {
        const currentPoints = Number(member.loyaltyPoints ?? 0);
        const earned = Number(offer.loyaltyPointsEarn);
        const newBalance = currentPoints + earned;

        await tx.member.update({
          where: { id: member_id },
          data: { loyaltyPoints: newBalance, totalVisits: { increment: 1 } },
        });
        await tx.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            memberId: member_id,
            merchantId,
            type: 'earn',
            points: earned,
            sourceRedemptionId: redemptionId,
            sourceOfferId: offer_template_id,
            balanceAfter: newBalance,
            note: `Earned via ${offer.title}`,
          },
        });
      } else {
        // Still increment visit count
        await tx.member.update({
          where: { id: member_id },
          data: { totalVisits: { increment: 1 } },
        });
      }
    });

    return NextResponse.json({ message: 'Offer redeemed successfully' }, { status: 201 });
  } catch (err) {
    console.error('[redemptions POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);

  const url = new URL(request.url);
  const memberId = url.searchParams.get('member_id') ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  const redemptions = await prisma.redemptionLog.findMany({
    where: {
      ...(memberId ? { memberId } : {}),
      member: merchantId ? { merchantId } : undefined,
    },
    include: { member: { select: { name: true, phone: true } }, offerTemplate: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
  return NextResponse.json(redemptions);
}
