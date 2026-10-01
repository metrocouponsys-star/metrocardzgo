import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// No ISR cache — deal detail must always reflect active/expired status
export const dynamic = 'force-dynamic';

/**
 * GET /api/deals/[id]
 * Returns full deal detail for a single active deal.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dealId = parseInt(id, 10);

    if (isNaN(dealId)) {
      return NextResponse.json({ error: true, message: 'Invalid deal ID' }, { status: 400 });
    }

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, active: true },
      include: {
        brand: {
          include: {
            category: true,
            city:     true,
          },
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: true, message: 'Deal not found or no longer active' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id:              deal.id,
      offerTitle:      deal.offerTitle,
      offerPercentage: deal.offerPercentage,
      offerType:       deal.offerType,
      startDate:       deal.startDate.toISOString(),
      endDate:         deal.endDate.toISOString(),
      bookingUrl:      deal.bookingUrl,
      affiliateUrl:    deal.affiliateUrl,
      terms:           deal.terms,
      lastVerifiedDate: deal.lastVerifiedDate.toISOString(),
      featured:        deal.featured,
      heroImageUrl:    deal.heroImageUrl,
      brand: {
        id:            deal.brand.id,
        name:          deal.brand.name,
        logoUrl:       deal.brand.logoUrl,
        website:       deal.brand.website,
        instagram:     deal.brand.instagram,
        phone:         deal.brand.phone,
        mapsUrl:       deal.brand.mapsUrl,
        partnerStatus: deal.brand.partnerStatus,
        description:   deal.brand.description,
        category:      deal.brand.category.name,
        categorySlug:  deal.brand.category.slug,
        city:          deal.brand.city.name,
        citySlug:      deal.brand.city.slug,
      },
    });
  } catch (error) {
    console.error('[GET /api/deals/[id]]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to fetch deal' },
      { status: 500 }
    );
  }
}
