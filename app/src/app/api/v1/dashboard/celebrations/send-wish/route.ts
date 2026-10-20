import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getMerchantId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addSecurityHeaders } from '@/lib/security';
import { decryptField } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const merchantId = getMerchantId(auth, request);
    if (!merchantId) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Merchant ID required' }, { status: 400 }));
    }

    const body = await request.json();
    const { member_id, event_type, custom_message } = body;

    if (!member_id) {
      return addSecurityHeaders(NextResponse.json({ detail: 'member_id required' }, { status: 400 }));
    }

    const [member, merchant] = await Promise.all([
      prisma.member.findFirst({
        where: { id: member_id, merchantId },
      }),
      prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { businessName: true },
      }),
    ]);

    if (!member) {
      return addSecurityHeaders(NextResponse.json({ detail: 'Member not found' }, { status: 404 }));
    }

    const rawPhone = decryptField(member.phone) || member.phone;
    const digitsOnly = rawPhone.replace(/\D/g, '');
    const cleanPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;

    const businessName = merchant?.businessName || 'Metro Cardz';
    const isBirthday = event_type === 'birthday';
    const defaultMsg = isBirthday
      ? `Dear ${member.name}, wishing you a very Happy Birthday! 🎂 Enjoy exclusive celebrations and rewards at ${businessName}.`
      : `Dear ${member.name}, wishing you a wonderful Anniversary! 🎉 Thank you for being a valued member at ${businessName}.`;

    const finalMessage = (custom_message && custom_message.trim()) ? custom_message.trim() : defaultMsg;
    const encodedText = encodeURIComponent(finalMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

    return addSecurityHeaders(
      NextResponse.json({
        member_id: member.id,
        member_name: member.name,
        phone: rawPhone,
        message: finalMessage,
        whatsapp_url: whatsappUrl,
        delivery_status: 'ready',
        provider: 'whatsapp_web',
      })
    );
  } catch (error: any) {
    console.error('[celebrations/send-wish POST]', error);
    return addSecurityHeaders(
      NextResponse.json({ detail: error.message || 'Server error' }, { status: 500 })
    );
  }
}
