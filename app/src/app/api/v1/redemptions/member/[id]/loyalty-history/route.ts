import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id: memberId } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const txns = await prisma.loyaltyTransaction.findMany({
    where: {
      memberId,
      ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {})
    },
    include: {
      sourceOffer: { select: { title: true, offerType: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(txns);
}
