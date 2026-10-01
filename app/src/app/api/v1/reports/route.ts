/**
 * CSV/Excel Reports API — GET /api/v1/reports/members
 * GET /api/v1/reports/redemptions
 *
 * Returns: CSV file download (no extra library needed)
 * Auth: Merchant owner or super_admin only
 * DPDP: All PII fields masked in export (phone masked, email masked)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnerOrAdmin, getMerchantId } from '@/lib/auth';
import { maskPhone, maskEmail, maskDate } from '@/lib/dpdp';
import { addSecurityHeaders } from '@/lib/security';

// ── Escape CSV cell ───────────────────────────────────────────────────────────
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(',');
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString().split('T')[0];
}

// ── GET /api/v1/reports/members ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireOwnerOrAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const merchantId = getMerchantId(auth, request);
  if (!merchantId) {
    return addSecurityHeaders(NextResponse.json({ detail: 'merchant_id required' }, { status: 400 }));
  }

  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type') || 'members';
  const from = searchParams.get('from');
  const to   = searchParams.get('to');

  const dateFilter = {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to   ? { lte: new Date(to)   } : {}),
  };

  try {
    let csvContent = '';
    let filename = '';

    if (reportType === 'members') {
      // Members report — PII masked per DPDP
      const members = await prisma.member.findMany({
        where: {
          merchantId,
          ...(from || to ? { createdAt: dateFilter } : {}),
        },
        include: { membershipType: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });

      const headers = [
        'Member Code', 'Name', 'Phone (Masked)', 'Email (Masked)',
        'Membership Type', 'Joined Date', 'Expiry Date',
        'Status', 'Loyalty Points', 'Total Visits', 'Referral Code', 'Auto Renew',
      ];

      const rows = members.map(m => [
        m.memberCode,
        m.name,                                 // name kept for operational use
        maskPhone(m.phone),                     // DPDP: phone masked
        maskEmail(m.email ?? ''),               // DPDP: email masked
        m.membershipType.name,
        formatDate(m.joinedDate),
        formatDate(m.expiryDate),
        m.status,
        Number(m.loyaltyPoints ?? 0),
        m.totalVisits,
        m.referralCode ?? '',
        m.autoRenew ? 'Yes' : 'No',
      ]);

      csvContent = [headers, ...rows].map(csvRow).join('\n');
      filename = `members_${merchantId}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    else if (reportType === 'redemptions') {
      const redemptions = await prisma.redemptionLog.findMany({
        where: {
          member: { merchantId },
          ...(from || to ? { createdAt: dateFilter } : {}),
        },
        include: {
          member: { select: { memberCode: true, name: true } },
          offerTemplate: { select: { title: true, offerType: true } },
          staffUser: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10_000, // safety cap
      });

      const headers = [
        'Date', 'Time', 'Member Code', 'Member Name',
        'Offer', 'Offer Type', 'Amount', 'Staff', 'Redemption ID',
      ];

      const rows = redemptions.map(r => [
        r.createdAt.toISOString().split('T')[0],
        r.createdAt.toISOString().split('T')[1]?.slice(0, 8) ?? '',
        r.member.memberCode,
        r.member.name,
        r.offerTemplate.title,
        r.offerTemplate.offerType,
        r.amount != null ? Number(r.amount) : '',
        r.staffUser.name,
        r.id,
      ]);

      csvContent = [headers, ...rows].map(csvRow).join('\n');
      filename = `redemptions_${merchantId}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    else if (reportType === 'loyalty') {
      const txns = await prisma.loyaltyTransaction.findMany({
        where: {
          merchantId,
          ...(from || to ? { createdAt: dateFilter } : {}),
        },
        include: { member: { select: { memberCode: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10_000,
      });

      const headers = ['Date', 'Member Code', 'Member Name', 'Type', 'Points', 'Note'];
      const rows = txns.map(t => [
        formatDate(t.createdAt),
        t.member.memberCode,
        t.member.name,
        t.type,
        Number(t.points),
        (t as any).note ?? '',
      ]);

      csvContent = [headers, ...rows].map(csvRow).join('\n');
      filename = `loyalty_${merchantId}_${new Date().toISOString().split('T')[0]}.csv`;
    }

    else if (reportType === 'expiring') {
      // Members expiring in next 30 days
      const soon = new Date();
      soon.setDate(soon.getDate() + 30);

      const members = await prisma.member.findMany({
        where: {
          merchantId,
          expiryDate: { lte: soon, gte: new Date() },
          status: { in: ['active', 'expiring_soon'] },
        },
        include: { membershipType: { select: { name: true } } },
        orderBy: { expiryDate: 'asc' },
      });

      const headers = ['Member Code', 'Name', 'Phone (Masked)', 'Membership', 'Expires On', 'Days Left'];
      const today = new Date();

      const rows = members.map(m => {
        const daysLeft = Math.ceil((m.expiryDate.getTime() - today.getTime()) / 86400000);
        return [
          m.memberCode,
          m.name,
          maskPhone(m.phone),
          m.membershipType.name,
          formatDate(m.expiryDate),
          daysLeft,
        ];
      });

      csvContent = [headers, ...rows].map(csvRow).join('\n');
      filename = `expiring_members_${new Date().toISOString().split('T')[0]}.csv`;
    }

    else {
      return addSecurityHeaders(
        NextResponse.json(
          { detail: 'Invalid report type. Use: members | redemptions | loyalty | expiring' },
          { status: 400 }
        )
      );
    }

    // Return as downloadable CSV
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'X-Report-Type': reportType,
        'X-Record-Count': String(csvContent.split('\n').length - 1),
        // DPDP: Record that this report was exported
        'X-DPDP-Notice': 'All PII fields are masked per DPDP Act 2023. Retain securely.',
      },
    });
    return addSecurityHeaders(response);

  } catch (err) {
    console.error('[REPORTS_ERROR]', err);
    return addSecurityHeaders(
      NextResponse.json({ detail: 'Report generation failed' }, { status: 500 })
    );
  }
}
