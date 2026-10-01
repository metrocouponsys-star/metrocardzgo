/** GET/POST/PUT/DELETE /api/v1/membership-types */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const types = await prisma.membershipType.findMany({
    where: { merchantId },
    include: {
      offerLinks: { include: { offer: true } },
      _count: { select: { members: true } },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(types);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();
  const type = await prisma.membershipType.create({
    data: {
      id: crypto.randomUUID(),
      merchantId,
      name: body.name,
      description: body.description ?? '',
    },
  });
  return NextResponse.json(type, { status: 201 });
}
