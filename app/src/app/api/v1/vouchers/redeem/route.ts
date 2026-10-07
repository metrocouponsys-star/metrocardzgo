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
    const { code, member_id } = await request.json();
    if (!code) {
      return NextResponse.json({ detail: 'Voucher code required' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toUpperCase();

    // 1. Check member if provided
    if (member_id) {
      const member = await prisma.member.findFirst({
        where: { id: member_id, merchantId },
      });
      if (!member) {
        return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
      }
    }

    // 2. Perform redemption in ACID transaction to prevent double spending
    const redeemed = await prisma.$transaction(async (tx) => {
      const voucher = await tx.giftVoucher.findFirst({
        where: {
          merchantId,
          code: cleanCode,
        },
      });

      if (!voucher) {
        throw new Error('VOUCHER_NOT_FOUND');
      }

      if (voucher.isRedeemed) {
        throw new Error('ALREADY_REDEEMED');
      }

      if (voucher.expiresAt && voucher.expiresAt < new Date()) {
        throw new Error('VOUCHER_EXPIRED');
      }

      const updated = await tx.giftVoucher.update({
        where: { id: voucher.id },
        data: {
          isRedeemed: true,
          redeemedByMemberId: member_id || null,
        },
        include: {
          redeemedBy: { select: { id: true, name: true, phone: true } },
        },
      });

      // If member provided, record visit and audit trail
      if (member_id) {
        await tx.member.update({
          where: { id: member_id },
          data: { totalVisits: { increment: 1 } },
        });

        await tx.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            memberId: member_id,
            merchantId,
            type: 'earn',
            points: 0,
            balanceAfter: 0,
            note: `Redeemed Gift Voucher ₹${voucher.value} (${voucher.code})`,
          },
        });
      }

      return updated;
    });

    return NextResponse.json(redeemed);
  } catch (err: any) {
    if (err?.message === 'VOUCHER_NOT_FOUND') {
      return NextResponse.json({ detail: 'Invalid voucher code' }, { status: 404 });
    }
    if (err?.message === 'ALREADY_REDEEMED') {
      return NextResponse.json({ detail: 'This voucher has already been redeemed' }, { status: 400 });
    }
    if (err?.message === 'VOUCHER_EXPIRED') {
      return NextResponse.json({ detail: 'This voucher has expired' }, { status: 400 });
    }
    console.error('[vouchers/redeem POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
