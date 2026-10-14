/**
 * DPDP Act 2023 Section 11 — Right to Access & Data Portability API
 * ==================================================================
 * Allows Data Principals (or Merchants on their behalf) to export their
 * complete personal data and transaction history in a portable JSON format.
 *
 * Implements:
 *  - Full data extraction: Profile, membership tier, points, transaction history, consents
 *  - PII audit logging (DPDP Section 8)
 *  - Machine-readable portable download
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeMemberData } from '@/lib/dataNormalizer';
import { logPIIAccess } from '@/lib/dpdp';
import { rateLimit, getClientIP, addSecurityHeaders, addRequestId } from '@/lib/security';
import { requireAuth, getMerchantId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  let response: NextResponse;
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 10, keyPrefix: 'dpdp_export' });
    if (!rl.allowed) {
      response = NextResponse.json({ detail: 'Rate limit exceeded' }, { status: 429 });
      return addRequestId(addSecurityHeaders(response));
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const memberId = searchParams.get('member_id');
    const download = searchParams.get('download') === 'true';

    let member: any = null;
    let actor = 'data_principal';

    if (token) {
      member = await prisma.member.findUnique({
        where: { publicToken: token },
        include: {
          merchant: true,
          membershipType: true,
          loyaltyTransactions: { orderBy: { createdAt: 'desc' }, take: 100 },
          memberOfferStates: { include: { offer: true } },
          consents: { orderBy: { createdAt: 'desc' } },
        },
      });
    } else if (memberId) {
      // Must be authenticated merchant or admin
      const auth = await requireAuth(request);
      if (auth instanceof NextResponse) return auth;
      const merchantId = getMerchantId(auth, request);

      member = await prisma.member.findFirst({
        where: {
          id: memberId,
          ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}),
        },
        include: {
          merchant: true,
          membershipType: true,
          loyaltyTransactions: { orderBy: { createdAt: 'desc' }, take: 100 },
          memberOfferStates: { include: { offer: true } },
          consents: { orderBy: { createdAt: 'desc' } },
        },
      });
      actor = `merchant_user:${auth.userId}`;
    }

    if (!member) {
      response = NextResponse.json({ detail: 'Member not found or invalid token' }, { status: 404 });
      return addRequestId(addSecurityHeaders(response));
    }

    const clientIp = getClientIP(request);

    // Audit log this export per DPDP Section 8
    logPIIAccess({
      reason: 'dpdp_data_portability_export',
      memberId: member.id,
      merchantId: member.merchantId,
      fieldsAccessed: ['all_profile_and_loyalty_data'],
      performedBy: actor,
      ip: clientIp,
    });

    const normalized = normalizeMemberData(member);

    const exportData = {
      export_metadata: {
        legal_framework: 'Digital Personal Data Protection Act 2023 (Section 11)',
        purpose: 'Data Principal Right to Access & Portability',
        exported_at: new Date().toISOString(),
        data_fiduciary: {
          business_name: member.merchant.businessName,
          category: member.merchant.category,
        },
        data_processor: {
          name: 'Metro Cardz Technologies',
          service: 'Digital Membership Pass & Loyalty Cloud',
          contact: 'privacy@metrocardz.in',
        },
      },
      personal_profile: {
        member_code: member.memberCode,
        name: normalized.name,
        phone: normalized.phone,
        email: normalized.email,
        date_of_birth: normalized.date_of_birth,
        anniversary_date: normalized.anniversary_date,
        membership_tier: member.membershipType?.name || 'Standard',
        joined_date: member.joinedDate,
        expiry_date: member.expiryDate,
        status: member.status,
      },
      loyalty_summary: {
        current_points: member.loyaltyPoints,
        total_visits: member.totalVisits || 0,
        recent_transactions: member.loyaltyTransactions.map((tx: any) => ({
          type: tx.type,
          points: tx.points,
          bill_amount: tx.billAmount,
          notes: tx.notes,
          timestamp: tx.createdAt,
        })),
        active_vouchers: member.memberOfferStates.map((st: any) => ({
          offer_title: st.offer?.title,
          remaining_qty: st.remainingQty,
          status: st.status,
        })),
      },
      statutory_consent_records: member.consents.map((c: any) => ({
        purpose: c.purpose,
        granted: c.granted,
        policy_version: c.policyVersion,
        recorded_at: c.createdAt,
      })),
    };

    response = NextResponse.json(exportData);

    if (download) {
      response.headers.set(
        'Content-Disposition',
        `attachment; filename="metrocardz-data-export-${member.memberCode}.json"`
      );
    }
  } catch (err) {
    console.error('[dpdp/export GET]', err);
    response = NextResponse.json({ detail: 'Failed to generate data export' }, { status: 500 });
  }

  return addRequestId(addSecurityHeaders(response));
}
