import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function generateRandomCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  try {
    const { value, quantity, expires_at } = await request.json();
    const qty = Math.min(Math.max(1, parseInt(quantity || '1')), 500);
    const voucherValue = Number(value || 0);

    if (voucherValue <= 0) {
      return NextResponse.json({ detail: 'Valid voucher value required' }, { status: 400 });
    }

    const expiresAt = expires_at ? new Date(expires_at) : null;
    const vouchersData: any[] = [];

    for (let i = 0; i < qty; i++) {
      vouchersData.push({
        id: crypto.randomUUID(),
        merchantId,
        code: `GV-${generateRandomCode(6)}`,
        value: voucherValue,
        expiresAt,
        isRedeemed: false,
      });
    }

    await prisma.giftVoucher.createMany({
      data: vouchersData,
    });

    const created = await prisma.giftVoucher.findMany({
      where: {
        id: { in: vouchersData.map(v => v.id) },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[vouchers/generate POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
