import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { id: memberId } = await params;
    const member = await prisma.member.findFirst({
      where: { id: memberId, merchantId },
    });

    if (!member) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Member not found' }, { status: 404 }));
    }

    return addSecurityHeaders(
      NextResponse.json({
        member_id: member.id,
        is_issued: true,
        status: member.status === 'active' ? 'active' : 'inactive',
        public_token: member.publicToken,
      })
    );
  } catch (error: any) {
    console.error('[wallet/members/[id]/google/status GET]', error);
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
