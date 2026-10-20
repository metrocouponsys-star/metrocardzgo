import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const progressList = await prisma.challengeProgress.findMany({
      where: { memberId: id },
      include: { challenge: true },
    });

    const result = progressList.map(p => ({
      id: p.challenge.id,
      title: p.challenge.title,
      description: p.challenge.description,
      target_value: Number(p.challenge.targetValue),
      current_value: Number(p.currentValue),
      reward_type: p.challenge.rewardType,
      reward_value: Number(p.challenge.rewardValue),
      is_completed: p.isCompleted,
    }));

    return addSecurityHeaders(NextResponse.json(result));
  } catch (err: any) {
    return addSecurityHeaders(NextResponse.json([]));
  }
}
