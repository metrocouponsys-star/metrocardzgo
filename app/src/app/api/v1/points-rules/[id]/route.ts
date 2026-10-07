import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

async function handleUpdate(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.pointsRule.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Rule not found' }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.pointsRule.update({
    where: { id },
    data: {
      ruleType: body.rule_type !== undefined ? body.rule_type : existing.ruleType,
      pointsValue: body.points_value !== undefined ? body.points_value : existing.pointsValue,
      spendUnit: body.spend_unit !== undefined ? body.spend_unit : existing.spendUnit,
      isActive: body.is_active !== undefined ? body.is_active : existing.isActive,
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
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.pointsRule.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Rule not found' }, { status: 404 });

  await prisma.pointsRule.delete({ where: { id } });
  return NextResponse.json({ message: 'Points rule deleted' });
}
