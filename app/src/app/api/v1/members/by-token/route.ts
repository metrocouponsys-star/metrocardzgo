/** GET /api/v1/members/by-token?token=... — public token query param lookup for QR scanning */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return addSecurityHeaders(NextResponse.json({ detail: 'Token required' }, { status: 400 }));
  }

  const member = await prisma.member.findUnique({
    where: { publicToken: token },
    include: {
      membershipType: true,
      merchant: { select: { businessName: true, logoUrl: true } },
      offerStates: { include: { offerTemplate: true } },
    },
  });

  if (!member || member.status === 'deactivated') {
    return addSecurityHeaders(NextResponse.json({ detail: 'Member not found' }, { status: 404 }));
  }

  // Strip PII — this endpoint is public, return safe fields only
  const { phone, email, notes, familyDob1, familyDob2, familyDob3, ...safeData } = member;

  return addSecurityHeaders(NextResponse.json(safeData));
}
