import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { addSecurityHeaders } from '@/lib/security';

function getWeekNumber(d: Date): string {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${target.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request) || auth.merchantId;
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') || '12', 10);

    const now = new Date();
    const startDate = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: {
        merchantId,
        createdAt: { gte: startDate },
      },
      select: {
        type: true,
        points: true,
        createdAt: true,
      },
    }).catch(() => []);

    const weekBuckets: Record<string, { earned: number; redeemed: number }> = {};

    for (const tx of transactions) {
      const w = getWeekNumber(tx.createdAt);
      if (!weekBuckets[w]) weekBuckets[w] = { earned: 0, redeemed: 0 };
      const pt = Number(tx.points || 0);
      if (tx.type === 'earn') {
        weekBuckets[w].earned += pt;
      } else {
        weekBuckets[w].redeemed += Math.abs(pt);
      }
    }

    const result = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const weekDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const w = getWeekNumber(weekDate);
      result.push({
        week: w,
        points_earned: weekBuckets[w]?.earned || 0,
        points_redeemed: weekBuckets[w]?.redeemed || 0,
      });
    }

    return addSecurityHeaders(NextResponse.json(result));
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
