/** GET/PUT/DELETE /api/v1/offers/[id] */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  const offer = await prisma.offerTemplate.findFirst({
    where: { id, ...(merchantId ? { merchantId } : {}) },
    include: { membershipTypeLinks: { include: { membershipType: true } } },
  });
  if (!offer) return NextResponse.json({ detail: 'Offer not found' }, { status: 404 });
  return NextResponse.json(offer);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.offerTemplate.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      offerType: body.offer_type,
      value: body.value,
      active: body.active,
      loyaltyPointsEarn: body.loyalty_points_earn,
      isPointsRedemption: body.is_points_redemption,
      loyaltyPointsCost: body.loyalty_points_cost,
      minVisits: body.min_visits,
      minPurchaseAmount: body.min_purchase_amount,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  await prisma.offerTemplate.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ message: 'Offer deactivated' });
}
