import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnerOrAdmin, getMerchantId } from '@/lib/auth';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireOwnerOrAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { id: rawId } = await params;
  const decodedId = decodeURIComponent(rawId).trim();

  const body = await request.json().catch(() => ({}));
  const cardDesignDataUrl = body.card_design_data_url || body.cardDesignDataUrl;

  const merchant = await prisma.merchant.update({
    where: { id: decodedId },
    data: { cardDesignUrl: cardDesignDataUrl },
  });

  return addSecurityHeaders(NextResponse.json(merchant));
}
