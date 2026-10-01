import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, DEALS_ADMIN_COOKIE } from '@/lib/dealsAuth';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(DEALS_ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/** PUT /api/admin/brands/[id] — update a brand */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const brandId = parseInt(id, 10);
  if (isNaN(brandId)) return NextResponse.json({ error: true, message: 'Invalid ID' }, { status: 400 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: true, message: 'Invalid JSON' }, { status: 400 });
  }

  const validStatuses = ['public_link', 'affiliate', 'authorised_partner', 'direct_merchant'];
  if (body.partnerStatus && !validStatuses.includes(body.partnerStatus as string)) {
    return NextResponse.json(
      { error: true, message: 'Invalid partner status', field: 'partnerStatus' },
      { status: 400 }
    );
  }

  try {
    const brand = await prisma.dealBrand.update({
      where: { id: brandId },
      data: {
        ...(body.name          !== undefined && { name:          String(body.name) }),
        ...(body.categoryId    !== undefined && { categoryId:    Number(body.categoryId) }),
        ...(body.cityId        !== undefined && { cityId:        Number(body.cityId) }),
        ...(body.partnerStatus !== undefined && { partnerStatus: body.partnerStatus as 'public_link' | 'affiliate' | 'authorised_partner' | 'direct_merchant' }),
        ...(body.description   !== undefined && { description:   body.description ? String(body.description) : null }),
        ...(body.logoUrl       !== undefined && { logoUrl:       body.logoUrl ? String(body.logoUrl) : null }),
        ...(body.website       !== undefined && { website:       body.website ? String(body.website) : null }),
        ...(body.instagram     !== undefined && { instagram:     body.instagram ? String(body.instagram) : null }),
        ...(body.phone         !== undefined && { phone:         body.phone ? String(body.phone) : null }),
        ...(body.mapsUrl       !== undefined && { mapsUrl:       body.mapsUrl ? String(body.mapsUrl) : null }),
        ...(body.active        !== undefined && { active:        Boolean(body.active) }),
      },
      include: { category: true, city: true },
    });
    return NextResponse.json(brand);
  } catch {
    return NextResponse.json({ error: true, message: 'Brand not found or update failed' }, { status: 404 });
  }
}

/** DELETE /api/admin/brands/[id] — soft delete (sets active = false) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const brandId = parseInt(id, 10);
  if (isNaN(brandId)) return NextResponse.json({ error: true, message: 'Invalid ID' }, { status: 400 });

  try {
    await prisma.dealBrand.update({ where: { id: brandId }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: true, message: 'Brand not found' }, { status: 404 });
  }
}
