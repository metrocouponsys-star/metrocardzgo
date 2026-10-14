/**
 * Data Retention & Storage Limitation Management API
 * ==================================================
 * Implements:
 *  - DPDP Act 2023 Section 8(7): Data must be erased once the specified purpose is fulfilled
 *  - IT Act Section 43A: Minimizes long-term data breach exposure
 *  - Automated/Manual retention scan & inactive member anonymisation
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerOrAdmin, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClientIP, addSecurityHeaders, addRequestId } from '@/lib/security';

export async function GET(request: NextRequest) {
  let response: NextResponse;
  try {
    const auth = await requireOwnerOrAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      response = NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
      return addRequestId(addSecurityHeaders(response));
    }

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const [totalMembers, activeMembers, inactiveEligible, erasedMembers] = await Promise.all([
      prisma.member.count({ where: { merchantId } }),
      prisma.member.count({ where: { merchantId, status: 'active' } }),
      prisma.member.count({
        where: {
          merchantId,
          status: { in: ['expired', 'deactivated'] },
          expiryDate: { lte: twoYearsAgo },
          phone: { not: '[ERASED]' },
        },
      }),
      prisma.member.count({
        where: {
          merchantId,
          OR: [
            { phone: '[ERASED]' },
            { phone: '[ANONYMIZED]' },
            { status: 'deactivated' },
          ],
        },
      }),
    ]);

    response = NextResponse.json({
      policy_name: 'Metro Cardz DPDP Storage Limitation Policy',
      policy_version: 'v1.0-2024',
      storage_period: 'Active subscription + 24 months post-expiry',
      accounting_exemption: 'Aggregated transaction counts retained for statutory tax compliance',
      statistics: {
        total_members: totalMembers,
        active_members: activeMembers,
        eligible_for_retention_purge: inactiveEligible,
        anonymised_or_erased_members: erasedMembers,
      },
      retention_rules: [
        'Active members: Retained during active membership term for reward redemption.',
        'Expired members: Retained for 24 months to allow smooth renewal and points recovery.',
        'Inactive >24 months: Subject to automatic or merchant-initiated PII anonymisation.',
        'Account Closure: Upon merchant termination, customer records purged within 30 days.',
      ],
    });
  } catch (err) {
    console.error('[merchant/retention GET]', err);
    response = NextResponse.json({ detail: 'Failed to fetch retention stats' }, { status: 500 });
  }

  return addRequestId(addSecurityHeaders(response));
}

export async function POST(request: NextRequest) {
  let response: NextResponse;
  try {
    const auth = await requireOwnerOrAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      response = NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
      return addRequestId(addSecurityHeaders(response));
    }

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Find inactive candidates
    const candidates = await prisma.member.findMany({
      where: {
        merchantId,
        status: { in: ['expired', 'deactivated'] },
        expiryDate: { lte: twoYearsAgo },
        phone: { notIn: ['[ERASED]', '[ANONYMIZED]'] },
      },
      select: { id: true, memberCode: true },
    });

    if (candidates.length === 0) {
      response = NextResponse.json({
        success: true,
        purged_count: 0,
        message: 'No members currently exceed the 24-month retention threshold.',
      });
      return addRequestId(addSecurityHeaders(response));
    }

    const candidateIds = candidates.map(c => c.id);

    // Bulk anonymise PII
    await prisma.member.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        name: '[ANONYMIZED]',
        phone: '[ANONYMIZED]',
        email: null,
        dateOfBirth: null,
        anniversaryDate: null,
        familyDob1: null,
        familyDob2: null,
        familyDob3: null,
        notes: null,
        status: 'deactivated',
      },
    });

    const clientIp = getClientIP(request);

    // Audit log this retention action
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: auth.userId,
        merchantId,
        action: 'retention_purge',
        detail: JSON.stringify({
          purged_count: candidates.length,
          purged_member_ids: candidateIds.slice(0, 50),
          reason: 'DPDP Section 8(7) Storage Limitation — Inactive > 24 months',
          timestamp: new Date().toISOString(),
        }),
        ipAddress: clientIp,
      },
    });

    response = NextResponse.json({
      success: true,
      purged_count: candidates.length,
      message: `Successfully anonymised ${candidates.length} inactive member records under DPDP Storage Limitation policy.`,
    });
  } catch (err) {
    console.error('[merchant/retention POST]', err);
    response = NextResponse.json({ detail: 'Failed to execute retention purge' }, { status: 500 });
  }

  return addRequestId(addSecurityHeaders(response));
}
