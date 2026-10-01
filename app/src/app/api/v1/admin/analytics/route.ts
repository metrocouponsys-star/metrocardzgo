/**
 * GET /api/v1/admin/analytics
 * Platform-wide analytics for super admin.
 *
 * Returns:
 *   - Total members, active/expired breakdown
 *   - Total merchants, active/inactive
 *   - Redemptions last 30d / 7d / today
 *   - Points issued last 30d (loyalty proxy)
 *   - Top 10 merchants by redemptions
 *   - New member trend (last 30 days daily)
 *   - Redemption trend (last 30 days daily)
 *
 * Auth: super_admin only
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if ((auth as any).role !== 'super_admin') {
    return NextResponse.json({ detail: 'Forbidden' }, { status: 403 });
  }

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7  = new Date(today.getTime() - 6  * 86400_000);
  const last30 = new Date(today.getTime() - 29 * 86400_000);

  // Run all queries in parallel for speed
  const [
    totalMembers,
    activeMembers,
    expiredMembers,
    totalMerchants,
    activeMerchants,
    redemptionsToday,
    redemptionsLast7d,
    redemptionsLast30d,
    pointsIssuedLast30d,
    topMerchants,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { status: 'active'  } }),
    prisma.member.count({ where: { status: 'expired' } }),
    prisma.merchant.count(),
    prisma.merchant.count({ where: { status: 'active'  } }),

    prisma.redemptionLog.count({ where: { createdAt: { gte: today  } } }),
    prisma.redemptionLog.count({ where: { createdAt: { gte: last7  } } }),
    prisma.redemptionLog.count({ where: { createdAt: { gte: last30 } } }),

    prisma.loyaltyTransaction.aggregate({
      _sum: { points: true },
      where: { type: 'earn', createdAt: { gte: last30 } },
    }),

    // Top 10 merchants by redemption count (last 30d)
    prisma.redemptionLog.groupBy({
      by: ['merchantUserId'],
      _count: { id: true },
      where: { createdAt: { gte: last30 } },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  // Daily trends via raw SQL (MySQL-compatible)
  const [newMembersTrend, redemptionsTrend] = await Promise.all([
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM members
      WHERE created_at >= ${last30}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM redemption_log
      WHERE created_at >= ${last30}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
  ]);

  // Enrich top merchant users with merchant info
  const userIds = topMerchants.map(m => m.merchantUserId);
  const merchantUsers = await prisma.merchantUser.findMany({
    where: { id: { in: userIds } },
    select: { id: true, merchantId: true, merchant: { select: { businessName: true, logoUrl: true } } },
  });
  const userMap = Object.fromEntries(merchantUsers.map(u => [u.id, u]));

  const topMerchantsEnriched = topMerchants.map(r => ({
    merchantUserId: r.merchantUserId,
    redemptions: r._count.id,
    merchant: userMap[r.merchantUserId]?.merchant ?? { name: 'Unknown' },
  }));

  // Serialize BigInt for JSON
  const serialize = (rows: Array<{ date: string; count: bigint }>) =>
    rows.map(r => ({ date: r.date, count: Number(r.count) }));

  return NextResponse.json({
    overview: {
      totalMembers,
      activeMembers,
      expiredMembers,
      inactiveMembers: totalMembers - activeMembers - expiredMembers,
      totalMerchants,
      activeMerchants,
    },
    redemptions: {
      today:   redemptionsToday,
      last7d:  redemptionsLast7d,
      last30d: redemptionsLast30d,
    },
    loyalty: {
      pointsIssuedLast30d: Number(pointsIssuedLast30d._sum.points ?? 0),
    },
    topMerchants: topMerchantsEnriched,
    trends: {
      newMembers:  serialize(newMembersTrend),
      redemptions: serialize(redemptionsTrend),
    },
  });
}
