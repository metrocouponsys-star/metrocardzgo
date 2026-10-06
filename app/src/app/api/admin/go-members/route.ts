import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminToken, DEALS_ADMIN_COOKIE } from '@/lib/dealsAuth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(DEALS_ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

function generatePublicToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── GET /api/admin/go-members ─────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get('search') || '').trim();
  const filter = searchParams.get('filter') || 'all'; // all | active | expiring_soon | expired

  // Fetch members
  const rawMembers = await prisma.member.findMany({
    include: {
      membershipType: { select: { id: true, name: true } },
      merchant: { select: { id: true, businessName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const now = new Date();

  // Process members with 1-year validity calculation
  const members = rawMembers.map((m) => {
    const joined = m.joinedDate ? new Date(m.joinedDate) : new Date(m.createdAt);
    const expiry = m.expiryDate
      ? new Date(m.expiryDate)
      : new Date(joined.getTime() + 365 * 24 * 60 * 60 * 1000);

    const diffTime = expiry.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let validityStatus: 'active' | 'expiring_soon' | 'expired';
    if (daysRemaining <= 0) {
      validityStatus = 'expired';
    } else if (daysRemaining <= 30) {
      validityStatus = 'expiring_soon';
    } else {
      validityStatus = 'active';
    }

    return {
      id: m.id,
      memberCode: m.memberCode,
      name: m.name,
      phone: m.phone,
      email: m.email || null,
      joinedDate: joined.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      daysRemaining,
      validityStatus,
      tierName: m.membershipType?.name || 'GO 1-Year Pass',
      merchantName: m.merchant?.businessName || 'Metro Cardz GO',
      loyaltyPoints: m.loyaltyPoints ? Number(m.loyaltyPoints) : 0,
      notes: m.notes || null,
      createdAt: m.createdAt.toISOString(),
    };
  });

  // Calculate summary counts
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.validityStatus === 'active').length;
  const expiringSoonCount = members.filter((m) => m.validityStatus === 'expiring_soon').length;
  const expiredCount = members.filter((m) => m.validityStatus === 'expired').length;

  // Apply filters
  let filtered = members;
  if (filter === 'active') {
    filtered = filtered.filter((m) => m.validityStatus === 'active');
  } else if (filter === 'expiring_soon') {
    filtered = filtered.filter((m) => m.validityStatus === 'expiring_soon');
  } else if (filter === 'expired') {
    filtered = filtered.filter((m) => m.validityStatus === 'expired');
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    members: filtered,
    stats: {
      totalCount,
      activeCount,
      expiringSoonCount,
      expiredCount,
    },
  });
}

// ── POST /api/admin/go-members (Create new GO member for 1-Year) ─────────────
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: true, message: 'Invalid JSON body' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const phone = (body.phone || '').replace(/\D/g, '').slice(-10);
  const email = (body.email || '').trim() || null;
  const tierName = (body.tierName || 'GO 1-Year Pass').trim();
  const notes = (body.notes || '').trim() || null;

  if (!name) {
    return NextResponse.json({ error: true, message: 'Member full name is required' }, { status: 400 });
  }
  if (phone.length !== 10) {
    return NextResponse.json({ error: true, message: 'Valid 10-digit mobile number is required' }, { status: 400 });
  }

  // Ensure default merchant and membership type exist
  let merchant = await prisma.merchant.findFirst({
    where: { OR: [{ businessName: 'Metro Cardz GO' }, { id: 'go-platform' }] },
  });
  if (!merchant) {
    merchant = await prisma.merchant.findFirst({ orderBy: { createdAt: 'asc' } });
  }
  if (!merchant) {
    merchant = await prisma.merchant.create({
      data: {
        id: 'go-platform',
        businessName: 'Metro Cardz GO',
        category: 'Rewards & Lifestyle',
        planTier: 'Enterprise',
        secretSalt: crypto.randomBytes(16).toString('hex'),
      },
    });
  }

  let membershipType = await prisma.membershipType.findFirst({
    where: { merchantId: merchant.id, name: tierName },
  });
  if (!membershipType) {
    membershipType = await prisma.membershipType.findFirst({
      where: { merchantId: merchant.id },
    });
  }
  if (!membershipType) {
    membershipType = await prisma.membershipType.create({
      data: {
        merchantId: merchant.id,
        name: tierName,
        description: 'Standard 1-Year Metro Cardz GO membership pass with full deal privileges',
      },
    });
  }

  // Generate member code if not provided
  const memberCount = await prisma.member.count({ where: { merchantId: merchant.id } });
  const memberCode =
    (body.memberCode || '').trim() ||
    `GO-${new Date().getFullYear()}-${String(memberCount + 1).padStart(4, '0')}`;

  // Check if member already exists
  const existing = await prisma.member.findFirst({
    where: { merchantId: merchant.id, phone },
  });
  if (existing) {
    return NextResponse.json(
      { error: true, message: `Member with phone +91 ${phone} already exists (${existing.memberCode})` },
      { status: 409 }
    );
  }

  // Joined date and 1-Year Expiry calculation
  const joinedDate = body.joinedDate ? new Date(body.joinedDate) : new Date();
  let expiryDate: Date;
  if (body.expiryDate) {
    expiryDate = new Date(body.expiryDate);
  } else {
    expiryDate = new Date(joinedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1-year validity
  }

  const created = await prisma.member.create({
    data: {
      merchantId: merchant.id,
      membershipTypeId: membershipType.id,
      memberCode,
      name,
      phone,
      email,
      joinedDate,
      expiryDate,
      publicToken: generatePublicToken(),
      referralCode: generateReferralCode(),
      status: 'active',
      notes,
    },
    include: {
      membershipType: { select: { name: true } },
    },
  });

  return NextResponse.json({
    success: true,
    message: '1-Year GO Member created successfully',
    member: {
      id: created.id,
      memberCode: created.memberCode,
      name: created.name,
      phone: created.phone,
      email: created.email,
      joinedDate: created.joinedDate.toISOString().split('T')[0],
      expiryDate: created.expiryDate.toISOString().split('T')[0],
      validityStatus: 'active',
      tierName: created.membershipType?.name || tierName,
    },
  });
}

// ── PATCH /api/admin/go-members (Renew +1 Year or Send Reminder) ──────────────
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: true, message: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, action } = body;
  if (!id) {
    return NextResponse.json({ error: true, message: 'Member ID is required' }, { status: 400 });
  }

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: true, message: 'Member not found' }, { status: 404 });
  }

  // Action: Renew pass for another 1 full year (+365 days)
  if (action === 'renew_1_year') {
    const currentExpiry = member.expiryDate ? new Date(member.expiryDate) : new Date();
    const baseDate = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();

    const newExpiry = new Date(baseDate);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1); // Add 1 year

    const updated = await prisma.member.update({
      where: { id },
      data: {
        expiryDate: newExpiry,
        status: 'active',
        notes: member.notes
          ? `${member.notes}\n[Renewed 1-Yr on ${new Date().toLocaleDateString()}]`
          : `[Renewed 1-Yr on ${new Date().toLocaleDateString()}]`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${member.name}'s pass has been renewed for 1 Year (expires ${newExpiry.toISOString().split('T')[0]})`,
      expiryDate: newExpiry.toISOString().split('T')[0],
    });
  }

  // Action: Record 1-Year Reminder Sent
  if (action === 'record_reminder') {
    const channel = body.channel || 'whatsapp';
    const noteEntry = `[1-Yr Expiry Reminder sent via ${channel.toUpperCase()} on ${new Date().toLocaleDateString()}]`;

    await prisma.member.update({
      where: { id },
      data: {
        notes: member.notes ? `${member.notes}\n${noteEntry}` : noteEntry,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reminder logged for ${member.name} (${channel})`,
    });
  }

  return NextResponse.json({ error: true, message: 'Invalid action' }, { status: 400 });
}

// ── DELETE /api/admin/go-members ──────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: true, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: true, message: 'Member ID is required' }, { status: 400 });
  }

  try {
    await prisma.member.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: true, message: err.message || 'Failed to delete member' }, { status: 500 });
  }
}
