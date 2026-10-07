import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ cardNumber: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { cardNumber } = await params;
  if (!cardNumber) {
    return NextResponse.json({ detail: 'Card number required' }, { status: 400 });
  }

  const cleanNum = decodeURIComponent(cardNumber).replace(/\s/g, '');

  try {
    const card = await prisma.cardInventoryItem.findFirst({
      where: { cardNumber: cleanNum },
      include: {
        merchant: { select: { id: true, businessName: true, logoUrl: true, cardDesignUrl: true } },
        member: { select: { id: true, name: true, publicToken: true, status: true } },
      },
    });

    if (!card) {
      return NextResponse.json({ detail: 'Card not registered' }, { status: 404 });
    }

    return NextResponse.json({
      card_number: card.cardNumber,
      status: card.status,
      merchant: card.merchant,
      member: card.member ? {
        name: card.member.name,
        public_token: card.member.publicToken,
        status: card.member.status,
      } : null,
    });
  } catch (err) {
    console.error('[cards/resolve GET]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
