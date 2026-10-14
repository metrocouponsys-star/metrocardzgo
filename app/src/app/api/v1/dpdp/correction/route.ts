/**
 * DPDP Act 2023 Section 12 — Right to Correction & Updating API
 * ==============================================================
 * Allows Data Principals (via public token) or Merchants to correct
 * inaccurate personal data (name, email, DOB, anniversary).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logPIIAccess, PIIField, PII_FIELDS } from '@/lib/dpdp';
import { rateLimit, getClientIP, addSecurityHeaders, addRequestId } from '@/lib/security';
import { requireAuth, getMerchantId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let response: NextResponse;
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 10, keyPrefix: 'dpdp_correction' });
    if (!rl.allowed) {
      response = NextResponse.json({ detail: 'Rate limit exceeded' }, { status: 429 });
      return addRequestId(addSecurityHeaders(response));
    }

    const body = await request.json().catch(() => ({}));
    const { public_token, member_id, name, email, date_of_birth, anniversary_date } = body;

    let member: any = null;
    let actor = 'data_principal';

    if (public_token) {
      member = await prisma.member.findUnique({
        where: { publicToken: public_token },
      });
    } else if (member_id) {
      const auth = await requireAuth(request);
      if (auth instanceof NextResponse) return auth;
      const merchantId = getMerchantId(auth, request);

      member = await prisma.member.findFirst({
        where: {
          id: member_id,
          ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}),
        },
      });
      actor = `merchant_user:${auth.userId}`;
    }

    if (!member) {
      response = NextResponse.json({ detail: 'Member not found or invalid token' }, { status: 404 });
      return addRequestId(addSecurityHeaders(response));
    }

    const updateData: any = {};
    const correctedFields: string[] = [];

    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
      correctedFields.push('name');
    }
    if (email !== undefined) {
      updateData.email = email && email.trim() ? email.trim() : null;
      correctedFields.push('email');
    }
    if (date_of_birth !== undefined) {
      updateData.dateOfBirth = date_of_birth && date_of_birth.trim() ? new Date(date_of_birth) : null;
      correctedFields.push('dateOfBirth');
    }
    if (anniversary_date !== undefined) {
      updateData.anniversaryDate = anniversary_date && anniversary_date.trim() ? new Date(anniversary_date) : null;
      correctedFields.push('anniversaryDate');
    }

    if (correctedFields.length === 0) {
      response = NextResponse.json({ detail: 'No correction fields provided' }, { status: 400 });
      return addRequestId(addSecurityHeaders(response));
    }

    await prisma.member.update({
      where: { id: member.id },
      data: updateData,
    });

    const clientIp = getClientIP(request);

    // Audit log this correction per DPDP Section 8
    logPIIAccess({
      reason: 'dpdp_right_to_correction',
      memberId: member.id,
      merchantId: member.merchantId,
      fieldsAccessed: correctedFields.filter((f): f is PIIField => (PII_FIELDS as readonly string[]).includes(f)),
      performedBy: actor,
      ip: clientIp,
    });

    response = NextResponse.json({
      success: true,
      corrected_fields: correctedFields,
      message: 'Personal data has been updated and corrected in compliance with DPDP Act Section 12.',
    });
  } catch (err) {
    console.error('[dpdp/correction POST]', err);
    response = NextResponse.json({ detail: 'Failed to process correction' }, { status: 500 });
  }

  return addRequestId(addSecurityHeaders(response));
}
