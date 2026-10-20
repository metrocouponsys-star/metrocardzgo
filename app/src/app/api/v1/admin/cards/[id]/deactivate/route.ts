import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id: rawId } = await params;
    const cardId = decodeURIComponent(rawId).trim();

    const card = await prisma.cardInventoryItem.findUnique({
      where: { id: cardId },
    });
    if (!card) {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'Card not found' }, { status: 404 })
      );
    }

    const updated = await prisma.cardInventoryItem.update({
      where: { id: cardId },
      data: { status: 'deactivated' },
    });

    const mapped = {
      id: updated.id,
      card_number: updated.cardNumber,
      status: updated.status,
      allocated_merchant_id: updated.allocatedMerchantId ?? undefined,
      allocated_at: updated.allocatedAt ? updated.allocatedAt.toISOString() : undefined,
      linked_member_id: updated.linkedMemberId ?? undefined,
      linked_at: updated.linkedAt ? updated.linkedAt.toISOString() : undefined,
      created_by_admin_id: updated.createdByAdminId ?? undefined,
      created_at: updated.createdAt.toISOString(),
    };

    return addSecurityHeaders(NextResponse.json(mapped));
  } catch (err: any) {
    console.error('[admin/cards/deactivate POST]', err);
    return addSecurityHeaders(
      NextResponse.json({ detail: err.message || 'Failed to deactivate card' }, { status: 500 })
    );
  }
}
