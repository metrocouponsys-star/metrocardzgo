/** GET /api/v1/members/by-token/[token] — public token lookup for QR scanning */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  const member = await prisma.member.findUnique({
    where: { publicToken: token },
    include: {
      membershipType: true,
      merchant: { select: { businessName: true, logoUrl: true } },
      offerStates: { include: { offerTemplate: true } },
    },
  });
  if (!member || member.status === 'deactivated') {
    return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
  }
  return NextResponse.json(member);
}
