import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { id } = await params;
    const draw = await prisma.luckyDraw.findFirst({
      where: { id, merchantId },
      include: { entries: true },
    });

    if (!draw) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Draw not found' }, { status: 404 }));
    }

    return addSecurityHeaders(NextResponse.json(draw));
  } catch (error: any) {
    console.error('[lucky-draws/[id] GET]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.luckyDraw.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Draw not found' }, { status: 404 }));
    }

    const updated = await prisma.luckyDraw.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        prize: body.prize !== undefined ? body.prize : existing.prize,
        prizes: body.prizes !== undefined ? body.prizes : existing.prizes,
        drawDate: body.draw_date !== undefined ? new Date(body.draw_date) : existing.drawDate,
        minPoints: body.min_points !== undefined ? body.min_points : existing.minPoints,
        minVisits: body.min_visits !== undefined ? body.min_visits : existing.minVisits,
        status: body.status !== undefined ? body.status : existing.status,
      },
    });

    return addSecurityHeaders(NextResponse.json(updated));
  } catch (error: any) {
    console.error('[lucky-draws/[id] PATCH]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { id } = await params;
    const existing = await prisma.luckyDraw.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Draw not found' }, { status: 404 }));
    }

    await prisma.luckyDraw.delete({
      where: { id },
    });

    return addSecurityHeaders(NextResponse.json({ success: true, message: 'Lucky draw deleted' }));
  } catch (error: any) {
    console.error('[lucky-draws/[id] DELETE]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
