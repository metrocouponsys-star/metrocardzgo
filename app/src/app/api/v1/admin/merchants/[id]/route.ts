/** GET/PUT/DELETE/PATCH /api/v1/admin/merchants/[id] */
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: { users: true, membershipTypes: true, _count: { select: { members: true } } },
  });
  if (!merchant) return NextResponse.json({ detail: 'Merchant not found' }, { status: 404 });
  return NextResponse.json(merchant);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await request.json();

  const merchant = await prisma.merchant.update({
    where: { id },
    data: {
      businessName: body.business_name,
      category: body.category,
      planTier: body.plan_tier,
      whatsappNumber: body.whatsapp_number,
      address: body.address,
      status: body.status,
      approvalStatus: body.approval_status,
      referralBonusPoints: body.referral_bonus_points,
    },
  });
  await prisma.adminAuditLog.create({
    data: { adminUserId: auth.userId, merchantId: id, action: 'update_merchant', detail: JSON.stringify(body) },
  });
  return NextResponse.json(merchant);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  await prisma.merchant.update({ where: { id }, data: { status: 'suspended' } });
  await prisma.adminAuditLog.create({
    data: { adminUserId: auth.userId, merchantId: id, action: 'suspend_merchant' },
  });
  return NextResponse.json({ message: 'Merchant suspended' });
}

/** PATCH /api/v1/admin/merchants/[id] — toggle status or approval */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, string> = {};
  if (body.status) data.status = body.status;
  if (body.approval_status) data.approvalStatus = body.approval_status;

  const merchant = await prisma.merchant.update({ where: { id }, data });
  await prisma.adminAuditLog.create({
    data: { adminUserId: auth.userId, merchantId: id, action: 'patch_merchant', detail: JSON.stringify(body) },
  });
  return NextResponse.json(merchant);
}
