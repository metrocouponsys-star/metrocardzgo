import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPublicMemberViewFromDb, buildPublicMemberViewFromMock } from '@/lib/publicMemberView';
import { members as mockMembers } from '@/api/mockData';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/public/m/[token]
 * Resolves a member by publicToken, memberCode, or id, and returns full PublicMemberView.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ detail: 'Token required' }, { status: 400 });
  }

  const cleanToken = token.trim();
  const tokenStripHash = cleanToken.replace(/^#/, '').toLowerCase();

  // 1. Try Prisma DB
  try {
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { publicToken: cleanToken },
          { memberCode: { equals: tokenStripHash } },
          { id: cleanToken },
        ],
      },
    });

    if (member) {
      const fullView = await buildPublicMemberViewFromDb(member.id);
      if (fullView) {
        return NextResponse.json(fullView);
      }
    }
  } catch (err) {
    console.warn('[public/m/[token]] DB lookup error:', (err as Error).message);
  }

  // 2. Try mock candidates
  const mockCandidate = mockMembers.find((m) => {
    const code = (m.member_code || '').replace(/^#/, '').toLowerCase();
    const pubTok = (m.public_token || '').toLowerCase();
    const rawId = (m.id || '').toLowerCase();
    const target = tokenStripHash;

    return code === target || pubTok === target || rawId === target || code.includes(target);
  });

  if (mockCandidate) {
    const mockView = buildPublicMemberViewFromMock(mockCandidate);
    return NextResponse.json(mockView);
  }

  return NextResponse.json({ detail: 'Member pass not found' }, { status: 404 });
}
