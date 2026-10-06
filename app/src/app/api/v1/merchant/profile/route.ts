import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!merchant) return NextResponse.json({ detail: 'Merchant not found' }, { status: 404 });

  return NextResponse.json({
    id: merchant.id,
    business_name: merchant.businessName,
    category: merchant.category,
    plan_tier: merchant.planTier,
    whatsapp_number: merchant.whatsappNumber,
    logo_url: merchant.logoUrl,
    address: merchant.address,
    status: merchant.status,
    approval_status: merchant.approvalStatus,
    referral_bonus_points: Number(merchant.referralBonusPoints || 50),
    created_at: merchant.createdAt.toISOString(),
    member_count: merchant._count?.members || 0,
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();

  const updateData: any = {};
  if (body.business_name !== undefined) updateData.businessName = body.business_name;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.whatsapp_number !== undefined) updateData.whatsappNumber = body.whatsapp_number;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.referral_bonus_points !== undefined) updateData.referralBonusPoints = body.referral_bonus_points;

  const updated = await prisma.merchant.update({
    where: { id: merchantId },
    data: updateData,
    include: {
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    business_name: updated.businessName,
    category: updated.category,
    plan_tier: updated.planTier,
    whatsapp_number: updated.whatsappNumber,
    logo_url: updated.logoUrl,
    address: updated.address,
    status: updated.status,
    approval_status: updated.approvalStatus,
    referral_bonus_points: Number(updated.referralBonusPoints || 50),
    created_at: updated.createdAt.toISOString(),
    member_count: updated._count?.members || 0,
  });
}
