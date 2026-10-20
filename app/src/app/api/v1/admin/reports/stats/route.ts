import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(request.url);
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');

    const dateFilter = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
    const hasDate = Boolean(dateFrom || dateTo);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRedemptions,
      totalMembers,
      activeMerchants,
      newMembersThisMonth,
      pointsEarnedAgg,
      pointsRedeemedAgg,
    ] = await Promise.all([
      prisma.redemptionLog.count({
        where: hasDate ? { createdAt: dateFilter } : undefined,
      }),
      prisma.member.count({
        where: hasDate ? { createdAt: dateFilter } : undefined,
      }),
      prisma.merchant.count({
        where: { status: 'active' },
      }),
      prisma.member.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.loyaltyTransaction.aggregate({
        _sum: { points: true },
        where: {
          type: 'earn',
          ...(hasDate ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.loyaltyTransaction.aggregate({
        _sum: { points: true },
        where: {
          type: 'redeem',
          ...(hasDate ? { createdAt: dateFilter } : {}),
        },
      }),
    ]);

    const totalPointsIssued = Number(pointsEarnedAgg._sum.points || 0);
    const totalPointsRedeemed = Math.abs(Number(pointsRedeemedAgg._sum.points || 0));

    return addSecurityHeaders(
      NextResponse.json({
        total_redemptions: totalRedemptions,
        total_members: totalMembers,
        active_merchants: activeMerchants,
        new_members_this_month: newMembersThisMonth,
        total_points_issued: totalPointsIssued,
        total_points_redeemed: totalPointsRedeemed,
      })
    );
  } catch (err: any) {
    console.error('[admin/reports/stats GET]', err);
    return addSecurityHeaders(
      NextResponse.json({ detail: err?.message || 'Server error' }, { status: 500 })
    );
  }
}
