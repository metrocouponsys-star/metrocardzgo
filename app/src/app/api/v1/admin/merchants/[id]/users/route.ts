import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { hashPassword } from '@/lib/bcrypt';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: rawId } = await params;
    const decodedId = decodeURIComponent(rawId).trim();
    const compactId = decodedId.replace(/\s+/g, '');

    // Allow super_admin or users belonging to the requested merchant
    // Find the merchant
    const merchant = await prisma.merchant.findFirst({
      where: {
        OR: [
          { id: rawId },
          { id: decodedId },
          { id: compactId },
          { id: { contains: compactId } },
        ],
      },
    });

    const targetMerchantId = merchant ? merchant.id : decodedId;

    // Security check: non-super_admins can only access their own merchant's users
    if (auth.role !== 'super_admin' && auth.merchantId && auth.merchantId !== targetMerchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Access forbidden' }, { status: 403 }));
    }

    const users = await prisma.merchantUser.findMany({
      where: {
        OR: [
          { merchantId: targetMerchantId },
          { merchantId: rawId },
          { merchantId: compactId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const mappedUsers = users.map(u => ({
      id: u.id,
      merchant_id: u.merchantId ?? targetMerchantId,
      name: u.name,
      phone: u.phone,
      email: u.email ?? undefined,
      role: u.role,
      is_active: true,
      created_at: u.createdAt.toISOString(),
    }));

    return addSecurityHeaders(NextResponse.json(mappedUsers));
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id: rawId } = await params;
    const decodedId = decodeURIComponent(rawId).trim();
    const compactId = decodedId.replace(/\s+/g, '');

    const merchant = await prisma.merchant.findFirst({
      where: {
        OR: [
          { id: rawId },
          { id: decodedId },
          { id: compactId },
          { id: { contains: compactId } },
        ],
      },
    });

    const targetMerchantId = merchant ? merchant.id : decodedId;

    if (auth.role !== 'super_admin' && auth.merchantId && auth.merchantId !== targetMerchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Access forbidden' }, { status: 403 }));
    }

    const body = await request.json();
    const { name, phone, email, role, password } = body;

    if (!name || !phone) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Name and phone are required' }, { status: 400 }));
    }

    const passwordHash = password ? await hashPassword(password) : null;

    const newUser = await prisma.merchantUser.create({
      data: {
        merchantId: targetMerchantId,
        name: String(name).trim(),
        phone: String(phone).trim(),
        email: email ? String(email).trim().toLowerCase() : null,
        role: role || 'staff',
        passwordHash,
      },
    });

    return addSecurityHeaders(NextResponse.json({
      id: newUser.id,
      merchant_id: newUser.merchantId ?? targetMerchantId,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email ?? undefined,
      role: newUser.role,
      is_active: true,
      created_at: newUser.createdAt.toISOString(),
    }, { status: 201 }));
  } catch (error: any) {
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
