import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { id } = await params;
    const campaign = await prisma.campaign.findFirst({
      where: { id, merchantId },
    });

    if (!campaign) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Campaign not found' }, { status: 404 }));
    }

    return addSecurityHeaders(NextResponse.json(campaign));
  } catch (error: any) {
    console.error('[campaigns/[id] GET]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.campaign.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Campaign not found' }, { status: 404 }));
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        channel: body.channel !== undefined ? body.channel : existing.channel,
        targetAudience: (body.target_audience ?? body.audience) !== undefined ? (body.target_audience ?? body.audience) : existing.targetAudience,
        targetMembershipTypeId: (body.target_membership_type_id ?? body.membership_type_id) !== undefined ? (body.target_membership_type_id ?? body.membership_type_id) : existing.targetMembershipTypeId,
        templateText: (body.template_text ?? body.message_text) !== undefined ? (body.template_text ?? body.message_text) : existing.templateText,
        scheduledAt: body.scheduled_at !== undefined ? (body.scheduled_at ? new Date(body.scheduled_at) : null) : existing.scheduledAt,
        status: body.status !== undefined ? body.status : existing.status,
      },
    });

    return addSecurityHeaders(NextResponse.json(updated));
  } catch (error: any) {
    console.error('[campaigns/[id] PATCH]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { id } = await params;
    const existing = await prisma.campaign.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Campaign not found' }, { status: 404 }));
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return addSecurityHeaders(NextResponse.json({ success: true, message: 'Campaign deleted' }));
  } catch (error: any) {
    console.error('[campaigns/[id] DELETE]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
