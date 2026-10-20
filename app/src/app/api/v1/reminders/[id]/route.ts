import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

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

    const existing = await prisma.reminderRule.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Reminder rule not found' }, { status: 404 }));
    }

    const updated = await prisma.reminderRule.update({
      where: { id },
      data: {
        triggerType: body.trigger_type !== undefined ? body.trigger_type : existing.triggerType,
        channel: body.channel !== undefined ? body.channel : existing.channel,
        templateText: body.template_text !== undefined ? body.template_text : existing.templateText,
        thresholdValue: body.threshold_value !== undefined ? body.threshold_value : existing.thresholdValue,
        active: body.active !== undefined ? body.active : existing.active,
        sendTime: body.send_time !== undefined ? body.send_time : existing.sendTime,
        daysBefore: body.days_before !== undefined ? body.days_before : existing.daysBefore,
        timezone: body.timezone !== undefined ? body.timezone : existing.timezone,
      },
    });

    return addSecurityHeaders(NextResponse.json(updated));
  } catch (error: any) {
    console.error('[reminders/[id] PATCH]', error);
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
    const existing = await prisma.reminderRule.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Reminder rule not found' }, { status: 404 }));
    }

    await prisma.reminderRule.delete({
      where: { id },
    });

    return addSecurityHeaders(NextResponse.json({ success: true, message: 'Reminder rule deleted' }));
  } catch (error: any) {
    console.error('[reminders/[id] DELETE]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
