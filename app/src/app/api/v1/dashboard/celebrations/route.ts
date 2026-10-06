import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const url = new URL(request.url);
  const daysAhead = Math.max(1, Math.min(365, parseInt(url.searchParams.get('days_ahead') ?? '30')));

  const members = await prisma.member.findMany({
    where: {
      merchantId,
      status: 'active',
      OR: [
        { dateOfBirth: { not: null } },
        { anniversaryDate: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      phone: true,
      memberCode: true,
      dateOfBirth: true,
      anniversaryDate: true,
      loyaltyPoints: true,
    },
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const today = new Date(currentYear, now.getMonth(), now.getDate());

  const celebrations: any[] = [];

  for (const m of members) {
    // Check Birthday
    if (m.dateOfBirth) {
      const dob = new Date(m.dateOfBirth);
      let target = new Date(currentYear, dob.getMonth(), dob.getDate());
      if (target < today) {
        target = new Date(currentYear + 1, dob.getMonth(), dob.getDate());
      }
      const diffMs = target.getTime() - today.getTime();
      const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (daysUntil <= daysAhead) {
        celebrations.push({
          member_id: m.id,
          name: m.name,
          phone: m.phone,
          member_code: m.memberCode,
          event_type: 'birthday',
          event_date: target.toISOString().split('T')[0],
          days_until: daysUntil,
          loyalty_points: Number(m.loyaltyPoints || 0),
        });
      }
    }

    // Check Anniversary
    if (m.anniversaryDate) {
      const ann = new Date(m.anniversaryDate);
      let target = new Date(currentYear, ann.getMonth(), ann.getDate());
      if (target < today) {
        target = new Date(currentYear + 1, ann.getMonth(), ann.getDate());
      }
      const diffMs = target.getTime() - today.getTime();
      const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (daysUntil <= daysAhead) {
        celebrations.push({
          member_id: m.id,
          name: m.name,
          phone: m.phone,
          member_code: m.memberCode,
          event_type: 'anniversary',
          event_date: target.toISOString().split('T')[0],
          days_until: daysUntil,
          loyalty_points: Number(m.loyaltyPoints || 0),
        });
      }
    }
  }

  // Sort by days_until ascending
  celebrations.sort((a, b) => a.days_until - b.days_until);

  return NextResponse.json(celebrations);
}
