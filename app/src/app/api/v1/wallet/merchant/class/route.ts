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

    const wc = await prisma.merchantWalletClass.findFirst({
      where: { merchantId },
    });

    if (wc) {
      return addSecurityHeaders(NextResponse.json({
        id: wc.id,
        merchant_id: wc.merchantId,
        google_class_id: wc.googleClassId,
        logo_url: wc.logoUrl,
        background_color: wc.backgroundColor ?? '#1A1A1A',
        created_at: wc.createdAt.toISOString(),
      }));
    }

    // Default configuration if not yet customized
    return addSecurityHeaders(NextResponse.json({
      id: `wc-${merchantId}`,
      merchant_id: merchantId,
      google_class_id: `METROCARDZ.${merchantId}`,
      logo_url: null,
      background_color: '#1A1A1A',
      created_at: new Date().toISOString(),
    }));
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request) || auth.merchantId;
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const body = await request.json().catch(() => ({}));
    const wc = await prisma.merchantWalletClass.upsert({
      where: { merchantId },
      create: {
        merchantId,
        googleClassId: body.google_class_id || `METROCARDZ.${merchantId}`,
        backgroundColor: body.background_color || '#1A1A1A',
        logoUrl: body.logo_url || null,
      },
      update: {
        googleClassId: body.google_class_id || undefined,
        backgroundColor: body.background_color || undefined,
        logoUrl: body.logo_url || undefined,
      },
    });

    return addSecurityHeaders(NextResponse.json({
      id: wc.id,
      merchant_id: wc.merchantId,
      google_class_id: wc.googleClassId,
      logo_url: wc.logoUrl,
      background_color: wc.backgroundColor,
      created_at: wc.createdAt.toISOString(),
    }));
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
