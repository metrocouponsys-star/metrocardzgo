import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  const member = await prisma.member.findFirst({
    where: {
      id,
      ...(auth.role !== 'super_admin' && merchantId ? { merchantId } : {}),
    },
    include: { merchant: true },
  });

  if (!member) {
    return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
  }

  // Ensure member has a referral code
  let referralCode = member.referralCode;
  if (!referralCode) {
    referralCode = (member.memberCode || id.slice(0, 8)).toUpperCase();
    await prisma.member.update({
      where: { id: member.id },
      data: { referralCode },
    }).catch(() => { });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://metrocardz.in';
  const referralLink = `${baseUrl}/join?ref=${encodeURIComponent(referralCode)}`;
  const bonusPoints = Number(member.merchant?.referralBonusPoints ?? 50);

  return NextResponse.json({
    referral_code: referralCode,
    referral_link: referralLink,
    bonus_points: bonusPoints,
  });
}
