import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { addSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request) || auth.merchantId;
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { searchParams } = new URL(request.url);
    const cohortMonths = parseInt(searchParams.get('cohort_months') || '6', 10);

    const now = new Date();
    const result = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = cohortMonths - 1; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      const label = `${monthNames[startOfMonth.getMonth()]} ${startOfMonth.getFullYear()}`;

      const [joined, retained] = await Promise.all([
        prisma.member.count({
          where: {
            merchantId,
            joinedDate: { gte: startOfMonth, lte: endOfMonth },
          },
        }),
        prisma.member.count({
          where: {
            merchantId,
            joinedDate: { gte: startOfMonth, lte: endOfMonth },
            OR: [
              { totalVisits: { gt: 1 } },
              { redemptions: { some: {} } },
              { status: 'active' },
            ],
          },
        }),
      ]);

      const rate = joined > 0 ? Math.round((retained / joined) * 1000) / 10 : 0;

      result.push({
        cohort: label,
        joined,
        retained,
        retention_rate: rate,
      });
    }

    return addSecurityHeaders(NextResponse.json(result));
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
