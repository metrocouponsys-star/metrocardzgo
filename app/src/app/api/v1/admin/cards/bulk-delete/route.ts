import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const cardIds: string[] = body.card_ids || body.cardIds || [];

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'card_ids array is required' }, { status: 400 })
      );
    }

    // Delete cards that are not active member-linked cards
    const deleteResult = await prisma.cardInventoryItem.deleteMany({
      where: {
        id: { in: cardIds },
        linkedMemberId: null,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: auth.userId,
        action: 'bulk_delete_cards',
        detail: `Bulk deleted ${deleteResult.count} unlinked cards from inventory.`,
      },
    }).catch(() => {});

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        deleted: deleteResult.count,
      })
    );
  } catch (error: any) {
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
