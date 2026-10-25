/**
 * GET  /api/v1/members  — list members (paginated, filtered)
 * POST /api/v1/members  — create new member
 * Port of Python members.py list_members + create_member
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeMemberData } from '@/lib/dataNormalizer';
import crypto from 'crypto';

// ── Helpers ──────────────────────────────────────────────────────────────────
function generatePublicToken(merchantId: string, phone: string, salt: string): string {
  const data = `${merchantId}:${phone}:${salt}`;
  return crypto.createHmac('sha256', salt).update(data).digest('hex').slice(0, 32);
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function padMemberCode(merchantId: string, count: number): string {
  const prefix = merchantId.slice(0, 3).toUpperCase();
  return `${prefix}${String(count + 1).padStart(4, '0')}`;
}

function parseOptionalDate(val: unknown): Date | null {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  const d = new Date(val.trim());
  return isNaN(d.getTime()) ? null : d;
}

// ── GET /api/v1/members ───────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? undefined;
    const membershipTypeId = url.searchParams.get('membership_type_id') ?? undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 500);
    const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0'), 0);

    const members = await prisma.member.findMany({
      where: {
        merchantId,
        ...(status ? { status: status as any } : {}),
        ...(membershipTypeId ? { membershipTypeId } : {}),
      },
      include: { membershipType: true, offerStates: { include: { offerTemplate: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(members.map(normalizeMemberData));
  } catch (error: any) {
    console.error('GET /api/v1/members error:', error);
    return NextResponse.json({ detail: error.message || 'Failed to fetch members' }, { status: 500 });
  }
}

// ── POST /api/v1/members ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  try {
    const body = await request.json();

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return NextResponse.json({ detail: 'Merchant not found' }, { status: 404 });

    const memberCount = await prisma.member.count({ where: { merchantId } });
    const memberCode = body.member_code ?? padMemberCode(merchantId, memberCount);
    const publicToken = generatePublicToken(merchantId, body.phone, merchant.secretSalt);

    // Generate unique referral code
    let referralCode: string | null = null;
    for (let i = 0; i < 10; i++) {
      const candidate = generateReferralCode();
      const exists = await prisma.member.findUnique({ where: { referralCode: candidate } });
      if (!exists) { referralCode = candidate; break; }
    }

    const joined = parseOptionalDate(body.joined_date) ?? new Date();
    const expiry = parseOptionalDate(body.expiry_date) ?? new Date(joined.getTime() + 365 * 24 * 60 * 60 * 1000);
    const initialPoints = Number(body.initial_points ?? body.loyalty_points ?? 0) || 0;

    const member = await prisma.member.create({
      data: {
        merchantId,
        memberCode,
        publicToken,
        physicalCardNumber: body.physical_card_number ?? null,
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        dateOfBirth: parseOptionalDate(body.date_of_birth),
        anniversaryDate: parseOptionalDate(body.anniversary_date),
        familyDob1: parseOptionalDate(body.family_dob_1),
        familyDob2: parseOptionalDate(body.family_dob_2),
        familyDob3: parseOptionalDate(body.family_dob_3),
        membershipTypeId: body.membership_type_id,
        joinedDate: joined,
        expiryDate: expiry,
        loyaltyPoints: initialPoints,
        status: 'active',
        notes: body.notes ?? null,
        referralCode,
        referredByMemberId: body.referred_by_member_id ?? null,
        autoRenew: body.auto_renew ?? false,
      },
      include: { membershipType: true },
    });

    // Auto-populate MemberOfferState for all active offers in this membership type
    const offerLinks = await prisma.membershipTypeOffer.findMany({
      where: { membershipTypeId: member.membershipTypeId },
      include: { offer: true },
    });
    if (offerLinks.length > 0) {
      await prisma.memberOfferState.createMany({
        data: offerLinks.map(link => ({
          memberId: member.id,
          offerTemplateId: link.offerTemplateId,
          remainingQty: link.defaultQty,
          initialQty: link.defaultQty,
          status: 'active' as const,
        })),
        skipDuplicates: true,
      });
    }

    // DPDP Act 2023 Section 6 — Record immutable statutory consent upon enrollment
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1';
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) || null;

    await prisma.memberConsent.createMany({
      data: [
        {
          memberId: member.id,
          merchantId,
          purpose: 'membership',
          granted: true,
          ipAddress: clientIp,
          userAgent,
          policyVersion: 'v1.0',
        },
        {
          memberId: member.id,
          merchantId,
          purpose: 'marketing',
          granted: body.marketing_consent !== false,
          ipAddress: clientIp,
          userAgent,
          policyVersion: 'v1.0',
        },
        {
          memberId: member.id,
          merchantId,
          purpose: 'whatsapp',
          granted: body.whatsapp_consent !== false,
          ipAddress: clientIp,
          userAgent,
          policyVersion: 'v1.0',
        },
      ],
      skipDuplicates: true,
    }).catch(err => {
      console.error('[DPDP] Consent auto-record error:', err);
    });

    return NextResponse.json(normalizeMemberData(member), { status: 201 });
  } catch (err: any) {
    console.error('[members/create]', err);
    if (err.code === 'P2002') {
      return NextResponse.json({ detail: 'Duplicate phone or public token' }, { status: 400 });
    }
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
