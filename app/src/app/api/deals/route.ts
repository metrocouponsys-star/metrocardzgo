import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPartnerPriority } from '@/lib/partnerStatus';

// Always render on demand — never pre-built (requires live DB connection)
export const dynamic = 'force-dynamic';

/**
 * GET /api/deals
 * Query params:
 *   - category: string (slug)
 *   - city:     string (slug)
 *   - featured: 'true' | undefined
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category');
    const citySlug     = searchParams.get('city');
    const featuredOnly = searchParams.get('featured') === 'true';

    const deals = await prisma.deal.findMany({
      where: {
        active: true,
        endDate: { gte: new Date() },
        ...(featuredOnly ? { featured: true } : {}),
        brand: {
          active: true,
          ...(categorySlug ? { category: { slug: categorySlug } } : {}),
          ...(citySlug     ? { city:     { slug: citySlug }     } : {}),
        },
      },
      include: {
        brand: {
          include: {
            category: true,
            city:     true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { brand: { partnerStatus: 'desc' } }, // direct_merchant first
        { createdAt: 'desc' },
      ],
    });

    // Sort by partner priority (DB enum ordering may differ)
    const sorted = deals.sort((a, b) => {
      const pa = getPartnerPriority(a.brand.partnerStatus as Parameters<typeof getPartnerPriority>[0]);
      const pb = getPartnerPriority(b.brand.partnerStatus as Parameters<typeof getPartnerPriority>[0]);
      if (b.featured !== a.featured) return b.featured ? 1 : -1;
      return pb - pa;
    });

    const response = sorted.map((d) => ({
      id:              d.id,
      offerTitle:      d.offerTitle,
      offerPercentage: d.offerPercentage,
      offerType:       d.offerType,
      endDate:         d.endDate.toISOString(),
      lastVerifiedDate: d.lastVerifiedDate.toISOString(),
      featured:        d.featured,
      heroImageUrl:    d.heroImageUrl,
      brand: {
        name:          d.brand.name,
        logoUrl:       d.brand.logoUrl,
        partnerStatus: d.brand.partnerStatus,
        city:          d.brand.city.name,
        citySlug:      d.brand.city.slug,
        category:      d.brand.category.name,
        categorySlug:  d.brand.category.slug,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/deals]', error);
    return NextResponse.json(
      { error: true, message: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}
