/**
 * GET  /api/v1/admin/stats — super admin dashboard stats
 * Port of Python admin.py admin_stats
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalMerchants, totalMembers, activeMerchants, redemptionsToday, pendingApprovals] =
    await Promise.all([
      prisma.merchant.count(),
      prisma.member.count(),
      prisma.merchant.count({ where: { status: 'active' } }),
      prisma.redemptionLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.merchant.count({ where: { approvalStatus: 'pending' } }),
    ]);

  return NextResponse.json({
    total_merchants: totalMerchants,
    total_members: totalMembers,
    redemptions_today: redemptionsToday,
    active_merchants: activeMerchants,
    inactive_merchants: totalMerchants - activeMerchants,
    pending_approvals: pendingApprovals,
  });
}
