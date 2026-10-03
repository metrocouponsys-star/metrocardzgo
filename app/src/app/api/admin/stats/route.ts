/**
 * GET /api/admin/stats
 * Cookie-authenticated stats for the deals admin dashboard.
 * Returns basic platform counts — no sensitive PII.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, DEALS_ADMIN_COOKIE } from '@/lib/dealsAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Validate cookie session
  const token = request.cookies.get(DEALS_ADMIN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: true, message: 'Not authenticated' }, { status: 401 });
  }
  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ error: true, message: 'Session expired' }, { status: 401 });
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalMerchants,
      totalMembers,
      activeMerchants,
      redemptionsToday,
      pendingApprovals,
      totalDeals,
      activeDeals,
      totalCards,
      linkedCards,
    ] = await Promise.all([
      prisma.merchant.count(),
      prisma.member.count(),
      prisma.merchant.count({ where: { status: 'active' } }),
      prisma.redemptionLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.merchant.count({ where: { approvalStatus: 'pending' } }),
      prisma.deal.count(),
      prisma.deal.count({ where: { active: true } }),
      prisma.cardInventoryItem.count(),
      prisma.cardInventoryItem.count({ where: { status: 'member_linked' } }),
    ]);

    return NextResponse.json({
      total_merchants:    totalMerchants,
      total_members:      totalMembers,
      redemptions_today:  redemptionsToday,
      active_merchants:   activeMerchants,
      inactive_merchants: totalMerchants - activeMerchants,
      pending_approvals:  pendingApprovals,
      total_deals:        totalDeals,
      active_deals:       activeDeals,
      total_cards:        totalCards,
      linked_cards:       linkedCards,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[admin/stats]', msg);
    return NextResponse.json({ error: true, message: 'Database error: ' + msg }, { status: 500 });
  }
}
