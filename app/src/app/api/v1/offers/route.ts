/** GET/POST/PUT/DELETE /api/v1/offers — OfferTemplate CRUD */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const offers = await prisma.offerTemplate.findMany({
    where: { merchantId },
    include: { membershipTypeLinks: { include: { membershipType: true } } },
    orderBy: { title: 'asc' },
  });
  return NextResponse.json(offers);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();
  const offerId = crypto.randomUUID();

  const offer = await prisma.offerTemplate.create({
    data: {
      id: offerId,
      merchantId,
      title: body.title,
      description: body.description ?? '',
      offerType: body.offer_type,
      value: body.value ?? 0,
      active: body.active ?? true,
      loyaltyPointsEarn: body.loyalty_points_earn ?? null,
      isPointsRedemption: body.is_points_redemption ?? false,
      loyaltyPointsCost: body.loyalty_points_cost ?? null,
      minVisits: body.min_visits ?? null,
      minPurchaseAmount: body.min_purchase_amount ?? null,
    },
  });

  // Link to membership types if provided
  if (body.applicable_membership_type_ids?.length) {
    await prisma.membershipTypeOffer.createMany({
      data: body.applicable_membership_type_ids.map((mtId: string) => ({
        membershipTypeId: mtId,
        offerTemplateId: offerId,
        defaultQty: body.default_qty ?? null,
      })),
      skipDuplicates: true,
    });

    // Auto-sync to existing members of those membership types
    const members = await prisma.member.findMany({
      where: { merchantId, membershipTypeId: { in: body.applicable_membership_type_ids } },
    });
    if (members.length > 0) {
      await prisma.memberOfferState.createMany({
        data: members.map(m => ({
          memberId: m.id,
          offerTemplateId: offerId,
          remainingQty: body.default_qty ?? null,
          initialQty: body.default_qty ?? null,
          status: 'active' as const,
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json(offer, { status: 201 });
}
