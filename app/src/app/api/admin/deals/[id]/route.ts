import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, DEALS_ADMIN_COOKIE } from '@/lib/dealsAuth';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(DEALS_ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * PUT /api/admin/deals/[id]
 * Update an existing deal. Same validation rules as POST.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const dealId = parseInt(id, 10);
  if (isNaN(dealId)) return NextResponse.json({ error: true, message: 'Invalid ID' }, { status: 400 });

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return NextResponse.json({ error: true, message: 'Deal not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: true, message: 'Invalid JSON' }, { status: 400 });
  }

  // Validate dates
  if (body.startDate && body.endDate) {
    const start = new Date(body.startDate as string);
    const end = new Date(body.endDate as string);
    if (end < start) {
      return NextResponse.json(
        { error: true, message: 'End date must be on or after start date', field: 'endDate' },
        { status: 400 }
      );
    }
  }

  // Validate affiliate_url when applicable
  if (body.brandId || deal.brandId) {
    const brand = await prisma.dealBrand.findUnique({
      where: { id: Number(body.brandId ?? deal.brandId) },
      select: { partnerStatus: true },
    });
    if (brand?.partnerStatus === 'affiliate') {
      const affiliateUrl = body.affiliateUrl ?? deal.affiliateUrl;
      if (!affiliateUrl) {
        return NextResponse.json(
          { error: true, message: 'Affiliate URL is required when partner status is AFFILIATE', field: 'affiliateUrl' },
          { status: 400 }
        );
      }
    }
  }

  try {
    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        ...(body.brandId          !== undefined && { brandId:          Number(body.brandId) }),
        ...(body.offerTitle       !== undefined && { offerTitle:       String(body.offerTitle) }),
        ...(body.offerPercentage  !== undefined && { offerPercentage:  body.offerPercentage ? Number(body.offerPercentage) : null }),
        ...(body.offerType        !== undefined && { offerType:        String(body.offerType) }),
        ...(body.startDate        !== undefined && { startDate:        new Date(body.startDate as string) }),
        ...(body.endDate          !== undefined && { endDate:          new Date(body.endDate as string) }),
        ...(body.bookingUrl       !== undefined && { bookingUrl:       body.bookingUrl ? String(body.bookingUrl) : null }),
        ...(body.affiliateUrl     !== undefined && { affiliateUrl:     body.affiliateUrl ? String(body.affiliateUrl) : null }),
        ...(body.terms            !== undefined && { terms:            body.terms ? String(body.terms) : null }),
        ...(body.lastVerifiedDate !== undefined && { lastVerifiedDate: new Date(body.lastVerifiedDate as string) }),
        ...(body.featured         !== undefined && { featured:         Boolean(body.featured) }),
        ...(body.active           !== undefined && { active:           Boolean(body.active) }),
        ...(body.heroImageUrl     !== undefined && { heroImageUrl:     body.heroImageUrl ? String(body.heroImageUrl) : null }),
      },
      include: { brand: { include: { category: true, city: true } } },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PUT /api/admin/deals/[id]]', err);
    return NextResponse.json({ error: true, message: 'Failed to update deal' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/deals/[id]
 * Soft-delete: sets active = false. Never hard-deletes (preserves click history).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const dealId = parseInt(id, 10);
  if (isNaN(dealId)) return NextResponse.json({ error: true, message: 'Invalid ID' }, { status: 400 });

  try {
    await prisma.deal.update({ where: { id: dealId }, data: { active: false } });
    return NextResponse.json({ ok: true, message: 'Deal deactivated (soft delete)' });
  } catch {
    return NextResponse.json({ error: true, message: 'Deal not found' }, { status: 404 });
  }
}
