/** GET/POST /api/v1/campaigns + POST /api/v1/campaigns/[id]/send */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const campaigns = await prisma.campaign.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();

  // Calculate audience size
  const audienceWhere: any = { merchantId };
  if (body.target_audience === 'by_membership_type' && body.target_membership_type_id) {
    audienceWhere.membershipTypeId = body.target_membership_type_id;
  } else if (body.target_audience === 'expiring_soon') {
    audienceWhere.status = 'expiring_soon';
  }
  const audienceSize = await prisma.member.count({ where: audienceWhere });

  const campaign = await prisma.campaign.create({
    data: {
      id: crypto.randomUUID(),
      merchantId,
      name: body.name,
      targetAudience: body.target_audience,
      targetMembershipTypeId: body.target_membership_type_id ?? null,
      channel: body.channel,
      templateText: body.template_text,
      scheduledAt: body.scheduled_at ? new Date(body.scheduled_at) : null,
      status: 'draft',
      audienceSize,
    },
  });
  return NextResponse.json(campaign, { status: 201 });
}
