import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeMemberData } from '@/lib/dataNormalizer';
import { addSecurityHeaders } from '@/lib/security';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const { id } = await params;

    const member = await prisma.member.findFirst({
      where: { id, merchantId },
      include: { membershipType: true },
    });

    if (!member) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Member not found' }, { status: 404 }));
    }

    const now = new Date();
    const currentExpiry = member.expiryDate ? new Date(member.expiryDate) : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    const updated = await prisma.member.update({
      where: { id: member.id },
      data: {
        expiryDate: newExpiry,
        status: 'active',
      },
      include: {
        membershipType: true,
        offerStates: { include: { offerTemplate: true } },
      },
    });

    // Record audit log in loyalty transactions
    await prisma.loyaltyTransaction.create({
      data: {
        id: crypto.randomUUID(),
        memberId: member.id,
        merchantId,
        type: 'earn',
        points: 0,
        balanceAfter: member.loyaltyPoints ?? 0,
        note: `Membership renewed for 1 year until ${newExpiry.toISOString().split('T')[0]}`,
      },
    }).catch(() => {});

    return addSecurityHeaders(NextResponse.json(normalizeMemberData(updated)));
  } catch (error: any) {
    console.error('[members/[id]/renew POST]', error);
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Renewal failed' }, { status: 500 })
    );
  }
}
