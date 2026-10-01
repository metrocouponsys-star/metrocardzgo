/**
 * GET  /api/v1/admin/merchants — list all merchants
 * POST /api/v1/admin/merchants — create merchant + owner user
 * Port of Python admin.py list_merchants + create_merchant
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/bcrypt';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const merchants = await prisma.merchant.findMany({
    include: { _count: { select: { members: true, users: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(merchants);
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const phoneClean = (body.owner_phone ?? '').replace(/\s/g, '');
    const emailClean = body.owner_email ? body.owner_email.trim().toLowerCase() : null;

    // Duplicate checks
    const existingPhone = await prisma.merchantUser.findFirst({ where: { phone: phoneClean } });
    if (existingPhone) {
      return NextResponse.json(
        { detail: 'Phone number is already registered to an existing merchant user.' },
        { status: 400 }
      );
    }
    if (emailClean) {
      const existingEmail = await prisma.merchantUser.findUnique({ where: { email: emailClean } });
      if (existingEmail) {
        return NextResponse.json(
          { detail: 'Email address is already registered.' },
          { status: 400 }
        );
      }
    }

    const merchantId = crypto.randomUUID();
    const secretSalt = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const passwordHash = body.owner_password
      ? await hashPassword(body.owner_password)
      : await hashPassword(phoneClean); // default password = phone number

    const merchant = await prisma.merchant.create({
      data: {
        id: merchantId,
        businessName: body.business_name,
        category: body.category ?? null,
        planTier: body.plan_tier ?? 'Starter',
        whatsappNumber: body.whatsapp_number ?? null,
        address: body.address ?? null,
        secretSalt,
        status: 'active',
        approvalStatus: body.approval_status ?? 'approved',
        referralBonusPoints: body.referral_bonus_points ?? 50,
        users: {
          create: {
            id: ownerId,
            name: body.owner_name,
            phone: phoneClean,
            email: emailClean,
            role: 'owner',
            passwordHash,
          },
        },
      },
      include: { users: true, _count: { select: { members: true } } },
    });

    // Log audit action
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: auth.userId,
        merchantId: merchant.id,
        action: 'create_merchant',
        detail: `Created merchant: ${merchant.businessName}`,
      },
    });

    return NextResponse.json(merchant, { status: 201 });
  } catch (err: any) {
    console.error('[admin/merchants POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
