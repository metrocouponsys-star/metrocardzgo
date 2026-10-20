import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/bcrypt';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireSuperAdmin(request);
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
      include: {
        users: true,
      },
    });

    if (!merchant) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant not found' }, { status: 404 }));
    }

    const body = await request.json();
    const newPassword = body.password || body.new_password;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'Password must be at least 4 characters long' }, { status: 400 })
      );
    }

    const trimmedPassword = newPassword.trim();
    const passwordHash = await hashPassword(trimmedPassword);

    // If specific user_id is provided, target that user
    let targetUser = null;
    if (body.user_id) {
      targetUser = merchant.users.find((u) => u.id === body.user_id) || null;
    }

    // Otherwise target owner or first available user
    if (!targetUser) {
      targetUser =
        merchant.users.find((u) => u.role === 'owner') ||
        merchant.users[0] ||
        null;
    }

    if (targetUser) {
      await prisma.merchantUser.update({
        where: { id: targetUser.id },
        data: { passwordHash },
      });
    } else {
      // Create owner user if none existed
      const phone = merchant.whatsappNumber || `+91${merchant.id.replace(/\D/g, '').padEnd(10, '0').slice(0, 10)}`;
      targetUser = await prisma.merchantUser.create({
        data: {
          merchantId: merchant.id,
          name: `${merchant.businessName} (Owner)`,
          phone,
          role: 'owner',
          passwordHash,
        },
      });
    }

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: auth.userId,
        merchantId: merchant.id,
        action: 'reset_merchant_password',
        detail: `Reset password for merchant user: ${targetUser.name} (${targetUser.phone})`,
      },
    }).catch(() => {});

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        message: 'Password changed successfully',
        user: {
          id: targetUser.id,
          name: targetUser.name,
          phone: targetUser.phone,
          email: targetUser.email,
          role: targetUser.role,
        },
      })
    );
  } catch (error: any) {
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
