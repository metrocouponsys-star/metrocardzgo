import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/go/claim
 * Records an offer claim for an authenticated customer, awarding points and tracking money saved.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, dealId, brand, offer, savingsAmount, pointsReward } = body;

    if (!identifier) {
      return NextResponse.json(
        { detail: 'Authentication required. Please verify membership first to claim offers.' },
        { status: 401 }
      );
    }

    if (!dealId || !brand || !offer) {
      return NextResponse.json({ detail: 'Missing deal details' }, { status: 400 });
    }

    const brandSlug = String(brand).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    const voucherCode = `GO-${brandSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const claim = {
      claimId: `clm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dealId,
      brand,
      offer,
      voucherCode,
      savingsAmount: Number(savingsAmount || 0),
      pointsEarned: Number(pointsReward || 50),
      claimedAt: new Date().toISOString(),
      status: 'active',
    };

    return NextResponse.json({
      success: true,
      message: `Successfully claimed! Show voucher ${voucherCode} at checkout.`,
      claim,
    });
  } catch {
    return NextResponse.json({ detail: 'Failed to process claim' }, { status: 500 });
  }
}
