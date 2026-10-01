/**
 * POST /api/v1/cron/reminder-scan
 * Exact port of Python Celery task: hourly_reminder_scan
 *
 * Hourly sweep (set in Hostinger hPanel Cron Jobs):
 *   crontab: 0 * * * *  (every hour on :00)
 *
 * Checks all active ReminderRules, finds matching members,
 * sends SMS/WhatsApp via MSG91 / AiSensy.
 * Protected by X-Cron-Secret header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtpSms } from '@/lib/msg91';
import { sendWhatsApp } from '@/lib/aisensy';
import crypto from 'crypto';

function interpolateTemplate(template: string, member: {
  name: string;
  memberCode: string;
  expiryDate: Date;
  loyaltyPoints: number | null;
}): string {
  return template
    .replace(/\{member_name\}/gi, member.name)
    .replace(/\{member_code\}/gi, member.memberCode)
    .replace(/\{expiry_date\}/gi, member.expiryDate.toLocaleDateString('en-IN'))
    .replace(/\{loyalty_points\}/gi, String(member.loyaltyPoints ?? 0));
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentHour = now.getUTCHours();
    let sent = 0;
    let skipped = 0;

    // Fetch all active reminder rules
    const rules = await prisma.reminderRule.findMany({
      where: { active: true },
      include: { merchant: true },
    });

    for (const rule of rules) {
      // Check if this rule should fire this hour
      if (rule.sendTime) {
        const ruleHour = parseInt(rule.sendTime.split(':')[0]);
        if (ruleHour !== currentHour) { skipped++; continue; }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(today.getTime() + rule.daysBefore * 24 * 60 * 60 * 1000);
      const targetMonth = targetDate.getMonth() + 1;
      const targetDay = targetDate.getDate();

      let members: any[] = [];

      if (rule.triggerType === 'birthday') {
        // MySQL: MONTH(date_of_birth) = ? AND DAY(date_of_birth) = ?
        members = await prisma.$queryRaw`
          SELECT * FROM members
          WHERE merchant_id = ${rule.merchantId}
          AND status IN ('active','expiring_soon')
          AND MONTH(date_of_birth) = ${targetMonth}
          AND DAY(date_of_birth) = ${targetDay}
        `;
      } else if (rule.triggerType === 'anniversary') {
        members = await prisma.$queryRaw`
          SELECT * FROM members
          WHERE merchant_id = ${rule.merchantId}
          AND status IN ('active','expiring_soon')
          AND MONTH(anniversary_date) = ${targetMonth}
          AND DAY(anniversary_date) = ${targetDay}
        `;
      } else if (rule.triggerType === 'expiry') {
        const expiryTarget = new Date(today.getTime() + rule.daysBefore * 24 * 60 * 60 * 1000);
        const nextDay = new Date(expiryTarget.getTime() + 24 * 60 * 60 * 1000);
        members = await prisma.member.findMany({
          where: {
            merchantId: rule.merchantId,
            status: { in: ['active', 'expiring_soon'] },
            expiryDate: { gte: expiryTarget, lt: nextDay },
          },
        });
      } else if (rule.triggerType === 'loyalty_threshold' && rule.thresholdValue) {
        members = await prisma.member.findMany({
          where: {
            merchantId: rule.merchantId,
            loyaltyPoints: { gte: Number(rule.thresholdValue) },
          },
        });
      }

      for (const member of members) {
        const message = interpolateTemplate(rule.templateText, {
          name: member.name,
          memberCode: member.member_code ?? member.memberCode,
          expiryDate: new Date(member.expiry_date ?? member.expiryDate),
          loyaltyPoints: member.loyalty_points ?? member.loyaltyPoints,
        });

        const phone = member.phone;
        let success = false;

        if (rule.channel === 'sms') {
          success = await sendOtpSms(phone, message);
        } else if (rule.channel === 'whatsapp') {
          success = await sendWhatsApp(phone, message);
        }

        // Log message
        await prisma.messageLog.create({
          data: {
            id: crypto.randomUUID(),
            memberId: member.id,
            reminderRuleId: rule.id,
            channel: rule.channel,
            status: success ? 'sent' : 'failed',
          },
        });

        if (success) sent++;
      }
    }

    const result = { sent, skipped, ran_at: now.toISOString() };
    console.log('[cron/reminder-scan]', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/reminder-scan] ERROR:', err);
    return NextResponse.json({ detail: 'Scan failed', error: String(err) }, { status: 500 });
  }
}
