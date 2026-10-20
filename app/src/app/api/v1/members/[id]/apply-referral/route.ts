import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma, runTransactionWithRetry } from '@/lib/prisma';
import { normalizeMemberData } from '@/lib/dataNormalizer';
import { addSecurityHeaders } from '@/lib/security';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { id: memberId } = await params;
    const body = await request.json();
    const referralCode = String(body.referral_code ?? '').trim().toUpperCase();

    if (!referralCode) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Referral code required' }, { status: 400 }));
    }

    const result = await runTransactionWithRetry(async (tx) => {
      // 1. Fetch current member
      const member = await tx.member.findFirst({
        where: { id: memberId, merchantId },
        include: { membershipType: true },
      });

      if (!member) throw new Error('MEMBER_NOT_FOUND');

      if (member.referredByMemberId) {
        throw new Error('ALREADY_REFERRED');
      }

      // 2. Fetch referrer by referral code
      const referrer = await tx.member.findFirst({
        where: { referralCode, merchantId },
      });

      if (!referrer) throw new Error('INVALID_REFERRAL_CODE');

      if (referrer.id === member.id) {
        throw new Error('CANNOT_REFER_SELF');
      }

      // 3. Fetch merchant referral bonus points setting
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId },
        select: { referralBonusPoints: true },
      });
      const bonusPoints = merchant?.referralBonusPoints ? Number(merchant.referralBonusPoints) : 50;

      // 4. Update member with referrer link
      const updatedMember = await tx.member.update({
        where: { id: member.id },
        data: { referredByMemberId: referrer.id },
        include: { membershipType: true, offerStates: { include: { offerTemplate: true } } },
      });

      // 5. Reward referrer with loyalty points if bonus > 0
      if (bonusPoints > 0) {
        const updatedReferrer = await tx.member.update({
          where: { id: referrer.id },
          data: { loyaltyPoints: { increment: bonusPoints } },
        });

        await tx.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            memberId: referrer.id,
            merchantId,
            type: 'earn',
            points: bonusPoints,
            balanceAfter: Number(updatedReferrer.loyaltyPoints ?? 0),
            note: `Referral reward for enrolling ${member.name} (${member.memberCode})`,
          },
        });
      }

      return updatedMember;
    });

    return addSecurityHeaders(NextResponse.json(normalizeMemberData(result)));
  } catch (error: any) {
    if (error?.message === 'MEMBER_NOT_FOUND') {
      return addSecurityHeaders(NextResponse.json({ detail: 'Member not found' }, { status: 404 }));
    }
    if (error?.message === 'ALREADY_REFERRED') {
      return addSecurityHeaders(NextResponse.json({ detail: 'This member already has a referral applied' }, { status: 400 }));
    }
    if (error?.message === 'INVALID_REFERRAL_CODE') {
      return addSecurityHeaders(NextResponse.json({ detail: 'Invalid referral code' }, { status: 404 }));
    }
    if (error?.message === 'CANNOT_REFER_SELF') {
      return addSecurityHeaders(NextResponse.json({ detail: 'Member cannot refer themselves' }, { status: 400 }));
    }

    console.error('[members/[id]/apply-referral POST]', error);
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
