import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const logs = await prisma.adminAuditLog.findMany({
      where: {
        merchantId,
        action: 'member_feedback',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const feedbacks = logs.map((log) => {
      try {
        const parsed = JSON.parse(log.detail || '{}');
        return {
          id: log.id,
          member_id: parsed.member_id,
          member_name: parsed.member_name,
          rating: parsed.rating || 5,
          comment: parsed.comment || '',
          created_at: parsed.submitted_at || log.createdAt.toISOString(),
        };
      } catch {
        return {
          id: log.id,
          rating: 5,
          comment: log.detail || '',
          created_at: log.createdAt.toISOString(),
        };
      }
    });

    return addSecurityHeaders(NextResponse.json(feedbacks));
  } catch (error: any) {
    console.error('[public/feedback/merchant GET]', error);
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
