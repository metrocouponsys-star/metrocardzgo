import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, DEALS_ADMIN_COOKIE } from '@/lib/dealsAuth';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(DEALS_ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/** GET /api/admin/brands — list all brands */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });

  const brands = await prisma.dealBrand.findMany({
    include: { category: true, city: true, _count: { select: { deals: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(brands.map((b: any) => ({
    id:            b.id,
    name:          b.name,
    partnerStatus: b.partnerStatus,
    category:      b.category.name,
    categoryId:    b.categoryId,
    city:          b.city.name,
    cityId:        b.cityId,
    logoUrl:       b.logoUrl,
    website:       b.website,
    instagram:     b.instagram,
    phone:         b.phone,
    mapsUrl:       b.mapsUrl,
    description:   b.description,
    active:        b.active,
    dealCount:     b._count.deals,
    createdAt:     b.createdAt.toISOString(),
  })));
}

/** POST /api/admin/brands — create a brand */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: true, message: 'Invalid JSON' }, { status: 400 });
  }

  const errors: Record<string, string> = {};
  if (!body.name) errors.name = 'Brand name is required';
  if (!body.categoryId) errors.categoryId = 'Category is required';
  if (!body.cityId) errors.cityId = 'City is required';
  if (!body.partnerStatus) errors.partnerStatus = 'Partner status is required (cannot default)';

  const validStatuses = ['public_link', 'affiliate', 'authorised_partner', 'direct_merchant'];
  if (body.partnerStatus && !validStatuses.includes(body.partnerStatus as string)) {
    errors.partnerStatus = `Invalid partner status. Must be one of: ${validStatuses.join(', ')}`;
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: true, message: 'Validation failed', fields: errors }, { status: 400 });
  }

  try {
    const brand = await prisma.dealBrand.create({
      data: {
        name:          String(body.name),
        categoryId:    Number(body.categoryId),
        cityId:        Number(body.cityId),
        partnerStatus: body.partnerStatus as 'public_link' | 'affiliate' | 'authorised_partner' | 'direct_merchant',
        description:   body.description ? String(body.description) : null,
        logoUrl:       body.logoUrl ? String(body.logoUrl) : null,
        website:       body.website ? String(body.website) : null,
        instagram:     body.instagram ? String(body.instagram) : null,
        phone:         body.phone ? String(body.phone) : null,
        mapsUrl:       body.mapsUrl ? String(body.mapsUrl) : null,
        active:        Boolean(body.active ?? true),
      },
      include: { category: true, city: true },
    });
    return NextResponse.json(brand, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/brands]', err);
    return NextResponse.json({ error: true, message: 'Failed to create brand' }, { status: 500 });
  }
}
