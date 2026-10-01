/**
 * DPDP Compliance API — POST /api/v1/dpdp/consent
 * Record or update member consent (DPDP Act Section 6)
 *
 * Consent rules under DPDP Act 2023:
 *  - Must be specific to purpose (separate consent per purpose)
 *  - Must be freely given (cannot bundle with service access)
 *  - Must be informed (privacy notice must be shown first)
 *  - Must be revocable at any time (withdrawal = new record with granted=false)
 *  - Records are immutable — we insert new records, never update
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIP, addSecurityHeaders, addRequestId } from '@/lib/security';

const VALID_PURPOSES = ['membership', 'marketing', 'whatsapp', 'analytics', 'third_party'] as const;
type ConsentPurpose = typeof VALID_PURPOSES[number];

export async function POST(request: NextRequest) {
  let response: NextResponse;
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 10, keyPrefix: 'consent' });
    if (!rl.allowed) {
      response = NextResponse.json({ detail: 'Too many requests' }, { status: 429 });
      return addRequestId(addSecurityHeaders(response));
    }

    const body = await request.json().catch(() => ({}));
    const { public_token, purpose, granted } = body;

    if (!public_token || !purpose || typeof granted !== 'boolean') {
      response = NextResponse.json(
        { detail: 'public_token, purpose, and granted (boolean) are required' },
        { status: 400 }
      );
      return addRequestId(addSecurityHeaders(response));
    }

    if (!VALID_PURPOSES.includes(purpose)) {
      response = NextResponse.json(
        { detail: `purpose must be one of: ${VALID_PURPOSES.join(', ')}` },
        { status: 400 }
      );
      return addRequestId(addSecurityHeaders(response));
    }

    const member = await prisma.member.findUnique({
      where: { publicToken: public_token },
      select: { id: true, merchantId: true },
    });

    if (!member) {
      response = NextResponse.json({ detail: 'Invalid token' }, { status: 404 });
      return addRequestId(addSecurityHeaders(response));
    }

    // Insert new consent record — NEVER update existing (immutable audit trail)
    await prisma.memberConsent.create({
      data: {
        memberId:     member.id,
        merchantId:   member.merchantId,
        purpose:      purpose as ConsentPurpose,
        granted,
        ipAddress:    getClientIP(request),
        userAgent:    request.headers.get('user-agent')?.slice(0, 500) ?? null,
        policyVersion: 'v1.0',
      },
    });

    response = NextResponse.json({
      success: true,
      message: granted
        ? `Consent for '${purpose}' recorded. You can withdraw this consent at any time.`
        : `Consent for '${purpose}' withdrawn. Your preference has been recorded.`,
      purpose,
      granted,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[DPDP_CONSENT_ERROR]', err);
    response = NextResponse.json({ detail: 'Failed to record consent' }, { status: 500 });
  }

  return addRequestId(addSecurityHeaders(response));
}

// GET — Check current consent status for a member
export async function GET(request: NextRequest) {
  let response: NextResponse;
  try {
    const { searchParams } = new URL(request.url);
    const publicToken = searchParams.get('token');

    if (!publicToken) {
      response = NextResponse.json({ detail: 'token is required' }, { status: 400 });
      return addRequestId(addSecurityHeaders(response));
    }

    const member = await prisma.member.findUnique({
      where: { publicToken },
      select: { id: true, merchantId: true },
    });

    if (!member) {
      response = NextResponse.json({ detail: 'Invalid token' }, { status: 404 });
      return addRequestId(addSecurityHeaders(response));
    }

    // Get latest consent record per purpose
    const allConsents = await prisma.memberConsent.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' },
    });

    // Deduplicate: latest record per purpose
    const latestByPurpose: Record<string, boolean> = {};
    for (const c of allConsents) {
      if (!(c.purpose in latestByPurpose)) {
        latestByPurpose[c.purpose] = c.granted;
      }
    }

    response = NextResponse.json({
      consents: VALID_PURPOSES.reduce((acc, purpose) => {
        acc[purpose] = latestByPurpose[purpose] ?? false;
        return acc;
      }, {} as Record<string, boolean>),
      policy_version: 'v1.0',
      your_rights: {
        access: 'You can request a copy of your data via /api/v1/dpdp/export',
        erasure: 'You can delete your data via /api/v1/dpdp/erasure',
        correction: 'You can correct your data via /api/v1/dpdp/correction',
        withdraw_consent: 'POST to /api/v1/dpdp/consent with granted: false',
        grievance: 'Email: dpdp@metrocardz.com | Response within 30 days',
      },
    });

  } catch (err) {
    console.error('[DPDP_CONSENT_GET_ERROR]', err);
    response = NextResponse.json({ detail: 'Failed to fetch consent' }, { status: 500 });
  }

  return addRequestId(addSecurityHeaders(response));
}
