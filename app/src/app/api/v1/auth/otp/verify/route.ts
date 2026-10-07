/** POST /api/v1/auth/otp/verify — verify OTP from MySQL, return JWT */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildLoginResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();
    const cleanPhone = (phone ?? '').replace(/\s/g, '');
    const digitsOnly = cleanPhone.replace(/\D/g, '');

    // 1. Strict phone validation (must have at least 10 digits)
    if (!digitsOnly || digitsOnly.length < 10) {
      return NextResponse.json({ detail: 'Valid 10-digit mobile number required' }, { status: 400 });
    }
    const last10 = digitsOnly.slice(-10);
    const codeStr = String(otp ?? '').trim();

    if (!codeStr || codeStr.length < 4) {
      return NextResponse.json({ detail: 'Valid OTP code required' }, { status: 400 });
    }

    // 2. Fetch latest OTP record for this phone
    const record = await prisma.otpCode.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: digitsOnly },
          { phone: { endsWith: last10 } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await prisma.otpCode.delete({ where: { id: record.id } }).catch(() => {});
      }
      return NextResponse.json({ detail: 'Invalid or expired OTP' }, { status: 401 });
    }

    // 3. Verify OTP code — invalidate on mismatch to prevent brute-force attacks
    if (record.code !== codeStr) {
      // Invalidate the OTP to block brute-force guessing
      await prisma.otpCode.delete({ where: { id: record.id } }).catch(() => {});
      return NextResponse.json({ detail: 'Incorrect OTP. Please request a new code.' }, { status: 401 });
    }

    // 4. Consume OTP — delete after successful use
    await prisma.otpCode.delete({ where: { id: record.id } }).catch(() => {});

    // 5. Locate user strictly by last 10 digits
    const user = await prisma.merchantUser.findFirst({
      where: { phone: { endsWith: last10 } },
      include: { merchant: { select: { status: true, businessName: true } } },
    });
    if (!user) {
      return NextResponse.json({ detail: 'No registered user found for this number' }, { status: 401 });
    }

    // 6. Check merchant account status
    if (user.merchant && user.merchant.status === 'suspended') {
      return NextResponse.json({ detail: 'Merchant account is suspended. Please contact support.' }, { status: 403 });
    }

    const loginResponse = await buildLoginResponse(user.id);
    return NextResponse.json(loginResponse);
  } catch (err) {
    console.error('[otp/verify]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
