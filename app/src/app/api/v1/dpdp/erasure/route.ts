/**
 * DPDP Compliance API — POST /api/v1/dpdp/erasure
 * Right-to-Erasure request (DPDP Act Section 13)
 *
 * Member submits a deletion request via their public token.
 * Process:
 *  1. Verify public token → find member
 *  2. Create erasure request record
 *  3. Anonymise PII immediately (phone, email, DOB → '[ERASED]' marker)
 *  4. Retain non-PII data (visits, points) for business reporting
 *  5. Invalidate public token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateErasureRequestId,
  logPIIAccess,
  maskPhone,
  maskEmail,
  maybeDecrypt,
} from '@/lib/dpdp';
import { rateLimit, UPLOAD_RATE_LIMIT, getClientIP, addSecurityHeaders } from '@/lib/security';
import { addRequestId } from '@/lib/security';

export async function POST(request: NextRequest) {
  let response: NextResponse;

  try {
    // Rate limit: 1 erasure request per IP per minute
    const rl = rateLimit(request, { windowMs: 60_000, max: 1, keyPrefix: 'erasure' });
    if (!rl.allowed) {
      response = NextResponse.json({ detail: 'Too many requests' }, { status: 429 });
      return addRequestId(addSecurityHeaders(response));
    }

    const body = await request.json().catch(() => ({}));
    const { public_token, reason } = body;

    if (!public_token || typeof public_token !== 'string') {
      response = NextResponse.json({ detail: 'public_token is required' }, { status: 400 });
      return addRequestId(addSecurityHeaders(response));
    }

    // Find member
    const member = await prisma.member.findUnique({
      where: { publicToken: public_token },
    });

    if (!member) {
      // Return same response as found — don't reveal if token exists
      response = NextResponse.json({
        request_id: generateErasureRequestId(),
        status: 'received',
        message: 'If this token is valid, your erasure request has been received. Processing takes up to 30 days per DPDP Act.',
      });
      return addRequestId(addSecurityHeaders(response));
    }

    // Check for existing pending request
    const existingRequest = await prisma.erasureRequest.findFirst({
      where: { memberId: member.id, status: { in: ['pending', 'processing'] } },
    });

    if (existingRequest) {
      response = NextResponse.json({
        request_id: existingRequest.id,
        status: existingRequest.status,
        message: 'An erasure request is already in progress.',
      });
      return addRequestId(addSecurityHeaders(response));
    }

    const requestId = generateErasureRequestId();
    const ip = getClientIP(request);

    // Create erasure request
    await prisma.erasureRequest.create({
      data: {
        id: requestId,
        memberId: member.id,
        merchantId: member.merchantId,
        reason: typeof reason === 'string' ? reason.slice(0, 500) : 'Member requested deletion',
        status: 'processing',
      },
    });

    // Log PII access (required by DPDP)
    logPIIAccess({
      reason: 'erasure_processing',
      memberId: member.id,
      merchantId: member.merchantId,
      fieldsAccessed: ['phone', 'email', 'dateOfBirth', 'anniversaryDate'],
      performedBy: 'system',
      ip,
    });

    // Anonymise PII immediately — replace with ERASED markers
    // DPDP: erasure means making data unrecoverable
    // We retain: id, memberCode, merchantId, loyaltyPoints, totalVisits, joinedDate
    // (needed for business accounting records per GST/Companies Act)
    await prisma.member.update({
      where: { id: member.id },
      data: {
        name:            '[ERASED]',
        phone:           '[ERASED]',
        email:           null,
        dateOfBirth:     null,
        anniversaryDate: null,
        familyDob1:      null,
        familyDob2:      null,
        familyDob3:      null,
        notes:           null,
        publicToken:     `ERASED-${requestId}`,  // invalidate QR access
        status:          'deactivated',
        referralCode:    null,
      },
    });

    // Mark erasure request as completed
    await prisma.erasureRequest.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        processedAt: new Date(),
        processedBy: 'system',
        anonymisedFields: JSON.stringify(['name', 'phone', 'email', 'dateOfBirth',
          'anniversaryDate', 'familyDob1', 'familyDob2', 'familyDob3', 'notes', 'publicToken']),
      },
    });

    response = NextResponse.json({
      request_id: requestId,
      status: 'completed',
      message: 'Your personal data has been anonymised. Aggregated statistics are retained for legal compliance. Your membership card is now deactivated.',
    });

  } catch (err) {
    console.error('[DPDP_ERASURE_ERROR]', err);
    response = NextResponse.json(
      { detail: 'Erasure request processing failed. Please try again.' },
      { status: 500 }
    );
  }

  return addRequestId(addSecurityHeaders(response));
}
