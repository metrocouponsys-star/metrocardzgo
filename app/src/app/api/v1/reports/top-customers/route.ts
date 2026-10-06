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
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const members = await prisma.member.findMany({
      where: { merchantId },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
      orderBy: [
        { loyaltyPoints: 'desc' },
        { totalVisits: 'desc' },
      ],
      take: limit,
    });

    const result = members.map(m => ({
      member_id: m.id,
      name: m.name,
      phone: m.phone,
      member_code: m.memberCode,
      redemption_count: m._count.redemptions,
      loyalty_points: Number(m.loyaltyPoints || 0),
      total_visits: m.totalVisits || m._count.redemptions || 0,
    }));

    return addSecurityHeaders(NextResponse.json(result));
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
