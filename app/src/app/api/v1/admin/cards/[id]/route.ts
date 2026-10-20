import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
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
    if (card.linkedMemberId) {
      return addSecurityHeaders(
        NextResponse.json(
          { detail: 'Cannot delete a card that is currently linked to an active member. Unlink first.' },
          { status: 400 }
        )
      );
    }

    await prisma.cardInventoryItem.delete({
      where: { id: cardId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error('[admin/cards DELETE]', err);
    return addSecurityHeaders(
      NextResponse.json({ detail: err.message || 'Failed to delete card' }, { status: 500 })
    );
  }
}
