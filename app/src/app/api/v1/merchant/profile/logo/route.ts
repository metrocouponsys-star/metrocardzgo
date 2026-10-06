import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();
  const logoUrl = body.logo_data_url || body.logo_url || null;

  const updated = await prisma.merchant.update({
    where: { id: merchantId },
    data: { logoUrl },
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
