/** GET/POST /api/v1/points-rules — PointsRule CRUD */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const rules = await prisma.pointsRule.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();
  const rule = await prisma.pointsRule.create({
    data: {
      id: crypto.randomUUID(),
      merchantId,
      ruleType: body.rule_type,   // 'per_visit' | 'per_rupee_spent'
      pointsValue: body.points_value,
      spendUnit: body.spend_unit ?? 1,
      isActive: body.is_active ?? true,
    },
  });
  return NextResponse.json(rule, { status: 201 });
}
