/** GET /api/v1/dashboard — merchant dashboard stats + chart data */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const expiryWarningDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalMembers,
    activeMembers,
    expiringMembers,
    expiredMembers,
    redemptionsToday,
    totalRedemptions,
    newMembersThisMonth,
    totalLoyaltyPoints,
  ] = await Promise.all([
    prisma.member.count({ where: { merchantId } }),
    prisma.member.count({ where: { merchantId, status: 'active' } }),
    prisma.member.count({
      where: { merchantId, expiryDate: { gte: todayStart, lte: expiryWarningDate } },
    }),
    prisma.member.count({ where: { merchantId, status: 'expired' } }),
    prisma.redemptionLog.count({
      where: { member: { merchantId }, createdAt: { gte: todayStart } },
    }),
    prisma.redemptionLog.count({ where: { member: { merchantId } } }),
    prisma.member.count({ where: { merchantId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.member.aggregate({
      where: { merchantId },
      _sum: { loyaltyPoints: true },
    }),
  ]);

  // Top 5 members by loyalty points
  const topMembers = await prisma.member.findMany({
    where: { merchantId },
    orderBy: { loyaltyPoints: 'desc' },
    take: 5,
    select: { id: true, name: true, phone: true, loyaltyPoints: true, totalVisits: true },
  });

  return NextResponse.json({
    total_members: totalMembers,
    active_members: activeMembers,
    expiring_members: expiringMembers,
    expired_members: expiredMembers,
    redemptions_today: redemptionsToday,
    total_redemptions: totalRedemptions,
    new_members_this_month: newMembersThisMonth,
    total_loyalty_points_issued: totalLoyaltyPoints._sum.loyaltyPoints ?? 0,
    top_members: topMembers,
  });
}
