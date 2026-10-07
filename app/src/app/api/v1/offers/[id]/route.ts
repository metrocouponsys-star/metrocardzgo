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

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const offer = await prisma.offerTemplate.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
    include: { membershipTypeLinks: { include: { membershipType: true } } },
  });
  if (!offer) return NextResponse.json({ detail: 'Offer not found' }, { status: 404 });
  return NextResponse.json(offer);
}

async function handleUpdate(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.offerTemplate.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Offer not found' }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.offerTemplate.update({
    where: { id },
    data: {
      title: body.title !== undefined ? body.title : existing.title,
      description: body.description !== undefined ? body.description : existing.description,
      offerType: body.offer_type !== undefined ? body.offer_type : existing.offerType,
      value: body.value !== undefined ? body.value : existing.value,
      active: body.active !== undefined ? body.active : existing.active,
      loyaltyPointsEarn: body.loyalty_points_earn !== undefined ? body.loyalty_points_earn : existing.loyaltyPointsEarn,
      isPointsRedemption: body.is_points_redemption !== undefined ? body.is_points_redemption : existing.isPointsRedemption,
      loyaltyPointsCost: body.loyalty_points_cost !== undefined ? body.loyalty_points_cost : existing.loyaltyPointsCost,
      minVisits: body.min_visits !== undefined ? body.min_visits : existing.minVisits,
      minPurchaseAmount: body.min_purchase_amount !== undefined ? body.min_purchase_amount : existing.minPurchaseAmount,
    },
  });
  return NextResponse.json(updated);
}

export async function PUT(request: NextRequest, context: Params) {
  return handleUpdate(request, context);
}

export async function PATCH(request: NextRequest, context: Params) {
  return handleUpdate(request, context);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.offerTemplate.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Offer not found' }, { status: 404 });

  await prisma.offerTemplate.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ message: 'Offer deactivated' });
}
