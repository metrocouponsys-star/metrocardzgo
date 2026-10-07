import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const url = new URL(request.url);
  const cardNumber = url.searchParams.get('card_number')?.trim();

  if (!cardNumber) {
    return NextResponse.json({ detail: 'Card number required' }, { status: 400 });
  }

  const cleanNum = cardNumber.replace(/\s/g, '');

  const card = await prisma.cardInventoryItem.findFirst({
    where: {
      cardNumber: cleanNum,
      ...(auth.role !== 'super_admin' ? { allocatedMerchantId: merchantId } : {}),
    },
    include: {
      member: true,
    },
  });

  if (!card) {
    return NextResponse.json({ detail: 'Card not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: card.id,
    card_number: card.cardNumber,
    status: card.status,
    linked_member_id: card.linkedMemberId,
    member: card.member,
  });
}
