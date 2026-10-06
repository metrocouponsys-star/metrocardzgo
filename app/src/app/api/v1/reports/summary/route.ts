import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { addSecurityHeaders } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request) || auth.merchantId;
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [activeMembers, expiringSoon, redemptions, monthlyTxns] = await Promise.all([
      prisma.member.count({
        where: { merchantId, status: 'active' },
      }),
      prisma.member.count({
        where: {
          merchantId,
          expiryDate: {
            gte: now,
            lte: thirtyDaysAhead,
          },
        },
      }),
      prisma.redemptionLog.findMany({
        where: { member: { merchantId } },
        include: {
          member: { select: { name: true, memberCode: true } },
          offerTemplate: { select: { title: true, offerType: true } },
          staffUser: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.loyaltyTransaction.findMany({
        where: {
          merchantId,
          createdAt: { gte: startOfMonth },
        },
        select: {
          type: true,
          points: true,
        },
      }).catch(() => []),
    ]);

    // Redemptions by offer type & over time
    const offerCounts: Record<string, number> = {};
    const dateCounts: Record<string, number> = {};

    for (const r of redemptions) {
      const type = r.offerTemplate?.offerType || 'general';
      offerCounts[type] = (offerCounts[type] || 0) + 1;

      const dateStr = r.createdAt.toISOString().split('T')[0];
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    }

    let pointsIssuedMonth = 0;
    let pointsRedeemedMonth = 0;

    for (const tx of monthlyTxns) {
      const p = Number(tx.points || 0);
      if (tx.type === 'earn') {
        pointsIssuedMonth += p;
      } else if (tx.type === 'redeem') {
        pointsRedeemedMonth += p;
      }
    }

    const redemptions_by_offer = Object.entries(offerCounts).map(([offer_type, count]) => ({
      offer_type,
      count,
    }));

    // Last 14 days over time
    const redemptions_over_time: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().split('T')[0];
      redemptions_over_time.push({
        date: ds,
        count: dateCounts[ds] || 0,
      });
    }

    let mostUsed = 'N/A';
    let maxCount = 0;
    for (const [o, cnt] of Object.entries(offerCounts)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        mostUsed = o;
      }
    }

    const all_redemptions = redemptions.map(r => ({
      id: r.id,
      member_id: r.memberId,
      member: r.member ? { name: r.member.name, member_code: r.member.memberCode } : undefined,
      offer_template_id: r.offerTemplateId,
      offer: r.offerTemplate ? { title: r.offerTemplate.title, offer_type: r.offerTemplate.offerType } : undefined,
      merchant_user_id: r.merchantUserId,
      staff_name: r.staffUser?.name,
      amount: Number(r.amount || 0),
      created_at: r.createdAt.toISOString(),
    }));

    return addSecurityHeaders(NextResponse.json({
      redemptions_by_offer,
      redemptions_over_time,
      all_redemptions,
      summary: {
        total_redemptions: redemptions.length,
        active_members: activeMembers,
        expiring_soon: expiringSoon,
        most_used_offer: mostUsed,
        points_issued_month: pointsIssuedMonth,
        points_redeemed_month: pointsRedeemedMonth,
      },
    }));
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
