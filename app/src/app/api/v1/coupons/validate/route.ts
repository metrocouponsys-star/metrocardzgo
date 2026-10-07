import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  try {
    const { code, purchase_amount } = await request.json();
    if (!code) {
      return NextResponse.json({ valid: false, detail: 'Coupon code required' }, { status: 400 });
    }

    const coupon = await prisma.couponCode.findFirst({
      where: {
        merchantId,
        code: String(code).trim().toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, detail: 'Invalid coupon code' });
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, detail: 'Coupon has expired' });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, detail: 'Coupon usage limit reached' });
    }

    const purchaseVal = Number(purchase_amount || 0);
    if (coupon.minPurchase && purchaseVal < Number(coupon.minPurchase)) {
      return NextResponse.json({
        valid: false,
        detail: `Minimum purchase amount of ₹${coupon.minPurchase} required`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = Math.round((purchaseVal * Number(coupon.value)) / 100);
    } else {
      discountAmount = Math.min(purchaseVal, Number(coupon.value));
    }

    return NextResponse.json({
      valid: true,
      coupon,
      discount_amount: discountAmount,
      final_amount: Math.max(0, purchaseVal - discountAmount),
    });
  } catch (err) {
    console.error('[coupons/validate POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
