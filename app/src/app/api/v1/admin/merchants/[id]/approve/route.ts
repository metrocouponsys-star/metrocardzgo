import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id: rawId } = await params;
  const decodedId = decodeURIComponent(rawId).trim();

  const merchant = await prisma.merchant.update({
    where: { id: decodedId },
    data: { approvalStatus: 'approved', status: 'active' },
  });

  return addSecurityHeaders(NextResponse.json(merchant));
}
