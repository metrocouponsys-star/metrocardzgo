import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const tier = await prisma.memberTier.findUnique({
      where: { memberId: id },
    });

    if (!tier) {
      return addSecurityHeaders(
        NextResponse.json({
          tier_name: 'Bronze',
          tier_slug: 'bronze',
          next_tier_points_needed: 100,
        })
      );
    }

    return addSecurityHeaders(
      NextResponse.json({
        tier_name: tier.tierName,
        tier_slug: tier.tierSlug,
        next_tier_points_needed: tier.nextTierPointsNeeded ? Number(tier.nextTierPointsNeeded) : null,
      })
    );
  } catch (err: any) {
    return addSecurityHeaders(
      NextResponse.json({
        tier_name: 'Bronze',
        tier_slug: 'bronze',
        next_tier_points_needed: 100,
      })
    );
  }
}
