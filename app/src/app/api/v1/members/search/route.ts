/** GET /api/v1/members/search?q=... */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const q = new URL(request.url).searchParams.get('q') ?? '';
  if (!q.trim()) return NextResponse.json([]);

  const qs = q.replace(/\s/g, '').toLowerCase();

  const members = await prisma.member.findMany({
    where: {
      merchantId,
      OR: [
        { name: { contains: qs } },
        { phone: { contains: qs } },
        { memberCode: { contains: qs } },
        { publicToken: { contains: qs } },
        { referralCode: { contains: qs } },
        { email: { contains: qs } },
      ],
    },
    include: { membershipType: true },
    take: 20,
  });
  return NextResponse.json(members);
}
