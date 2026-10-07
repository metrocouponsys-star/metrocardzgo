import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, businessName, business, industry, message } = body;

    const leadName = (name ?? '').trim();
    const leadPhone = (phone ?? '').trim();
    const leadEmail = (email ?? '').trim();
    const leadBusiness = (businessName ?? business ?? '').trim();
    const leadIndustry = (industry ?? '').trim();
    const leadMessage = (message ?? '').trim();

    if (!leadName || !leadPhone) {
      return NextResponse.json(
        { detail: 'Name and phone number are required.' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const leadDetail = JSON.stringify({
      name: leadName,
      phone: leadPhone,
      email: leadEmail,
      business: leadBusiness,
      industry: leadIndustry,
      message: leadMessage,
      receivedAt: new Date().toISOString(),
      ip: ipAddress,
    });

    console.log('[NEW LEAD INQUIRY RECEIVED]:', leadDetail);

    // Find super admin or system user to associate audit log
    const adminUser = await prisma.merchantUser.findFirst({
      where: { role: 'super_admin' },
      select: { id: true },
    });

    if (adminUser) {
      await prisma.adminAuditLog.create({
        data: {
          id: crypto.randomUUID(),
          adminUserId: adminUser.id,
          merchantId: null,
          action: 'contact_lead_inquiry',
          detail: leadDetail,
          ipAddress,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Our card specialists will reach out to you shortly.',
    }, { status: 201 });
  } catch (err) {
    console.error('[public/contact POST error]:', err);
    return NextResponse.json(
      { detail: 'Failed to submit inquiry. Please try WhatsApp support.' },
      { status: 500 }
    );
  }
}
