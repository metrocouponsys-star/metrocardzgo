import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const merchants = await prisma.merchant.findMany({
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const results = await Promise.all(
      merchants.map(async (m) => {
        const redemptionCount = await prisma.redemptionLog.count({
          where: {
            member: {
              merchantId: m.id,
            },
          },
        });

        return {
          merchant_id: m.id,
          merchant_name: m.businessName,
          category: m.category || 'General',
          plan_tier: m.planTier || 'Starter',
          status: m.status,
          total_members: m._count.members,
          member_count: m._count.members,
          total_redemptions: redemptionCount,
          redemption_count: redemptionCount,
        };
      })
    );

    return addSecurityHeaders(NextResponse.json(results));
  } catch (err: any) {
    console.error('[admin/reports/by-merchant GET]', err);
    return addSecurityHeaders(
      NextResponse.json({ detail: err?.message || 'Server error' }, { status: 500 })
    );
  }
}
