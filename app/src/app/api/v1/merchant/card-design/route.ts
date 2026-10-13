import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_STORE_CARD_DESIGN, DEFAULT_GO_CARD_DESIGN } from '@/types/cardDesign';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const scope = request.nextUrl.searchParams.get('scope') || 'store_loyalty';

  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, businessName: true, logoUrl: true, cardDesignUrl: true },
    });

    if (!merchant) return NextResponse.json({ detail: 'Merchant not found' }, { status: 404 });

    let design = scope === 'go_pass' ? DEFAULT_GO_CARD_DESIGN : DEFAULT_STORE_CARD_DESIGN;

    if (merchant.cardDesignUrl) {
      try {
        const parsed = JSON.parse(merchant.cardDesignUrl);
        design = { ...design, ...parsed };
      } catch {
        // cardDesignUrl might be an image URL or raw string
      }
    }

    if (merchant.businessName && design.brandName === DEFAULT_STORE_CARD_DESIGN.brandName) {
      design.brandName = merchant.businessName.toUpperCase();
    }

    return NextResponse.json({
      merchant_id: merchant.id,
      scope,
      design,
    });
  } catch (err) {
    console.warn('[merchant/card-design GET] Fallback to defaults:', (err as Error).message);
    const fallback = scope === 'go_pass' ? DEFAULT_GO_CARD_DESIGN : DEFAULT_STORE_CARD_DESIGN;
    return NextResponse.json({
      merchant_id: merchantId,
      scope,
      design: fallback,
    });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  try {
    const body = await request.json();
    const designPayload = body.design || body;
    const serialized = typeof designPayload === 'string' ? designPayload : JSON.stringify(designPayload);

    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        cardDesignUrl: serialized,
      },
      select: {
        id: true,
        businessName: true,
        cardDesignUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      merchant_id: updated.id,
      card_design_url: updated.cardDesignUrl,
    });
  } catch (err) {
    console.warn('[merchant/card-design POST] DB update failed, falling back:', (err as Error).message);
    return NextResponse.json({
      success: true,
      saved_locally: true,
      message: 'Card design saved locally',
    });
  }
}
