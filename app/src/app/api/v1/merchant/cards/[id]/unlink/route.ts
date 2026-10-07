import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const { id: cardId } = await params;

  try {
    const card = await prisma.cardInventoryItem.findFirst({
      where: {
        id: cardId,
        ...(auth.role !== 'super_admin' ? { allocatedMerchantId: merchantId } : {}),
      },
    });
    if (!card) return NextResponse.json({ detail: 'Card not found' }, { status: 404 });

    const linkedMemberId = card.linkedMemberId;

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.cardInventoryItem.update({
        where: { id: cardId },
        data: {
          status: 'merchant_allocated',
          linkedMemberId: null,
          linkedAt: null,
        },
      });

      if (linkedMemberId) {
        await tx.member.update({
          where: { id: linkedMemberId },
          data: { physicalCardNumber: null },
        });
      }

      return c;
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[merchant/cards/unlink POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
