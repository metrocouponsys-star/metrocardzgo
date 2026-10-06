import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalMembers,
    activeToday,
    newMembersToday,
    redemptionsThisMonth,
    totalLoyaltyPoints,
    recentRedemptions,
  ] = await Promise.all([
    prisma.member.count({ where: { merchantId } }),
    prisma.redemptionLog.count({
      where: { member: { merchantId }, createdAt: { gte: todayStart } },
    }),
    prisma.member.count({
      where: { merchantId, createdAt: { gte: todayStart } },
    }),
    prisma.redemptionLog.count({
      where: { member: { merchantId }, createdAt: { gte: monthStart } },
    }),
    prisma.member.aggregate({
      where: { merchantId },
      _sum: { loyaltyPoints: true },
    }),
    prisma.redemptionLog.findMany({
      where: { member: { merchantId } },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        member: { select: { name: true, memberCode: true } },
        offerTemplate: { select: { title: true, offerType: true } },
      },
    }),
  ]);

  const mappedRecent = recentRedemptions.map((r: any) => ({
    id: r.id,
    member_id: r.memberId,
    member_name: r.member?.name || 'Customer',
    member_code: r.member?.memberCode || '',
    offer_name: r.offerTemplate?.title || 'Offer redeemed',
    offer_template_id: r.offerTemplateId,
    redeemed_at: r.createdAt.toISOString(),
    amount: Number(r.amount || 0),
    merchant_user_id: r.merchantUserId || '',
    created_at: r.createdAt.toISOString(),
  }));

  const totalPoints = Number(totalLoyaltyPoints._sum.loyaltyPoints ?? 0);

  return NextResponse.json({
    total_members: totalMembers,
    active_today: activeToday,
    new_members_today: newMembersToday,
    redemptions_this_month: redemptionsThisMonth,
    total_points_issued: totalPoints,
    total_loyalty_points_issued: totalPoints,
    recent_redemptions: mappedRecent,
  });
}
