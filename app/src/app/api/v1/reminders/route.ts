/** GET/POST /api/v1/reminders — ReminderRule CRUD */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const rules = await prisma.reminderRule.findMany({
    where: { merchantId },
    orderBy: { triggerType: 'asc' },
  });
  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();
  const rule = await prisma.reminderRule.create({
    data: {
      id: crypto.randomUUID(),
      merchantId,
      triggerType: body.trigger_type,
      channel: body.channel,
      templateText: body.template_text,
      thresholdValue: body.threshold_value ?? null,
      active: body.active ?? true,
      sendTime: body.send_time ?? null,
      daysBefore: body.days_before ?? 0,
      timezone: body.timezone ?? 'Asia/Kolkata',
    },
  });
  return NextResponse.json(rule, { status: 201 });
}
