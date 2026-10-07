import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  if (!merchantId) return NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 });

  const { id: memberId } = await params;

  try {
    const body = await request.json();
    const { amount, coupon_code, note } = body;
    const purchaseAmount = Number(amount || 0);

    if (purchaseAmount < 0 || isNaN(purchaseAmount)) {
      return NextResponse.json({ detail: 'Valid purchase amount required' }, { status: 400 });
    }

    // 1. Verify member
    const member = await prisma.member.findFirst({
      where: { id: memberId, merchantId },
    });
    if (!member) return NextResponse.json({ detail: 'Member not found' }, { status: 404 });
    if (member.status === 'deactivated') {
      return NextResponse.json({ detail: 'Member account is deactivated' }, { status: 403 });
    }

    // 2. Coupon validation if provided
    let discountAmount = 0;
    let couponToUpdate: any = null;

    if (coupon_code) {
      const coupon = await prisma.couponCode.findFirst({
        where: {
          merchantId,
          code: String(coupon_code).trim().toUpperCase(),
          isActive: true,
        },
      });

      if (coupon) {
        const isNotExpired = !coupon.expiresAt || coupon.expiresAt >= new Date();
        const hasUses = coupon.maxUses === null || coupon.usedCount < coupon.maxUses;
        const meetsMin = !coupon.minPurchase || purchaseAmount >= Number(coupon.minPurchase);

        if (isNotExpired && hasUses && meetsMin) {
          if (coupon.discountType === 'percent') {
            discountAmount = Math.round((purchaseAmount * Number(coupon.value)) / 100);
          } else {
            discountAmount = Math.min(purchaseAmount, Number(coupon.value));
          }
          couponToUpdate = coupon;
        }
      }
    }

    const finalAmount = Math.max(0, purchaseAmount - discountAmount);

    // 3. Compute points earned using active points rules
    const activeRules = await prisma.pointsRule.findMany({
      where: { merchantId, isActive: true },
    });

    let pointsEarned = 0;
    if (activeRules.length > 0) {
      for (const rule of activeRules) {
        if (rule.ruleType === 'per_visit') {
          pointsEarned += Number(rule.pointsValue);
        } else if (rule.ruleType === 'per_rupee') {
          const unit = Number(rule.spendUnit || 1);
          pointsEarned += Math.floor(finalAmount / unit) * Number(rule.pointsValue);
        }
      }
    } else {
      // Default rule: 1 point per ₹10 spent
      pointsEarned = Math.floor(finalAmount / 10);
    }

    // 4. Atomic transaction update
    const result = await prisma.$transaction(async (tx) => {
      const freshMember = await tx.member.findUniqueOrThrow({
        where: { id: memberId },
      });

      const currentPoints = Number(freshMember.loyaltyPoints ?? 0);
      const newPointsBalance = currentPoints + pointsEarned;

      await tx.member.update({
        where: { id: memberId },
        data: {
          loyaltyPoints: newPointsBalance,
          totalVisits: { increment: 1 },
        },
      });

      // Record loyalty audit trail
      if (pointsEarned > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            id: crypto.randomUUID(),
            memberId,
            merchantId,
            type: 'earn',
            points: pointsEarned,
            balanceAfter: newPointsBalance,
            note: note || `Purchase ₹${finalAmount}${discountAmount > 0 ? ` (Discount: ₹${discountAmount})` : ''}`,
          },
        });
      }

      // Increment coupon usage
      if (couponToUpdate) {
        await tx.couponCode.update({
          where: { id: couponToUpdate.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return {
        member_id: memberId,
        purchase_amount: purchaseAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        points_earned: pointsEarned,
        new_balance: newPointsBalance,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[members/purchase POST]', err);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
