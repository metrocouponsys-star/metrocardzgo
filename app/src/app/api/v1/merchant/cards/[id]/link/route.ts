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
  const url = new URL(request.url);
  let memberId = url.searchParams.get('member_id');

  if (!memberId) {
    try {
      const body = await request.json();
      memberId = body.member_id;
    } catch {}
  }

  if (!memberId) {
    return NextResponse.json({ detail: 'Member ID required' }, { status: 400 });
  }

  try {
    const member = await prisma.member.findFirst({
      where: { id: memberId, merchantId },
    });
    if (!member) return NextResponse.json({ detail: 'Member not found' }, { status: 404 });

    const card = await prisma.cardInventoryItem.findFirst({
      where: {
        id: cardId,
        ...(auth.role !== 'super_admin' ? { allocatedMerchantId: merchantId } : {}),
      },
    });
    if (!card) return NextResponse.json({ detail: 'Card not found or not allocated to your merchant' }, { status: 404 });

    if (card.status === 'member_linked' && card.linkedMemberId && card.linkedMemberId !== memberId) {
      return NextResponse.json({ detail: 'Card is already linked to another member' }, { status: 400 });
    }

    const updatedCard = await prisma.$transaction(async (tx) => {
      const c = await tx.cardInventoryItem.update({
        where: { id: cardId },
        data: {
          status: 'member_linked',
          linkedMemberId: memberId,
          linkedAt: new Date(),
        },
      });

      await tx.member.update({
        where: { id: memberId },
        data: { physicalCardNumber: card.cardNumber },
      });

      return c;
    });

    return NextResponse.json(updatedCard);
  } catch (err) {
    console.error('[merchant/cards/link POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
