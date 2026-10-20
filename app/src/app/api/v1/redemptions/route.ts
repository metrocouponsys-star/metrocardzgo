/**
 * POST /api/v1/redemptions — redeem an offer for a member
 * Port of Python redemptions.py redeem_offer
 * Handles: offer state deduction, loyalty points earning, LoyaltyTransaction audit trail
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma, runTransactionWithRetry } from '@/lib/prisma';
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

    // 3. Execute redemption inside atomic ACID transaction with automatic retry
    const result = await runTransactionWithRetry(async (tx) => {
      // Re-fetch offer state inside transaction to prevent race conditions
      const freshOfferState = await tx.memberOfferState.findFirst({
        where: { memberId: member_id, offerTemplateId: offer_template_id },
      });

      let updatedRemainingQty: number | null = null;
      if (freshOfferState) {
        if (freshOfferState.status === 'exhausted' || (freshOfferState.remainingQty !== null && Number(freshOfferState.remainingQty) <= 0)) {
          throw new Error('OFFER_EXHAUSTED');
        }

        // Deduct qty atomically
        if (freshOfferState.remainingQty !== null) {
          const updatedState = await tx.memberOfferState.updateMany({
            where: {
              id: freshOfferState.id,
              remainingQty: { gte: 1 },
              status: 'active',
            },
            data: {
              remainingQty: { decrement: 1 },
            },
          });
          if (updatedState.count === 0) {
            throw new Error('OFFER_EXHAUSTED');
          }
          const afterState = await tx.memberOfferState.findUnique({
            where: { id: freshOfferState.id },
          });
          const numQty = Number(afterState?.remainingQty ?? 0);
          if (numQty <= 0) {
            await tx.memberOfferState.update({
              where: { id: freshOfferState.id },
              data: { status: 'exhausted' },
            });
          }
          updatedRemainingQty = numQty;
        }
      }

      // 4. Log redemption
      const redemptionId = crypto.randomUUID();
      const redemptionRecord = await tx.redemptionLog.create({
        data: {
          id: redemptionId,
          memberId: member_id,
          offerTemplateId: offer_template_id,
          merchantUserId: auth.userId,
          amount: validAmount,
          ipAddress: request.headers.get('x-forwarded-for') ?? null,
        },
      });

      // 5. Credit loyalty points atomically if offer earns points
      let finalPoints = 0;
      let updatedVisits = 1;

      if (offer.loyaltyPointsEarn && Number(offer.loyaltyPointsEarn) > 0) {
        const earned = Number(offer.loyaltyPointsEarn);
        const updatedMember = await tx.member.update({
          where: { id: member_id },
          data: {
            loyaltyPoints: { increment: earned },
            totalVisits: { increment: 1 },
          },
        });
        finalPoints = Number(updatedMember.loyaltyPoints ?? 0);
        updatedVisits = Number(updatedMember.totalVisits ?? 1);

        await tx.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            memberId: member_id,
            merchantId,
            type: 'earn',
            points: earned,
            sourceRedemptionId: redemptionId,
            sourceOfferId: offer_template_id,
            balanceAfter: finalPoints,
            note: `Earned via ${offer.title}`,
          },
        });
      } else {
        const updatedMember = await tx.member.update({
          where: { id: member_id },
          data: { totalVisits: { increment: 1 } },
        });
        finalPoints = Number(updatedMember.loyaltyPoints ?? 0);
        updatedVisits = Number(updatedMember.totalVisits ?? 1);
      }

      return {
        id: redemptionId,
        member_id,
        offer_template_id,
        offer_state_id: freshOfferState?.id || null,
        amount: validAmount,
        created_at: redemptionRecord.createdAt ? new Date(redemptionRecord.createdAt).toISOString() : new Date().toISOString(),
        remaining_qty: updatedRemainingQty,
        loyalty_points: finalPoints,
        points_balance: finalPoints,
        total_visits: updatedVisits,
        offer: {
          id: offer.id,
          title: offer.title,
          offer_type: offer.offerType,
          description: offer.description,
        },
        member: {
          id: member.id,
          name: member.name,
          member_code: member.memberCode,
          loyalty_points: finalPoints,
        },
        message: 'Offer redeemed successfully',
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err?.message === 'OFFER_EXHAUSTED') {
      return NextResponse.json({ detail: 'Offer exhausted for this member' }, { status: 400 });
    }
    console.error('[redemptions POST]', err);
    const detail = process.env.NODE_ENV !== 'production'
      ? (err?.message || 'Transaction could not be completed')
      : 'Transaction could not be processed. Please retry or verify membership.';
    return NextResponse.json({ detail }, { status: 500 });
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
