/**
 * Merchant Data Processing Agreement (DPA) Execution API
 * =======================================================
 * Compliant with:
 *  - Information Technology Act, 2000 (Sections 43, 43A, 66, 72, 72A)
 *  - Digital Personal Data Protection Act, 2023 (DPDP Act)
 *
 * Confirms statutory relationship:
 *  - Merchant: Data Fiduciary (determines purpose of member data collection)
 *  - Metro Cardz: Data Processor (processes loyalty data strictly on Merchant's instructions)
 *
 * Digital execution produces an immutable timestamped audit record in admin_audit_log.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClientIP, addSecurityHeaders, addRequestId } from '@/lib/security';

export async function GET(request: NextRequest) {
  let response: NextResponse;
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      response = NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
      return addRequestId(addSecurityHeaders(response));
    }

    const log = await prisma.adminAuditLog.findFirst({
      where: {
        merchantId,
        action: 'dpa_accepted',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!log) {
      response = NextResponse.json({
        accepted: false,
        agreement_version: 'v1.0-DPDP-2023',
        legal_status: 'pending_digital_acceptance',
      });
      return addRequestId(addSecurityHeaders(response));
    }

    let parsedDetail: any = {};
    try {
      parsedDetail = log.detail ? JSON.parse(log.detail) : {};
    } catch {
      parsedDetail = { detail: log.detail };
    }

    response = NextResponse.json({
      accepted: true,
      accepted_at: log.createdAt.toISOString(),
      signatory_name: parsedDetail.signatory_name ?? 'Authorized Signatory',
      signatory_role: parsedDetail.signatory_role ?? 'Merchant Owner',
      agreement_version: parsedDetail.agreement_version ?? 'v1.0-DPDP-2023',
      bond_ref: parsedDetail.bond_ref ?? `MC-DPA-${merchantId.slice(0, 8).toUpperCase()}`,
      ip_address: log.ipAddress,
      legal_status: 'executed_and_enforceable',
      statutory_basis: 'IT Act 2000 Section 43A & DPDP Act 2023',
    });
  } catch (err) {
    console.error('[merchant/dpa GET]', err);
    response = NextResponse.json({ detail: 'Failed to fetch DPA status' }, { status: 500 });
  }

  return addRequestId(addSecurityHeaders(response));
}

export async function POST(request: NextRequest) {
  let response: NextResponse;
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      response = NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
      return addRequestId(addSecurityHeaders(response));
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });
    if (!merchant) {
      response = NextResponse.json({ detail: 'Merchant not found' }, { status: 404 });
      return addRequestId(addSecurityHeaders(response));
    }

    const body = await request.json().catch(() => ({}));
    const signatoryName = String(body.signatory_name || '').trim();
    const signatoryRole = String(body.signatory_role || 'Proprietor / Managing Partner').trim();

    if (!signatoryName) {
      response = NextResponse.json(
        { detail: 'Signatory full name is required for legal execution' },
        { status: 400 }
      );
      return addRequestId(addSecurityHeaders(response));
    }

    const clientIp = getClientIP(request);
    const bondRef = `MC-DPA-${merchantId.slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`;

    // Record immutable acceptance log
    const auditRecord = await prisma.adminAuditLog.create({
      data: {
        adminUserId: auth.userId,
        merchantId,
        action: 'dpa_accepted',
        detail: JSON.stringify({
          signatory_name: signatoryName,
          signatory_role: signatoryRole,
          agreement_version: 'v1.0-DPDP-2023',
          bond_ref: bondRef,
          company_name: merchant.businessName,
          merchant_role: 'Data Fiduciary (DPDP Act 2023)',
          processor_role: 'Data Processor (Metro Cardz Technologies)',
          statutory_basis: 'Information Technology Act 2000 (Sec 43A, 72, 72A) & DPDP Act 2023',
          accepted_at: new Date().toISOString(),
        }),
        ipAddress: clientIp,
      },
    });

    response = NextResponse.json({
      success: true,
      accepted: true,
      accepted_at: auditRecord.createdAt.toISOString(),
      signatory_name: signatoryName,
      signatory_role: signatoryRole,
      agreement_version: 'v1.0-DPDP-2023',
      bond_ref: bondRef,
      ip_address: clientIp,
      message: 'Merchant Data Processing Agreement digitally signed and legally executed.',
    });
  } catch (err) {
    console.error('[merchant/dpa POST]', err);
    response = NextResponse.json({ detail: 'Failed to record DPA signature' }, { status: 500 });
  }

  return addRequestId(addSecurityHeaders(response));
}
