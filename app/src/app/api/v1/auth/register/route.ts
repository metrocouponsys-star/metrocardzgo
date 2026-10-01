/**
 * POST /api/v1/auth/register
 * Customer self-registration (public — no auth required)
 *
 * Step 1: POST { step:"send_otp", phone, merchantCode? } → sends OTP, returns { session_id }
 * Step 2: POST { step:"verify_otp", session_id, otp, name, dob?, referralCode? } → creates member + JWT
 *
 * DPDP: Records membership consent at registration.
 * Rate-limited: max 3 OTP sends per phone per 10 minutes (OtpCode count check).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAccessToken, createRefreshToken } from '@/lib/auth';
import crypto from 'crypto';

const OTP_HMAC_SECRET = process.env.OTP_HMAC_SECRET ?? 'fallback-dev-secret';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signOtp(phone: string, otp: string, ts: number): string {
  return crypto
    .createHmac('sha256', OTP_HMAC_SECRET)
    .update(`${phone}:${otp}:${ts}`)
    .digest('hex');
}

function generatePublicToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── POST /api/v1/auth/register ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const step: string = body.step ?? 'send_otp';

    // ── Step 1: Send OTP ─────────────────────────────────────────────────────
    if (step === 'send_otp') {
      const phone: string = (body.phone ?? '').replace(/\D/g, '').slice(-10);
      const merchantCode: string = (body.merchantCode ?? '').trim().toUpperCase();

      if (phone.length !== 10) {
        return NextResponse.json({ detail: 'Enter a valid 10-digit mobile number' }, { status: 400 });
      }

      // Find merchant by code (optional)
      let merchantId: string | null = null;
      if (merchantCode) {
        const merchant = await prisma.merchant.findFirst({
          where: { OR: [{ id: merchantCode }, { name: { contains: merchantCode } }] },
        });
        if (!merchant) {
          return NextResponse.json({ detail: 'Invalid merchant code' }, { status: 404 });
        }
        merchantId = merchant.id;
      }

      // Rate-limit: max 3 OTPs per phone per 10 minutes
      const tenMinsAgo = new Date(Date.now() - 600_000);
      const recentOtps = await prisma.otpCode.count({
        where: { phone, createdAt: { gte: tenMinsAgo } },
      });
      if (recentOtps >= 3) {
        return NextResponse.json(
          { detail: 'Too many OTP requests. Please wait 10 minutes and try again.' },
          { status: 429 }
        );
      }

      const otp = generateOtp();
      const ts = Date.now();
      const sig = signOtp(phone, otp, ts);
      const sessionId = `${phone}:${ts}:${sig}`;

      // Store OTP in DB (auto-expires by checking expiresAt on verify)
      await prisma.otpCode.create({
        data: {
          phone,
          code: otp,
          expiresAt: new Date(ts + OTP_TTL_MS),
        },
      });

      // TODO: Send via MSG91 — plug in when API key is ready
      // await sendOtpSms(phone, otp);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Register OTP for ${phone}: ${otp}`);
      }

      return NextResponse.json({
        session_id: Buffer.from(sessionId).toString('base64url'),
        merchant_id: merchantId,
        expires_in: 600,
        message: `OTP sent to +91-XXXXXX${phone.slice(-4)}`,
      });
    }

    // ── Step 2: Verify OTP + Create Member ──────────────────────────────────
    if (step === 'verify_otp') {
      const sessionIdRaw: string = body.session_id ?? '';
      const otpInput: string     = (body.otp ?? '').trim();
      const name: string         = (body.name ?? '').trim();
      const dob: string | undefined       = body.dob;          // YYYY-MM-DD
      const referralCode: string | undefined = body.referral_code?.trim().toUpperCase();
      let merchantId: string     = body.merchant_id ?? '';
      const consentMarketing: boolean  = body.consent_marketing ?? false;
      const consentWhatsapp: boolean   = body.consent_whatsapp ?? false;

      if (!sessionIdRaw || !otpInput || !name) {
        return NextResponse.json({ detail: 'session_id, otp and name are required' }, { status: 400 });
      }

      // Decode + validate session token
      let decoded: string;
      try {
        decoded = Buffer.from(sessionIdRaw, 'base64url').toString();
      } catch {
        return NextResponse.json({ detail: 'Invalid session' }, { status: 400 });
      }

      const parts = decoded.split(':');
      if (parts.length < 3) {
        return NextResponse.json({ detail: 'Malformed session' }, { status: 400 });
      }
      const phone = parts[0];
      const ts = parseInt(parts[1], 10);
      const sig = parts.slice(2).join(':');

      if (Date.now() - ts > OTP_TTL_MS) {
        return NextResponse.json({ detail: 'OTP expired. Please request a new one.' }, { status: 400 });
      }

      // Verify HMAC (prevents OTP tampering)
      const expectedSig = signOtp(phone, otpInput, ts);
      const sigBuffer   = Buffer.from(sig.padEnd(64, '0').slice(0, 64));
      const expBuffer   = Buffer.from(expectedSig.padEnd(64, '0').slice(0, 64));
      if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) {
        return NextResponse.json({ detail: 'Invalid OTP' }, { status: 400 });
      }

      // Also verify OTP exists in DB and is not expired
      const storedOtp = await prisma.otpCode.findFirst({
        where: {
          phone,
          code: otpInput,
          expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!storedOtp) {
        return NextResponse.json({ detail: 'OTP is invalid or expired' }, { status: 400 });
      }

      // Delete used OTP
      await prisma.otpCode.delete({ where: { id: storedOtp.id } });

      // Resolve merchant if not provided — default to first merchant
      if (!merchantId) {
        const firstMerchant = await prisma.merchant.findFirst({ orderBy: { createdAt: 'asc' } });
        merchantId = firstMerchant?.id ?? '';
      }
      if (!merchantId) {
        return NextResponse.json({ detail: 'No merchant found. Contact support.' }, { status: 400 });
      }

      // Check if member already exists for this merchant
      const existingMember = await prisma.member.findFirst({
        where: { phone, merchantId },
      });
      if (existingMember) {
        // Member already registered — issue JWT for them directly
        const [accessToken, refreshToken] = await Promise.all([
          createAccessToken({ sub: existingMember.id, merchant_id: merchantId, role: 'member' }),
          createRefreshToken({ sub: existingMember.id, merchant_id: merchantId, role: 'member' }),
        ]);
        return NextResponse.json({
          user: { id: existingMember.id, name: existingMember.name, memberCode: existingMember.memberCode, publicToken: existingMember.publicToken, role: 'member' },
          access_token: accessToken,
          refresh_token: refreshToken,
          already_registered: true,
        });
      }

      // Resolve default membership type for merchant
      const defaultType = await prisma.membershipType.findFirst({
        where: { merchantId },
      });
      if (!defaultType) {
        return NextResponse.json({ detail: 'Merchant has no membership types configured yet.' }, { status: 400 });
      }

      // Member code = prefix (first 3 chars of merchant name) + padded count
      const count = await prisma.member.count({ where: { merchantId } });
      const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
      const prefix = (merchant?.businessName ?? 'MC').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 3);
      const memberCode = `${prefix}${String(count + 1).padStart(4, '0')}`;

      // Resolve referrer
      let referredByMemberId: string | undefined;
      if (referralCode) {
        const referrer = await prisma.member.findFirst({
          where: { referralCode, merchantId },
        });
        referredByMemberId = referrer?.id;
      }

      // Expiry = membership type duration from today
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // default 1 year

      // Create the member
      const member = await prisma.member.create({
        data: {
          merchantId,
          membershipTypeId: defaultType.id,
          name,
          phone,
          dateOfBirth: dob ? new Date(dob) : undefined,
          memberCode,
          referralCode: generateReferralCode(),
          publicToken: generatePublicToken(),
          status: 'active',
          joinedDate: today,
          expiryDate,
          referredByMemberId,
        },
      });

      // Record DPDP consents (always membership, optionally marketing + whatsapp)
      const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
      const ua = request.headers.get('user-agent') ?? '';
      await prisma.memberConsent.createMany({
        data: [
          { memberId: member.id, merchantId, purpose: 'membership', granted: true,             ipAddress: ip, userAgent: ua },
          { memberId: member.id, merchantId, purpose: 'marketing',  granted: consentMarketing, ipAddress: ip, userAgent: ua },
          { memberId: member.id, merchantId, purpose: 'whatsapp',   granted: consentWhatsapp,  ipAddress: ip, userAgent: ua },
        ],
        skipDuplicates: true,
      });

      // Issue JWT
      const [accessToken, refreshToken] = await Promise.all([
        createAccessToken({ sub: member.id, merchant_id: merchantId, role: 'member' }),
        createRefreshToken({ sub: member.id, merchant_id: merchantId, role: 'member' }),
      ]);

      return NextResponse.json({
        user: {
          id: member.id,
          name: member.name,
          memberCode: member.memberCode,
          publicToken: member.publicToken,
          role: 'member',
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        member_code: memberCode,
        already_registered: false,
      }, { status: 201 });
    }

    return NextResponse.json({ detail: 'Invalid step. Use send_otp or verify_otp.' }, { status: 400 });
  } catch (err) {
    console.error('[auth/register]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
