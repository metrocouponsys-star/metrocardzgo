import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

async function handleUpdate(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.couponCode.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Coupon not found' }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.couponCode.update({
    where: { id },
    data: {
      code: body.code !== undefined ? String(body.code).trim().toUpperCase() : existing.code,
      discountType: body.discount_type !== undefined ? body.discount_type : existing.discountType,
      value: body.value !== undefined ? body.value : existing.value,
      minPurchase: body.min_purchase !== undefined ? body.min_purchase : existing.minPurchase,
      maxUses: body.max_uses !== undefined ? body.max_uses : existing.maxUses,
      expiresAt: body.expires_at !== undefined ? (body.expires_at ? new Date(body.expires_at) : null) : existing.expiresAt,
      activeDays: body.active_days !== undefined ? body.active_days : existing.activeDays,
      isActive: body.is_active !== undefined ? body.is_active : existing.isActive,
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

  const existing = await prisma.couponCode.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Coupon not found' }, { status: 404 });

  await prisma.couponCode.delete({ where: { id } });
  return NextResponse.json({ message: 'Coupon deleted successfully' });
}
