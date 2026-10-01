/** GET/PUT/DELETE /api/v1/membership-types/[id] */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const type = await prisma.membershipType.findUnique({
    where: { id },
    include: { offerLinks: { include: { offer: true } }, _count: { select: { members: true } } },
  });
  if (!type) return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  return NextResponse.json(type);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await request.json();

  const updated = await prisma.membershipType.update({
    where: { id },
    data: { name: body.name, description: body.description },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const memberCount = await prisma.member.count({ where: { membershipTypeId: id } });
  if (memberCount > 0) {
    return NextResponse.json(
      { detail: `Cannot delete: ${memberCount} members are on this type` },
      { status: 400 }
    );
  }
  await prisma.membershipType.delete({ where: { id } });
  return NextResponse.json({ message: 'Membership type deleted' });
}
