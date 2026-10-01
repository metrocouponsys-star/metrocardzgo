/**
 * GET  /api/v1/members  — list members (paginated, filtered)
 * POST /api/v1/members  — create new member
 * Port of Python members.py list_members + create_member
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

// ── GET /api/v1/members ───────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
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

  return NextResponse.json(members);
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

    const member = await prisma.member.create({
      data: {
        merchantId,
        memberCode,
        publicToken,
        physicalCardNumber: body.physical_card_number ?? null,
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        dateOfBirth: body.date_of_birth ? new Date(body.date_of_birth) : null,
        anniversaryDate: body.anniversary_date ? new Date(body.anniversary_date) : null,
        familyDob1: body.family_dob_1 ? new Date(body.family_dob_1) : null,
        familyDob2: body.family_dob_2 ? new Date(body.family_dob_2) : null,
        familyDob3: body.family_dob_3 ? new Date(body.family_dob_3) : null,
        membershipTypeId: body.membership_type_id,
        joinedDate: new Date(body.joined_date),
        expiryDate: new Date(body.expiry_date),
        loyaltyPoints: 0,
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

    return NextResponse.json(member, { status: 201 });
  } catch (err: any) {
    console.error('[members/create]', err);
    if (err.code === 'P2002') {
      return NextResponse.json({ detail: 'Duplicate phone or public token' }, { status: 400 });
    }
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
