import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnerOrAdmin } from '@/lib/auth';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireOwnerOrAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id: merchantId, userId } = await params;

    // Security check: non-super_admin can only delete within their own merchant
    if (auth.role !== 'super_admin' && auth.merchantId !== merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Forbidden' }, { status: 403 }));
    }

    const user = await prisma.merchantUser.findUnique({
      where: { id: userId },
    });

    if (!user || user.merchantId !== merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'User not found' }, { status: 404 }));
    }

    // Protect last owner
    if (user.role === 'owner') {
      const ownerCount = await prisma.merchantUser.count({
        where: { merchantId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        return addSecurityHeaders(
          NextResponse.json({ detail: 'Cannot delete the only owner account of this merchant' }, { status: 400 })
        );
      }
    }

    await prisma.merchantUser.delete({
      where: { id: userId },
    });

    return addSecurityHeaders(NextResponse.json({ success: true, message: 'User deleted' }));
  } catch (error: any) {
    console.error('[admin/merchants/[id]/users/[userId] DELETE]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireOwnerOrAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id: merchantId, userId } = await params;

    if (auth.role !== 'super_admin' && auth.merchantId !== merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Forbidden' }, { status: 403 }));
    }

    const body = await request.json();
    const updated = await prisma.merchantUser.update({
      where: { id: userId },
      data: {
        name: body.name !== undefined ? String(body.name).trim() : undefined,
        phone: body.phone !== undefined ? String(body.phone).trim() : undefined,
        email: body.email !== undefined ? String(body.email).trim() : undefined,
        role: body.role !== undefined ? body.role : undefined,
      },
    });

    return addSecurityHeaders(NextResponse.json(updated));
  } catch (error: any) {
    console.error('[admin/merchants/[id]/users/[userId] PATCH]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
