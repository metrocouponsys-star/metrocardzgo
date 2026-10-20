import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://metrocardz.com';
    const digitalPassUrl = `${baseUrl}/m/${member.publicToken}`;

    return addSecurityHeaders(
      NextResponse.json({
        save_url: digitalPassUrl,
        google_object_id: `gpass.${merchantId}.${member.id}`,
        status: 'active',
        pass_url: digitalPassUrl,
      })
    );
  } catch (error: any) {
    console.error('[wallet/members/[id]/google POST]', error);
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
