import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const action = body.action; // 'revoke' | 'delete'
    const merchantId = body.merchant_id || body.merchantId;
    const count = Math.min(Math.max(1, parseInt(body.count || '100', 10)), 5000);
    const status = body.status;

    if (action !== 'revoke' && action !== 'delete') {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'Invalid action. Must be "revoke" or "delete"' }, { status: 400 })
      );
    }

    if (action === 'revoke') {
      const whereClause: any = {
        linkedMemberId: null,
      };

      if (merchantId) {
        whereClause.allocatedMerchantId = merchantId;
      } else {
        whereClause.status = 'merchant_allocated';
      }

      // Find IDs to limit to count
      const targets = await prisma.cardInventoryItem.findMany({
        where: whereClause,
        select: { id: true },
        take: count,
      });

      const targetIds = targets.map((t) => t.id);

      if (targetIds.length > 0) {
        await prisma.cardInventoryItem.updateMany({
          where: { id: { in: targetIds } },
          data: {
            status: 'unassigned',
            allocatedMerchantId: null,
            allocatedAt: null,
            linkedMemberId: null,
            linkedAt: null,
          },
        });
      }

      await prisma.adminAuditLog.create({
        data: {
          adminUserId: auth.userId,
          merchantId: merchantId || null,
          action: 'batch_revoke_cards',
          detail: `Batch revoked ${targetIds.length} cards back to unassigned inventory.`,
        },
      }).catch(() => {});

      return addSecurityHeaders(
        NextResponse.json({
          success: true,
          action: 'revoke',
          processed: targetIds.length,
        })
      );
    } else {
      // action === 'delete'
      const whereClause: any = {
        linkedMemberId: null,
      };

      if (merchantId) {
        whereClause.allocatedMerchantId = merchantId;
      }

      if (status) {
        whereClause.status = status;
      }

      const targets = await prisma.cardInventoryItem.findMany({
        where: whereClause,
        select: { id: true },
        take: count,
      });

      const targetIds = targets.map((t) => t.id);

      let deletedCount = 0;
      if (targetIds.length > 0) {
        const deleteRes = await prisma.cardInventoryItem.deleteMany({
          where: { id: { in: targetIds } },
        });
        deletedCount = deleteRes.count;
      }

      await prisma.adminAuditLog.create({
        data: {
          adminUserId: auth.userId,
          merchantId: merchantId || null,
          action: 'batch_delete_cards',
          detail: `Batch deleted ${deletedCount} unlinked cards from database.`,
        },
      }).catch(() => {});

      return addSecurityHeaders(
        NextResponse.json({
          success: true,
          action: 'delete',
          processed: deletedCount,
        })
      );
    }
  } catch (error: any) {
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
