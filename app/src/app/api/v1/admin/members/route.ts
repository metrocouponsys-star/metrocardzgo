/**
 * GET /api/v1/admin/members
 * Super admin — browse all members across ALL merchants.
 *
 * Query params:
 *   search      — name/phone text search
 *   merchantId  — filter to one merchant
 *   status      — active | expired | suspended
 *   limit       — max (default 50, max 200)
 *   offset      — pagination
 *
 * DPDP: Phone/email always MASKED in response. Super admin cannot see raw PII.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { maskPhone } from '@/lib/dpdp';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== 'super_admin') {
    return NextResponse.json({ detail: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const search     = url.searchParams.get('search') ?? undefined;
  const merchantId = url.searchParams.get('merchantId') ?? undefined;
  const status     = url.searchParams.get('status') ?? undefined;
  const limit      = Math.min(parseInt(url.searchParams.get('limit')  ?? '50'), 200);
  const offset     = Math.max(parseInt(url.searchParams.get('offset') ?? '0'), 0);

  const digitSearch = search?.replace(/\D/g, '').slice(-10);

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where: {
        ...(merchantId ? { merchantId } : {}),
        ...(status     ? { status: status as any } : {}),
        ...(search     ? {
          OR: [
            { name:  { contains: search } },
            { memberCode: { contains: search } },
            ...(digitSearch?.length === 10 ? [{ phone: { endsWith: digitSearch } }] : []),
          ],
        } : {}),
      },
      select: {
        id: true,
        memberCode: true,
        name: true,
        phone: true,      // masked below
        status: true,
        joinedAt: true,
        expiryDate: true,
        loyaltyPoints: true,
        merchantId: true,
        merchant: { select: { businessName: true } },
        membershipType: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),

    prisma.member.count({
      where: {
        ...(merchantId ? { merchantId } : {}),
        ...(status     ? { status: status as any } : {}),
        ...(search     ? {
          OR: [
            { name:  { contains: search } },
            { memberCode: { contains: search } },
          ],
        } : {}),
      },
    }),
  ]);

  // DPDP: always mask phone
  const masked = members.map(m => ({
    ...m,
    phone: maskPhone(m.phone),
  }));

  return NextResponse.json({ total, members: masked, limit, offset });
}
