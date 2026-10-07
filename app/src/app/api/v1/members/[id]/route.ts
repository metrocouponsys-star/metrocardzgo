/**
 * GET/PUT/DELETE /api/v1/members/[id]
 * Port of Python members.py get_member, update_member, delete_member
 */
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

  const member = await prisma.member.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
    include: {
      membershipType: true,
      offerStates: { include: { offerTemplate: true } },
      redemptions: { orderBy: { createdAt: 'desc' }, take: 10 },
      loyaltyTxns: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!member) return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
  return NextResponse.json(member);
}

async function handleUpdate(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.member.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Member not found' }, { status: 404 });

  const body = await request.json();

  const updated = await prisma.member.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      phone: body.phone ?? existing.phone,
      email: body.email !== undefined ? body.email : existing.email,
      dateOfBirth: body.date_of_birth ? new Date(body.date_of_birth) : existing.dateOfBirth,
      anniversaryDate: body.anniversary_date ? new Date(body.anniversary_date) : existing.anniversaryDate,
      familyDob1: body.family_dob_1 ? new Date(body.family_dob_1) : existing.familyDob1,
      familyDob2: body.family_dob_2 ? new Date(body.family_dob_2) : existing.familyDob2,
      familyDob3: body.family_dob_3 ? new Date(body.family_dob_3) : existing.familyDob3,
      membershipTypeId: body.membership_type_id ?? existing.membershipTypeId,
      expiryDate: body.expiry_date ? new Date(body.expiry_date) : existing.expiryDate,
      status: body.status ?? existing.status,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      autoRenew: body.auto_renew !== undefined ? body.auto_renew : existing.autoRenew,
    },
    include: { membershipType: true },
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
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.member.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Member not found' }, { status: 404 });

  await prisma.member.update({ where: { id }, data: { status: 'deactivated' } });
  return NextResponse.json({ message: 'Member deactivated' });
}
