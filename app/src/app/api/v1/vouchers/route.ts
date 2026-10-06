import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const vouchers = await prisma.giftVoucher.findMany({
    where: { merchantId },
    include: {
      redeemedBy: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(vouchers);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();

  const voucher = await prisma.giftVoucher.create({
    data: {
      id: crypto.randomUUID(),
      merchantId,
      code: body.code,
      value: body.value,
      expiresAt: body.expires_at ? new Date(body.expires_at) : null,
      isRedeemed: false,
    },
  });

  return NextResponse.json(voucher, { status: 201 });
}
