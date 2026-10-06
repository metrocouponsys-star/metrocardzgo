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
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const members = await prisma.member.findMany({
      where: {
        merchantId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    });

    const dayCounts: Record<string, number> = {};
    for (const m of members) {
      const dateStr = m.createdAt.toISOString().split('T')[0];
      dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
    }

    const result: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      result.push({
        date: ds,
        count: dayCounts[ds] || 0,
      });
    }

    return addSecurityHeaders(NextResponse.json(result));
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
