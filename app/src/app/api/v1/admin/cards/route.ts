import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const merchantId = url.searchParams.get('merchant_id');
    const search = url.searchParams.get('search');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (merchantId) {
      where.allocatedMerchantId = merchantId;
    }
    if (search) {
      const q = search.trim();
      const qClean = q.replace(/\s/g, '');
      where.OR = [
        { cardNumber: { contains: qClean } },
        { cardNumber: { contains: q } },
        { member: { name: { contains: q } } },
        { member: { phone: { contains: qClean } } },
        { merchant: { businessName: { contains: q } } },
      ];
    }

    const cards = await prisma.cardInventoryItem.findMany({
      where,
      include: {
        merchant: { select: { id: true, businessName: true } },
        member: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const mapped = cards.map(c => ({
      id: c.id,
      card_number: c.cardNumber,
      status: c.status,
      allocated_merchant_id: c.allocatedMerchantId ?? undefined,
      allocated_merchant_name: c.merchant?.businessName ?? undefined,
      allocated_at: c.allocatedAt ? c.allocatedAt.toISOString() : undefined,
      linked_member_id: c.linkedMemberId ?? undefined,
      linked_member_name: c.member?.name ?? undefined,
      linked_member_phone: c.member?.phone ?? undefined,
      linked_at: c.linkedAt ? c.linkedAt.toISOString() : undefined,
      created_by_admin_id: c.createdByAdminId ?? undefined,
      created_at: c.createdAt.toISOString(),
    }));

    return addSecurityHeaders(NextResponse.json(mapped));
  } catch (err: any) {
    console.error('[admin/cards GET]', err);
    return addSecurityHeaders(
      NextResponse.json({ detail: err.message || 'Failed to fetch cards' }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const rawCardNumbers: string[] = body.card_numbers || [];

    if (!Array.isArray(rawCardNumbers) || rawCardNumbers.length === 0) {
      return addSecurityHeaders(
        NextResponse.json({ detail: 'card_numbers array is required' }, { status: 400 })
      );
    }

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];
    const validCardsToInsert: { id: string; cardNumber: string; status: 'unassigned'; createdByAdminId: string }[] = [];

    // Pre-fetch existing card numbers in batch for fast duplicate check
    const existingCards = await prisma.cardInventoryItem.findMany({
      select: { cardNumber: true },
    });
    const existingSet = new Set(existingCards.map(c => c.cardNumber.replace(/\s/g, '')));

    for (const raw of rawCardNumbers) {
      const digits = String(raw).trim().replace(/\D/g, '');
      if (digits.length !== 16) {
        errors.push(`"${raw}" — invalid format (must be 16 digits)`);
        continue;
      }

      if (existingSet.has(digits)) {
        skipped++;
        continue;
      }

      const formatted = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`;
      validCardsToInsert.push({
        id: crypto.randomUUID(),
        cardNumber: formatted,
        status: 'unassigned',
        createdByAdminId: auth.userId,
      });
      existingSet.add(digits);
      added++;
    }

    if (validCardsToInsert.length > 0) {
      await prisma.cardInventoryItem.createMany({
        data: validCardsToInsert,
        skipDuplicates: true,
      });
    }

    return addSecurityHeaders(
      NextResponse.json({ added, skipped, errors }, { status: 201 })
    );
  } catch (err: any) {
    console.error('[admin/cards POST]', err);
    return addSecurityHeaders(
      NextResponse.json({ detail: err.message || 'Failed to add cards' }, { status: 500 })
    );
  }
}
