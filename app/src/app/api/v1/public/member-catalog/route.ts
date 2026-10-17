import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPublicMemberViewFromDb, buildPublicMemberViewFromMock } from '@/lib/publicMemberView';
import { members as mockMembers } from '@/api/mockData';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/public/member-catalog?member_id=...&merchant_id=...
 * Public read-only catalog endpoint returning rewards, coupons, and active offers.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get('member_id') || '';
  const merchantId = searchParams.get('merchant_id') || '';

  if (memberId) {
    try {
      const fullView = await buildPublicMemberViewFromDb(memberId);
      if (fullView) {
        return NextResponse.json({
          rewards: fullView.rewards || [],
          coupons: fullView.coupons || [],
          offers: fullView.offers || [],
        });
      }
    } catch {
      // Fall through to mock
    }

    const mockCandidate = mockMembers.find((m) => m.id === memberId);
    if (mockCandidate) {
      const mockView = buildPublicMemberViewFromMock(mockCandidate);
      return NextResponse.json({
        rewards: mockView.rewards || [],
        coupons: mockView.coupons || [],
        offers: mockView.offers || [],
      });
    }
  }

  if (merchantId) {
    try {
      const [coupons, rewards, templates] = await Promise.all([
        prisma.couponCode.findMany({
          where: { merchantId, isActive: true },
        }),
        prisma.rewardCatalog.findMany({
          where: { merchantId, isActive: true },
        }),
        prisma.offerTemplate.findMany({
          where: { merchantId, active: true },
        }),
      ]);

      const now = new Date();
      return NextResponse.json({
        coupons: coupons
          .filter((c) => !c.expiresAt || new Date(c.expiresAt) >= now)
          .map((c) => ({
            id: c.id,
            code: c.code,
            discount_type: (c.discountType === 'percent' ? 'percent' : 'flat') as 'flat' | 'percent',
            value: Number(c.value || 0),
            min_purchase: Number(c.minPurchase || 0),
            active_days: c.activeDays || undefined,
            expires_at: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : null,
          })),
        rewards: rewards
          .filter((r) => r.quantityAvailable === null || r.quantityAvailable === undefined || r.quantityAvailable > 0)
          .map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description || '',
            points_cost: Number(r.pointsCost || 0),
            quantity_available: r.quantityAvailable ?? null,
          })),
        offers: templates.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          offer_type: t.offerType,
          value: Number(t.value || 0),
          remaining_qty: null,
          is_points_redemption: !!t.isPointsRedemption,
          points_cost: Number(t.loyaltyPointsCost || 0),
        })),
      });
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({ rewards: [], coupons: [], offers: [] });
}
