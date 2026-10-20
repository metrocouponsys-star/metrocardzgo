import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders, sanitizeString } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const memberId = String(body.member_id ?? '').trim();
    const rating = Number(body.rating);
    const comment = sanitizeString(body.comment ?? '');

    if (!memberId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'member_id required' }, { status: 400 }));
    }

    if (isNaN(rating) || rating < 1 || rating > 5) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Rating must be between 1 and 5' }, { status: 400 }));
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, name: true, merchantId: true },
    });

    if (!member) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Member not found' }, { status: 404 }));
    }

    const merchantUser = await prisma.merchantUser.findFirst({
      where: { merchantId: member.merchantId },
      select: { id: true },
    });

    if (merchantUser) {
      await prisma.adminAuditLog.create({
        data: {
          adminUserId: merchantUser.id,
          merchantId: member.merchantId,
          action: 'member_feedback',
          detail: JSON.stringify({
            member_id: member.id,
            member_name: member.name,
            rating,
            comment,
            submitted_at: new Date().toISOString(),
          }),
        },
      }).catch(() => {});
    }

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: 'Thank you! Your feedback has been submitted.',
        rating,
      })
    );
  } catch (error: any) {
    console.error('[public/feedback POST]', error);
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
