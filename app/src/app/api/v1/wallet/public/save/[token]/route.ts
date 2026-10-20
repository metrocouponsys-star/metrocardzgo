import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const member = await prisma.member.findUnique({
      where: { publicToken: token },
    });

    if (!member) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Member not found' }, { status: 404 }));
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://metrocardz.com';
    return NextResponse.redirect(`${baseUrl}/m/${token}`);
  } catch (error: any) {
    console.error('[wallet/public/save/[token] GET]', error);
    return addSecurityHeaders(NextResponse.json({ detail: 'Server error' }, { status: 500 }));
  }
}
