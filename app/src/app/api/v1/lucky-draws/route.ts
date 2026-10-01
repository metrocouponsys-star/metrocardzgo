/** GET/POST /api/v1/lucky-draws — LuckyDraw CRUD + run draw */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const draws = await prisma.luckyDraw.findMany({
    where: { merchantId },
    include: { entries: { select: { memberId: true } } },
    orderBy: { drawDate: 'desc' },
  });
  return NextResponse.json(draws);
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const body = await request.json();

  // Run draw (action=run)
  if (body.action === 'run') {
    const draw = await prisma.luckyDraw.findFirst({
      where: { id: body.draw_id, merchantId },
      include: { entries: true },
    });
    if (!draw) return NextResponse.json({ detail: 'Draw not found' }, { status: 404 });
    if (draw.entries.length === 0) {
      return NextResponse.json({ detail: 'No entries in this draw' }, { status: 400 });
    }

    const shuffled = [...draw.entries].sort(() => Math.random() - 0.5);
    const prizes = (draw.prizes as string[]) ?? [draw.prize];
    const winnerCount = Math.min(prizes.length, shuffled.length);
    const winners = shuffled.slice(0, winnerCount);

    await prisma.luckyDraw.update({
      where: { id: draw.id },
      data: {
        status: 'completed',
        winnerMemberId: winners[0]?.memberId ?? null,
        winnerMemberIds: winners.map(w => w.memberId),
      },
    });
    return NextResponse.json({ winners: winners.map(w => w.memberId), prizes });
  }

  // Enter draw (action=enter)
  if (body.action === 'enter') {
    const entry = await prisma.luckyDrawEntry.create({
      data: {
        id: crypto.randomUUID(),
        drawId: body.draw_id,
        memberId: body.member_id,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  }

  const draw = await prisma.luckyDraw.create({
    data: {
      id: crypto.randomUUID(),
      merchantId,
      name: body.name,
      prize: body.prize ?? '',
      prizes: body.prizes ?? null,
      drawDate: new Date(body.draw_date),
      minPoints: body.min_points ?? 0,
      minVisits: body.min_visits ?? 0,
      status: 'open',
    },
  });
  return NextResponse.json(draw, { status: 201 });
}
