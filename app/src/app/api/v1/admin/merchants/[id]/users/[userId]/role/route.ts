import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOwnerOrAdmin } from '@/lib/auth';
import { addSecurityHeaders } from '@/lib/security';

type Params = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireOwnerOrAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id: merchantId, userId } = await params;

    if (auth.role !== 'super_admin' && auth.merchantId !== merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Forbidden' }, { status: 403 }));
    }

    const url = new URL(request.url);
    let role = url.searchParams.get('role');
    if (!role) {
      try {
        const body = await request.json();
        role = body.role;
      } catch {}
    }

    if (!role || !['owner', 'staff'].includes(role)) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Valid role (owner or staff) required' }, { status: 400 }));
    }

    const updated = await prisma.merchantUser.update({
      where: { id: userId },
      data: { role: role as 'owner' | 'staff' },
    });

    return addSecurityHeaders(NextResponse.json(updated));
  } catch (error: any) {
    console.error('[admin/merchants/[id]/users/[userId]/role PATCH]', error);
    return addSecurityHeaders(NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 }));
  }
}
