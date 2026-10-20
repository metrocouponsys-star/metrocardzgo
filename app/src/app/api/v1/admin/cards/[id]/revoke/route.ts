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
    if (card.status === 'deactivated') {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'Deactivated cards cannot be revoked' }, { status: 400 })
      );
    }
    if (card.status === 'unassigned') {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'Card is already unassigned' }, { status: 400 })
      );
    }

    // If card was linked to a member, clear the physicalCardNumber on that member
    if (card.linkedMemberId) {
      await prisma.member.updateMany({
        where: { id: card.linkedMemberId },
        data: { physicalCardNumber: null },
      });
    }

    const updated = await prisma.cardInventoryItem.update({
      where: { id: cardId },
      data: {
        status: 'unassigned',
        allocatedMerchantId: null,
        allocatedAt: null,
        linkedMemberId: null,
        linkedAt: null,
      },
    });

    const mapped = {
      id: updated.id,
      card_number: updated.cardNumber,
      status: updated.status,
      created_by_admin_id: updated.createdByAdminId ?? undefined,
      created_at: updated.createdAt.toISOString(),
    };

    return addSecurityHeaders(NextResponse.json(mapped));
  } catch (err: any) {
    console.error('[admin/cards/revoke POST]', err);
    return addSecurityHeaders(
      NextResponse.json({ detail: err.message || 'Failed to revoke card' }, { status: 500 })
    );
  }
}
