/**
 * GET/PUT/DELETE /api/v1/members/[id]
 * Port of Python members.py get_member, update_member, delete_member
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeMemberData } from '@/lib/dataNormalizer';

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
  return NextResponse.json(normalizeMemberData(member));
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
  return NextResponse.json(normalizeMemberData(updated));
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

  // DPDP Act 2023 Section 13 — Statutory Erasure & PII Anonymisation
  const erasureId = `ER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // 1. Record formal Erasure Request
  await prisma.erasureRequest.create({
    data: {
      id: erasureId,
      memberId: existing.id,
      merchantId: existing.merchantId,
      reason: 'Merchant operator initiated member deletion and DPDP erasure',
      status: 'completed',
      processedAt: new Date(),
      processedBy: auth.userId,
      anonymisedFields: JSON.stringify([
        'name', 'phone', 'email', 'dateOfBirth', 'anniversaryDate',
        'familyDob1', 'familyDob2', 'familyDob3', 'notes', 'publicToken'
      ]),
    },
  }).catch(() => {});

  // 2. Unlink any assigned physical card in card inventory so it doesn't point to erased member
  await prisma.cardInventoryItem.updateMany({
    where: { assignedMemberId: existing.id },
    data: { assignedMemberId: null, status: 'merchant_allocated' },
  }).catch(() => {});

  // 3. Scrub and anonymise personal identifying fields while preserving non-PII metrics for statutory accounting
  await prisma.member.update({
    where: { id },
    data: {
      name: '[ERASED]',
      phone: `[ERASED-${existing.id.slice(0, 8)}]`,
      email: null,
      dateOfBirth: null,
      anniversaryDate: null,
      familyDob1: null,
      familyDob2: null,
      familyDob3: null,
      physicalCardNumber: null,
      notes: null,
      publicToken: `ERASED-${erasureId}`,
      status: 'deactivated',
      referralCode: null,
    },
  });

  // 4. Record audit log
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: auth.userId,
      merchantId: existing.merchantId,
      action: 'member_erasure_dpdp',
      detail: `Scrubbed PII and deactivated member ${existing.memberCode} under DPDP Act Section 13.`,
    },
  }).catch(() => {});

  return NextResponse.json({
    message: 'Member personal data scrubbed and erased under DPDP Act Section 13.',
    erasure_id: erasureId,
  });
}
