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

    // Revoke selected cards back to unassigned pool
    const updateResult = await prisma.cardInventoryItem.updateMany({
      where: {
        id: { in: cardIds },
      },
      data: {
        status: 'unassigned',
        allocatedMerchantId: null,
        allocatedAt: null,
        linkedMemberId: null,
        linkedAt: null,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: auth.userId,
        action: 'bulk_revoke_cards',
        detail: `Bulk revoked ${updateResult.count} cards back to unassigned inventory.`,
      },
    }).catch(() => {});

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        revoked: updateResult.count,
      })
    );
  } catch (error: any) {
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
