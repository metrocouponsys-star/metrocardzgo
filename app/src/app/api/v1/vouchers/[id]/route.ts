import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const merchantId = getMerchantId(auth, request);

  if (auth.role !== 'super_admin' && !merchantId) {
    return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });
  }

  const existing = await prisma.giftVoucher.findFirst({
    where: { id, ...(auth.role !== 'super_admin' ? { merchantId: merchantId! } : {}) },
  });
  if (!existing) return NextResponse.json({ detail: 'Voucher not found' }, { status: 404 });

  if (existing.isRedeemed) {
    return NextResponse.json({ detail: 'Cannot delete an already redeemed voucher' }, { status: 400 });
  }

  await prisma.giftVoucher.delete({ where: { id } });
  return NextResponse.json({ message: 'Voucher deleted successfully' });
}
