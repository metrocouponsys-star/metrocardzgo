/** GET/POST /api/v1/coupons — CouponCode CRUD + validate */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const coupons = await prisma.couponCode.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(coupons);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();

  // Validate coupon (action=validate)
  if (body.action === 'validate') {
    const coupon = await prisma.couponCode.findFirst({
      where: { merchantId, code: body.code, isActive: true },
    });
    if (!coupon) return NextResponse.json({ valid: false, detail: 'Invalid coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, detail: 'Coupon expired' });
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, detail: 'Coupon usage limit reached' });
    }
    return NextResponse.json({ valid: true, coupon });
  }

  const coupon = await prisma.couponCode.create({
    data: {
      id: crypto.randomUUID(),
      merchantId,
      code: body.code,
      discountType: body.discount_type,
      value: body.value,
      minPurchase: body.min_purchase ?? 0,
      maxUses: body.max_uses ?? null,
      usedCount: 0,
      expiresAt: body.expires_at ? new Date(body.expires_at) : null,
      activeDays: body.active_days ?? null,
      isActive: body.is_active ?? true,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}
