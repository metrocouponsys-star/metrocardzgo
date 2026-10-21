import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const streak = await prisma.visitStreak.findFirst({
      where: { memberId: id },
    });

    if (!streak) {
      return addSecurityHeaders(
        NextResponse.json({
          current_streak: 0,
          longest_streak: 0,
        })
      );
    }

    return addSecurityHeaders(
      NextResponse.json({
        current_streak: streak.currentStreak,
        longest_streak: streak.longestStreak,
      })
    );
  } catch (err: any) {
    return addSecurityHeaders(
      NextResponse.json({
        current_streak: 0,
        longest_streak: 0,
      })
    );
  }
}
