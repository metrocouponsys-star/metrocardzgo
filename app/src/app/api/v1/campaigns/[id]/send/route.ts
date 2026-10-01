/**
 * POST /api/v1/campaigns/[id]/send — send campaign messages to all target members
 * Port of Python misc.py send_campaign
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendOtpSms } from '@/lib/msg91';
import { sendWhatsApp } from '@/lib/aisensy';
import crypto from 'crypto';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const merchantId = getMerchantId(auth, request);
  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, ...(merchantId ? { merchantId } : {}) },
  });
  if (!campaign) return NextResponse.json({ detail: 'Campaign not found' }, { status: 404 });
  if (campaign.status === 'sent') {
    return NextResponse.json({ detail: 'Campaign already sent' }, { status: 400 });
  }

  // Build target members
  const where: any = { merchantId: campaign.merchantId };
  if (campaign.targetAudience === 'by_membership_type' && campaign.targetMembershipTypeId) {
    where.membershipTypeId = campaign.targetMembershipTypeId;
  } else if (campaign.targetAudience === 'expiring_soon') {
    where.status = 'expiring_soon';
  }
  const members = await prisma.member.findMany({ where });

  // Mark as sending
  await prisma.campaign.update({ where: { id }, data: { status: 'sending' } });

  let sentCount = 0;
  for (const member of members) {
    const message = campaign.templateText
      .replace(/\{member_name\}/gi, member.name)
      .replace(/\{member_code\}/gi, member.memberCode)
      .replace(/\{expiry_date\}/gi, member.expiryDate.toLocaleDateString('en-IN'));

    let success = false;
    if (campaign.channel === 'sms') {
      success = await sendOtpSms(member.phone, message);
    } else if (campaign.channel === 'whatsapp') {
      success = await sendWhatsApp(member.phone, message, campaign.name);
    }

    await prisma.messageLog.create({
      data: {
        id: crypto.randomUUID(),
        memberId: member.id,
        campaignId: id,
        channel: campaign.channel,
        status: success ? 'sent' : 'failed',
      },
    });
    if (success) sentCount++;
  }

  await prisma.campaign.update({
    where: { id },
    data: { status: 'sent', sentCount, audienceSize: members.length },
  });

  return NextResponse.json({ message: 'Campaign sent', sent: sentCount, total: members.length });
}
