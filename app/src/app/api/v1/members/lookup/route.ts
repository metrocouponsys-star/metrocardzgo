import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { members as mockMembers, merchants as mockMerchants, membershipTypes as mockMembershipTypes } from '@/api/mockData';

export const dynamic = 'force-dynamic';

function normalizeDigits(s?: string | null): string {
  return (s || '').replace(/\D/g, '');
}

/**
 * GET /api/v1/members/lookup?identifier=...&last4=...
 * POST /api/v1/members/lookup { identifier, last4 }
 * Authenticates membership and verifies "right person" via last 4 digits of registered phone number.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('identifier') || '';
  const last4 = searchParams.get('last4') || '';
  return handleLookup(identifier, last4);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return handleLookup(body.identifier || '', body.last4 || '');
  } catch {
    return NextResponse.json({ detail: 'Invalid request body' }, { status: 400 });
  }
}

async function handleLookup(rawId: string, rawLast4: string) {
  const idClean = rawId.trim();
  const last4 = rawLast4.trim();

  if (!idClean) {
    return NextResponse.json(
      { detail: 'Please enter your Member Code or registered mobile number' },
      { status: 400 }
    );
  }

  if (!/^\d{4}$/.test(last4)) {
    return NextResponse.json(
      { detail: 'Please enter the last 4 digits of your registered mobile number for identity verification' },
      { status: 400 }
    );
  }

  const idStripHash = idClean.replace(/^#/, '').toLowerCase();
  const idDigitsOnly = normalizeDigits(idClean);

  // 1. Try querying Prisma DB
  try {
    const dbMembers = await prisma.member.findMany({
      where: {
        OR: [
          { memberCode: { equals: idStripHash } },
          ...(idDigitsOnly.length >= 4 ? [{ phone: { contains: idDigitsOnly } }] : []),
          ...(idDigitsOnly.length >= 10 ? [{ phone: { endsWith: idDigitsOnly.slice(-10) } }] : []),
        ],
      },
      include: {
        merchant: { select: { businessName: true, logoUrl: true, cardDesignUrl: true } },
        membershipType: { select: { name: true } },
      },
    });

    const verifiedDb = dbMembers.find((m) => {
      const phoneDigits = normalizeDigits(m.phone);
      return phoneDigits.endsWith(last4);
    });

    if (verifiedDb) {
      return NextResponse.json({
        id: verifiedDb.id,
        name: verifiedDb.name,
        member_code: verifiedDb.memberCode,
        phone: verifiedDb.phone,
        status: verifiedDb.status,
        expiry_date: verifiedDb.expiryDate,
        points_balance: Number(verifiedDb.loyaltyPoints ?? 0),
        tier_name: verifiedDb.membershipType?.name || 'Gold Member',
        total_visits: verifiedDb.totalVisits ?? 0,
        merchant_name: verifiedDb.merchant?.businessName || 'Metro Cardz GO',
        card_design_url: verifiedDb.merchant?.cardDesignUrl || null,
      });
    }
  } catch (err) {
    // If DB is offline or table does not exist in dev, fall through to mock demo directory
    console.warn('[members/lookup] Prisma query bypassed, checking demo members catalog:', (err as Error).message);
  }

  // 2. Fallback to mock / demo members directory (for dev, testing, and offline modes)
  const candidate = mockMembers.find((m) => {
    const code = (m.member_code || '').replace(/^#/, '').toLowerCase();
    const phone = normalizeDigits(m.phone);
    const card = normalizeDigits(m.physical_card_number);

    const codeMatch = code === idStripHash || code.includes(idStripHash) || idStripHash.includes(code);
    const phoneMatch = idDigitsOnly.length >= 4 && (phone.endsWith(idDigitsOnly) || idDigitsOnly.endsWith(phone));
    const cardMatch = idDigitsOnly.length >= 4 && (card.endsWith(idDigitsOnly) || card.includes(idDigitsOnly));

    return codeMatch || phoneMatch || cardMatch;
  });

  if (candidate) {
    const phoneDigits = normalizeDigits(candidate.phone);
    if (phoneDigits.endsWith(last4)) {
      const merch = mockMerchants.find((x) => x.id === candidate.merchant_id);
      const mtype = mockMembershipTypes.find((x) => x.id === candidate.membership_type_id);

      return NextResponse.json({
        id: candidate.id,
        name: candidate.name,
        member_code: candidate.member_code,
        phone: candidate.phone,
        status: candidate.status,
        expiry_date: candidate.expiry_date,
        points_balance: candidate.loyalty_points ?? 0,
        tier_name: mtype?.name || 'Gold Member',
        total_visits: 12,
        merchant_name: merch?.business_name || 'Metro Cardz GO Partner',
        card_design_url: merch?.card_design_url || null,
      });
    }
  }

  return NextResponse.json(
    {
      detail: `No active membership found matching '${idClean}' where registered phone ends with '${last4}'. Please check your card code or 4-digit security code.`,
    },
    { status: 404 }
  );
}
