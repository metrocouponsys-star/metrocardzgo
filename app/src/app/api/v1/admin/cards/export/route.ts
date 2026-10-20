import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(request.url);
    const merchantId = url.searchParams.get('merchant_id') || undefined;

    const whereClause: any = {};
    if (merchantId) {
      whereClause.allocatedMerchantId = merchantId;
    }

    const cards = await prisma.cardInventoryItem.findMany({
      where: whereClause,
      include: {
        merchant: {
          select: { businessName: true },
        },
        member: {
          select: { name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Card Number',
      'Status',
      'Allocated Merchant',
      'Linked Member Name',
      'Linked Member Phone',
      'Allocated At',
      'Linked At',
      'Created At',
    ];

    const rows = [headers.join(',')];

    for (const card of cards) {
      const row = [
        `"${card.cardNumber}"`,
        `"${card.status}"`,
        `"${(card.merchant?.businessName || '').replace(/"/g, '""')}"`,
        `"${(card.member?.name || '').replace(/"/g, '""')}"`,
        `"${card.member?.phone || ''}"`,
        `"${card.allocatedAt ? card.allocatedAt.toISOString() : ''}"`,
        `"${card.linkedAt ? card.linkedAt.toISOString() : ''}"`,
        `"${card.createdAt ? card.createdAt.toISOString() : ''}"`,
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="metrocardz_cards_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
