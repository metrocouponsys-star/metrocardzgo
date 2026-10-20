import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/bcrypt';
import { addSecurityHeaders } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const currentPassword = String(body.current_password ?? '').trim();
    const newPassword = String(body.new_password ?? '').trim();

    if (!newPassword || newPassword.length < 6) {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'New password must be at least 6 characters long' }, { status: 400 })
      );
    }

    const adminUser = await prisma.merchantUser.findUnique({
      where: { id: auth.userId },
    });

    if (!adminUser) {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'Admin user not found' }, { status: 404 })
      );
    }

    // Verify current password if user has an existing password hash
    if (adminUser.passwordHash) {
      if (!currentPassword) {
        return addSecurityHeaders(
          NextResponse.json({ detail: 'Current password is required' }, { status: 400 })
        );
      }
      const isMatch = await verifyPassword(currentPassword, adminUser.passwordHash);
      if (!isMatch) {
        return addSecurityHeaders(
          NextResponse.json({ detail: 'Current password does not match' }, { status: 401 })
        );
      }
    }

    const newHash = await hashPassword(newPassword);

    await prisma.merchantUser.update({
      where: { id: adminUser.id },
      data: { passwordHash: newHash },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: adminUser.id,
        action: 'change_own_password',
        detail: `Super admin ${adminUser.phone || adminUser.email} changed their password`,
      },
    }).catch(() => {});

    return addSecurityHeaders(
      NextResponse.json({ success: true, message: 'Password changed successfully' })
    );
  } catch (error: any) {
    console.error('[admin/change-password]', error);
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Internal server error' }, { status: 500 })
    );
  }
}
