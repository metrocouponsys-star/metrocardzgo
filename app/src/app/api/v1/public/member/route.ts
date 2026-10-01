/** GET /api/v1/public/member — public member lookup by token or phone (rate-limited) */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const phone = url.searchParams.get('phone');
  const merchantId = url.searchParams.get('merchant_id');

  if (!token && !phone) {
    return NextResponse.json({ detail: 'token or phone required' }, { status: 400 });
  }

  const member = token
    ? await prisma.member.findUnique({
        where: { publicToken: token },
        include: {
          membershipType: true,
          merchant: { select: { businessName: true, logoUrl: true, category: true } },
          offerStates: {
            where: { status: 'active' },
            include: { offerTemplate: true },
          },
        },
      })
    : await prisma.member.findFirst({
        where: {
          phone: { endsWith: (phone ?? '').slice(-10) },
          ...(merchantId ? { merchantId } : {}),
        },
        include: {
          membershipType: true,
          merchant: { select: { businessName: true, logoUrl: true, category: true } },
          offerStates: { where: { status: 'active' }, include: { offerTemplate: true } },
        },
      });

  if (!member || member.status === 'deactivated') {
    return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: member.id,
    name: member.name,
    member_code: member.memberCode,
    phone: member.phone,
    status: member.status,
    expiry_date: member.expiryDate,
    loyalty_points: member.loyaltyPoints,
    total_visits: member.totalVisits,
    membership_type: member.membershipType,
    merchant: member.merchant,
    active_offers: member.offerStates,
    public_token: member.publicToken,
  });
}
