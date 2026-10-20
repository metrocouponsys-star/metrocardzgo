import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ merchantId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { merchantId: rawMerchantId } = await params;
    const merchantId = decodeURIComponent(rawMerchantId).trim();

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'Merchant not found' }, { status: 404 })
      );
    }

    const body = await request.json().catch(() => ({}));
    const cardIds: string[] = body.card_ids || [];

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'card_ids array is required' }, { status: 400 })
      );
    }

    const now = new Date();

    // Update matching cards in unassigned status
    await prisma.cardInventoryItem.updateMany({
      where: {
        id: { in: cardIds },
        status: 'unassigned',
      },
      data: {
        status: 'merchant_allocated',
        allocatedMerchantId: merchantId,
        allocatedAt: now,
      },
    });

    // Fetch updated cards with merchant details
    const updatedCards = await prisma.cardInventoryItem.findMany({
      where: {
        id: { in: cardIds },
      },
      include: {
        merchant: { select: { businessName: true } },
      },
    });

    const mapped = updatedCards.map(c => ({
      id: c.id,
      card_number: c.cardNumber,
      status: c.status,
      allocated_merchant_id: c.allocatedMerchantId ?? undefined,
      allocated_merchant_name: c.merchant?.businessName ?? merchant.businessName,
      allocated_at: c.allocatedAt ? c.allocatedAt.toISOString() : undefined,
      linked_member_id: c.linkedMemberId ?? undefined,
      created_by_admin_id: c.createdByAdminId ?? undefined,
      created_at: c.createdAt.toISOString(),
    }));

    return addSecurityHeaders(NextResponse.json(mapped));
  } catch (err: any) {
    console.error('[admin/cards/allocate POST]', err);
    return addSecurityHeaders(
      NextResponse.json({ detail: err.message || 'Failed to allocate cards' }, { status: 500 })
    );
  }
}
