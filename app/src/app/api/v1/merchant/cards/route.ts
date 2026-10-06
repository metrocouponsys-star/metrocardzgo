import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const cards = await prisma.cardInventoryItem.findMany({
    where: { allocatedMerchantId: merchantId },
    include: {
      member: { select: { id: true, name: true, phone: true } },
    },
    orderBy: { cardNumber: 'asc' },
  });

  const mapped = cards.map(c => ({
    id: c.id,
    card_number: c.cardNumber,
    status: c.status,
    allocated_merchant_id: c.allocatedMerchantId || undefined,
    allocated_at: c.allocatedAt?.toISOString(),
    linked_member_id: c.linkedMemberId || undefined,
    linked_member_name: c.member?.name,
    linked_member_phone: c.member?.phone,
    linked_at: c.linkedAt?.toISOString(),
    created_at: c.createdAt.toISOString(),
  }));

  return NextResponse.json(mapped);
}
