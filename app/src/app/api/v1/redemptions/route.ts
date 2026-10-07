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
    const { member_id, amount } = body;
    let offer_template_id = body.offer_template_id;
    const offer_state_id = body.offer_state_id;

    if (!member_id) {
      return NextResponse.json({ detail: 'Member ID required' }, { status: 400 });
    }

    // If offer_state_id was provided instead of offer_template_id (e.g. from realClient)
    if (!offer_template_id && offer_state_id) {
      const stateLookup = await prisma.memberOfferState.findUnique({
        where: { id: offer_state_id },
      });
      if (stateLookup) {
        offer_template_id = stateLookup.offerTemplateId;
      }
    }

    if (!offer_template_id) {
      return NextResponse.json({ detail: 'Offer Template ID or Offer State ID required' }, { status: 400 });
    }

    // 1. Fetch member and verify belongs to merchant
    const member = await prisma.member.findFirst({
      where: { id: member_id, merchantId },
    });
    if (!member) return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
    if (member.status === 'expired' || member.status === 'deactivated') {
      return NextResponse.json({ detail: `Member membership is ${member.status}` }, { status: 403 });
    }

    // 2. Fetch offer template
    const offer = await prisma.offerTemplate.findFirst({
      where: { id: offer_template_id, merchantId, active: true },
    });
    if (!offer) return NextResponse.json({ detail: 'Offer not found or inactive' }, { status: 404 });

    // Validate amount (must be positive finite number or null)
    const validAmount = amount !== undefined && amount !== null && !isNaN(Number(amount)) && Number(amount) >= 0
      ? Number(amount)
      : null;

    // 3. Execute redemption inside atomic ACID transaction to prevent double spending
    await prisma.$transaction(async (tx) => {
      // Re-fetch offer state inside transaction to prevent race conditions
      const freshOfferState = await tx.memberOfferState.findFirst({
        where: { memberId: member_id, offerTemplateId: offer_template_id },
      });

      if (freshOfferState) {
        if (freshOfferState.status === 'exhausted' || (freshOfferState.remainingQty !== null && Number(freshOfferState.remainingQty) <= 0)) {
          throw new Error('OFFER_EXHAUSTED');
        }

        // Deduct qty
        if (freshOfferState.remainingQty !== null) {
          const newQty = Number(freshOfferState.remainingQty) - 1;
          await tx.memberOfferState.update({
            where: { id: freshOfferState.id },
            data: {
              remainingQty: newQty,
              status: newQty <= 0 ? 'exhausted' : 'active',
            },
          });
        }
      }

      // 4. Log redemption
      const redemptionId = crypto.randomUUID();
      await tx.redemptionLog.create({
        data: {
          id: redemptionId,
          memberId: member_id,
          offerTemplateId: offer_template_id,
          merchantUserId: auth.userId,
          amount: validAmount,
          ipAddress: request.headers.get('x-forwarded-for') ?? null,
        },
      });

      // 5. Credit loyalty points if offer earns points (read fresh member balance inside transaction)
      const freshMember = await tx.member.findUniqueOrThrow({
        where: { id: member_id },
      });

      if (offer.loyaltyPointsEarn && Number(offer.loyaltyPointsEarn) > 0) {
        const currentPoints = Number(freshMember.loyaltyPoints ?? 0);
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
  } catch (err: any) {
    if (err?.message === 'OFFER_EXHAUSTED') {
      return NextResponse.json({ detail: 'Offer exhausted for this member' }, { status: 400 });
    }
    console.error('[redemptions POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  // Guard: non-super-admin must always have a merchantId
  if (!merchantId && auth.role !== 'super_admin') {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

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
