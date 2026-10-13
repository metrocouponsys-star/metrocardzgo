import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// In-memory server cache to simulate database persistence per customer
// (mirrored on client in localStorage per customer phone/memberCode)
const serverCustomerStore = new Map<string, any>();

function normalizeKey(s?: string | null): string {
  if (!s) return 'guest';
  const clean = s.replace(/\D/g, '');
  if (clean.length >= 10) return clean.slice(-10);
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * GET /api/v1/go/customer?identifier=...
 * Returns isolated customer data (claimed offers, remaining offers, points, and money saved).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get('identifier') || '';

  if (!identifier) {
    return NextResponse.json({ detail: 'Customer identifier or phone required' }, { status: 400 });
  }

  const key = normalizeKey(identifier);
  const existing = serverCustomerStore.get(key);

  if (existing) {
    return NextResponse.json(existing);
  }

  // Return base profile if not yet cached on server
  const baseProfile = {
    id: `cust_${key}`,
    phone: identifier,
    name: 'Verified Member',
    memberCode: identifier.startsWith('MC') ? identifier : `MC-${key.slice(-4)}`,
    tier: 'Gold Tier',
    points: 1200,
    totalSavedMoney: 0,
    claimedOffers: [],
    savingsHistory: [],
    updatedAt: new Date().toISOString(),
  };

  serverCustomerStore.set(key, baseProfile);
  return NextResponse.json(baseProfile);
}

/**
 * POST /api/v1/go/customer
 * Syncs customer profile data to the server.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body.phone || body.memberCode || body.id;

    if (!identifier) {
      return NextResponse.json({ detail: 'Customer identifier required' }, { status: 400 });
    }

    const key = normalizeKey(identifier);
    serverCustomerStore.set(key, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, customer: serverCustomerStore.get(key) });
  } catch {
    return NextResponse.json({ detail: 'Invalid request' }, { status: 400 });
  }
}
