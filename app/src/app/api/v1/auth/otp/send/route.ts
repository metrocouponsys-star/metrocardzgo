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
    const digitsOnly = cleanPhone.replace(/\D/g, '');

    if (!digitsOnly || digitsOnly.length < 10) {
      return NextResponse.json({ detail: 'Valid 10-digit mobile number required' }, { status: 400 });
    }
    const last10 = digitsOnly.slice(-10);

    // 1. Rate limiting: enforce 60s cooldown between OTP requests for the same number
    const existingRecent = await prisma.otpCode.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: digitsOnly },
        ],
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (existingRecent) {
      return NextResponse.json(
        { detail: 'Please wait 60 seconds before requesting another OTP' },
        { status: 429 }
      );
    }

    // Always check user by last 10 digits
    const user = await prisma.merchantUser.findFirst({
      where: { phone: { endsWith: last10 } },
    });
    if (!user) {
      return NextResponse.json({ message: 'OTP sent if number is registered' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Delete any existing OTPs for this phone before inserting new one
    await prisma.otpCode.deleteMany({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: digitsOnly },
        ],
      },
    });
    await prisma.otpCode.create({ data: { phone: digitsOnly, code: otp, expiresAt } });

    await sendOtpSms(cleanPhone, otp);

    return NextResponse.json({ message: 'OTP sent if number is registered' });
  } catch (err) {
    console.error('[otp/send]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
