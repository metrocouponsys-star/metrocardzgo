/** POST /api/v1/auth/otp/verify — verify OTP from MySQL, return JWT */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildLoginResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();
    const cleanPhone = (phone ?? '').replace(/\s/g, '');

    const record = await prisma.otpCode.findFirst({
      where: { phone: cleanPhone },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.code !== String(otp) || record.expiresAt < new Date()) {
      return NextResponse.json({ detail: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Consume OTP — delete after use
    await prisma.otpCode.delete({ where: { id: record.id } });

    const user = await prisma.merchantUser.findFirst({
      where: { phone: { endsWith: cleanPhone.slice(-10) } },
    });
    if (!user) {
      return NextResponse.json({ detail: 'User not found' }, { status: 401 });
    }

    return NextResponse.json(await buildLoginResponse(user.id));
  } catch (err) {
    console.error('[otp/verify]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
