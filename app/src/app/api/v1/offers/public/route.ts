/**
 * GET /api/v1/offers/public
 * Public browse endpoint — no auth required.
 *
 * Returns active offer templates grouped by offerType.
 * Used by customer-facing /browse page.
 *
 * Query params:
 *   merchantId  — filter to one merchant
 *   offerType   — filter by type slug
 *   search      — text search in title/description
 *   limit       — max results (default 50, max 200)
 *   offset      — pagination offset
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url        = new URL(request.url);
    const merchantId = url.searchParams.get('merchantId') ?? undefined;
    const offerType  = url.searchParams.get('offerType')  ?? undefined;
    const search     = url.searchParams.get('search')     ?? undefined;
    const limit      = Math.min(parseInt(url.searchParams.get('limit')  ?? '50'), 200);
    const offset     = Math.max(parseInt(url.searchParams.get('offset') ?? '0'),  0);

    const offers = await prisma.offerTemplate.findMany({
      where: {
        active: true,
        ...(merchantId ? { merchantId } : {}),
        ...(offerType  ? { offerType: offerType as any } : {}),
        ...(search     ? {
          OR: [
            { title:       { contains: search } },
            { description: { contains: search } },
          ],
        } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        offerType: true,
        value: true,
        minPurchaseAmount: true,
        loyaltyPointsEarn: true,
        merchant: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            category: true,
          },
        },
      },
      orderBy: { merchantId: 'asc' },
      take: limit,
      skip: offset,
    });

    // Group by offerType for browse UI
    const grouped: Record<string, typeof offers> = {};
    for (const offer of offers) {
      const cat = offer.offerType ?? 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(offer);
    }

    // Unique offerType values as categories
    const categories = Object.keys(grouped).sort();

    return NextResponse.json({
      total: offers.length,
      offers,
      grouped,
      categories,
    });
  } catch (err) {
    console.error('[offers/public]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
