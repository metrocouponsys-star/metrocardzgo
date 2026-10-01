/**
 * POST /api/v1/auth/otp/send
 * Generate OTP → store in MySQL otp_codes table → send via MSG91
 * Replaces Redis-based OTP storage from the Python backend.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOtp, sendOtpSms } from '@/lib/msg91';

const OTP_TTL_MINUTES = 5;

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    const cleanPhone = (phone ?? '').replace(/\s/g, '');

    // Always return 200 — never reveal if the user exists
    const user = await prisma.merchantUser.findFirst({
      where: { phone: { endsWith: cleanPhone.slice(-10) } },
    });
    if (!user) {
      return NextResponse.json({ message: 'OTP sent if number is registered' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Delete any existing OTPs for this phone before inserting new one
    await prisma.otpCode.deleteMany({ where: { phone: cleanPhone } });
    await prisma.otpCode.create({ data: { phone: cleanPhone, code: otp, expiresAt } });

    await sendOtpSms(cleanPhone, otp);

    return NextResponse.json({ message: 'OTP sent if number is registered' });
  } catch (err) {
    console.error('[otp/send]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
