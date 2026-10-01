/**
 * POST /api/v1/cron/member-status-sweep
 * Exact port of Python Celery task: nightly_member_status_sweep
 *
 * Nightly 02:00 IST sweep (set in Hostinger hPanel Cron Jobs):
 *   crontab: 30 20 * * *  (20:30 UTC = 02:00 IST)
 *
 * Protected by X-Cron-Secret header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  // Security: only allow cron requests with the correct secret
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiringSoonThreshold = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Mark expired
    const expiredResult = await prisma.member.updateMany({
      where: {
        expiryDate: { lt: today },
        status: { in: ['active', 'expiring_soon'] },
      },
      data: { status: 'expired' },
    });

    // 2. Mark expiring_soon
    const expiringSoonResult = await prisma.member.updateMany({
      where: {
        expiryDate: { gte: today, lt: expiringSoonThreshold },
        status: 'active',
      },
      data: { status: 'expiring_soon' },
    });

    // 3. Reset to active if renewed (expiry_date is now in future and status is expired)
    const resetResult = await prisma.member.updateMany({
      where: {
        expiryDate: { gte: expiringSoonThreshold },
        status: { in: ['expired', 'expiring_soon'] },
      },
      data: { status: 'active' },
    });

    // 4. Clean up expired OTP codes
    await prisma.otpCode.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const result = {
      expired: expiredResult.count,
      expiring_soon: expiringSoonResult.count,
      reset_to_active: resetResult.count,
      ran_at: new Date().toISOString(),
    };
    console.log('[cron/member-status-sweep]', result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/member-status-sweep] ERROR:', err);
    return NextResponse.json({ detail: 'Sweep failed', error: String(err) }, { status: 500 });
  }
}
