/** GET/PUT/DELETE /api/v1/membership-types/[id] */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const type = await prisma.membershipType.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
    include: { offerLinks: { include: { offer: true } }, _count: { select: { members: true } } },
  });
  if (!type) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  return NextResponse.json(type);
}

async function handleUpdate(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.membershipType.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Not found' }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.membershipType.update({
    where: { id },
    data: {
      name: body.name !== undefined ? body.name : existing.name,
      description: body.description !== undefined ? body.description : existing.description,
    },
  });
  return NextResponse.json(updated);
}

export async function PUT(request: NextRequest, context: Params) {
  return handleUpdate(request, context);
}

export async function PATCH(request: NextRequest, context: Params) {
  return handleUpdate(request, context);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (!['owner', 'super_admin'].includes(auth.role)) {
    return NextResponse.json({ detail: 'Only owner or admin can delete membership types' }, { status: 403 });
  }

  const { id } = await params;
  const merchantId = getMerchantId(auth, request);
  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.membershipType.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Not found' }, { status: 404 });

  const memberCount = await prisma.member.count({ where: { membershipTypeId: id } });
  if (memberCount > 0) {
    return NextResponse.json(
      { detail: `Cannot delete: ${memberCount} members are currently assigned to this type` },
      { status: 400 }
    );
  }

  // Delete associated offer links first
  await prisma.membershipTypeOffer.deleteMany({ where: { membershipTypeId: id } });
  await prisma.membershipType.delete({ where: { id } });
  return NextResponse.json({ message: 'Membership type deleted' });
}
