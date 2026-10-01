/** GET/POST /api/v1/cards — Card inventory CRUD + allocate + link */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? undefined;
  const merchantId = url.searchParams.get('merchant_id') ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 500);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  const cards = await prisma.cardInventoryItem.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(merchantId ? { allocatedMerchantId: merchantId } : {}),
    },
    include: {
      merchant: { select: { businessName: true } },
      member: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
  return NextResponse.json(cards);
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();

  // Batch add cards
  if (body.action === 'add_batch') {
    const cards = (body.card_numbers as string[]).map(num => ({
      id: crypto.randomUUID(),
      cardNumber: num.replace(/\s/g, ''),
      status: 'unassigned' as const,
      createdByAdminId: auth.userId,
    }));
    await prisma.cardInventoryItem.createMany({ data: cards, skipDuplicates: true });
    return NextResponse.json({ added: cards.length }, { status: 201 });
  }

  // Allocate to merchant
  if (body.action === 'allocate') {
    await prisma.cardInventoryItem.updateMany({
      where: { id: { in: body.card_ids }, status: 'unassigned' },
      data: {
        status: 'merchant_allocated',
        allocatedMerchantId: body.merchant_id,
        allocatedAt: new Date(),
      },
    });
    return NextResponse.json({ message: 'Cards allocated' });
  }

  // Link to member
  if (body.action === 'link_member') {
    await prisma.cardInventoryItem.update({
      where: { id: body.card_id },
      data: {
        status: 'member_linked',
        linkedMemberId: body.member_id,
        linkedAt: new Date(),
      },
    });
    await prisma.member.update({
      where: { id: body.member_id },
      data: { physicalCardNumber: body.card_number },
    });
    return NextResponse.json({ message: 'Card linked to member' });
  }

  return NextResponse.json({ detail: 'Invalid action' }, { status: 400 });
}
