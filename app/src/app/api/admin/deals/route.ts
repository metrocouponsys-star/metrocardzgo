import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, DEALS_ADMIN_COOKIE } from '@/lib/dealsAuth';
import { isStaleContent } from '@/lib/partnerStatus';

export const dynamic = 'force-dynamic';

// ── Auth guard helper ─────────────────────────────────────────────────────────
async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(DEALS_ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * GET /api/admin/deals
 * Returns ALL deals (including inactive/expired) for the admin dashboard.
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  const deals = await prisma.deal.findMany({
    include: {
      brand: { include: { category: true, city: true } },
      _count: { select: { clicks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    deals.map((d) => ({
      id:               d.id,
      offerTitle:       d.offerTitle,
      offerPercentage:  d.offerPercentage,
      offerType:        d.offerType,
      startDate:        d.startDate.toISOString(),
      endDate:          d.endDate.toISOString(),
      bookingUrl:       d.bookingUrl,
      affiliateUrl:     d.affiliateUrl,
      terms:            d.terms,
      lastVerifiedDate: d.lastVerifiedDate.toISOString(),
      featured:         d.featured,
      active:           d.active,
      heroImageUrl:     d.heroImageUrl,
      isStale:          isStaleContent(d.lastVerifiedDate),
      clicks:           d._count.clicks,
      brand: {
        id:            d.brand.id,
        name:          d.brand.name,
        logoUrl:       d.brand.logoUrl,
        partnerStatus: d.brand.partnerStatus,
        category:      d.brand.category.name,
        city:          d.brand.city.name,
      },
    }))
  );
}

/**
 * POST /api/admin/deals
 * Create a new deal with server-side validation.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: true, message: 'Invalid JSON' }, { status: 400 });
  }

  // ── Server-side validation (non-negotiable per PRD) ───────────────────────
  const errors: Record<string, string> = {};

  if (!body.brandId) errors.brandId = 'Brand is required';
  if (!body.offerTitle) errors.offerTitle = 'Offer title is required';
  if (!body.offerType) errors.offerType = 'Offer type is required';
  if (!body.startDate) errors.startDate = 'Start date is required';
  if (!body.endDate) errors.endDate = 'End date is required';
  if (!body.lastVerifiedDate) errors.lastVerifiedDate = 'Last verified date is required';

  if (body.startDate && body.endDate) {
    const start = new Date(body.startDate as string);
    const end = new Date(body.endDate as string);
    if (end < start) errors.endDate = 'End date must be on or after start date';
  }

  // Check brand partner_status to enforce affiliate_url requirement
  if (body.brandId) {
    const brand = await prisma.dealBrand.findUnique({
      where: { id: Number(body.brandId) },
      select: { partnerStatus: true },
    });
    if (!brand) {
      errors.brandId = 'Brand not found';
    } else if (brand.partnerStatus === 'affiliate' && !body.affiliateUrl) {
      errors.affiliateUrl = 'Affiliate URL is required when partner status is AFFILIATE';
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: true, message: 'Validation failed', fields: errors }, { status: 400 });
  }

  try {
    const deal = await prisma.deal.create({
      data: {
        brandId:          Number(body.brandId),
        offerTitle:       String(body.offerTitle),
        offerPercentage:  body.offerPercentage ? Number(body.offerPercentage) : null,
        offerType:        String(body.offerType),
        startDate:        new Date(body.startDate as string),
        endDate:          new Date(body.endDate as string),
        bookingUrl:       body.bookingUrl ? String(body.bookingUrl) : null,
        affiliateUrl:     body.affiliateUrl ? String(body.affiliateUrl) : null,
        terms:            body.terms ? String(body.terms) : null,
        lastVerifiedDate: new Date(body.lastVerifiedDate as string),
        featured:         Boolean(body.featured ?? false),
        active:           Boolean(body.active ?? true),
        heroImageUrl:     body.heroImageUrl ? String(body.heroImageUrl) : null,
      },
      include: {
        brand: { include: { category: true, city: true } },
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/deals]', err);
    return NextResponse.json({ error: true, message: 'Failed to create deal' }, { status: 500 });
  }
}
