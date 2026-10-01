import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedirectUrl } from '@/lib/partnerStatus';

export const dynamic = 'force-dynamic';

/**
 * GET /api/redirect/[id]
 *
 * Server-side redirect handler:
 * 1. Looks up the deal and its brand partner_status
 * 2. Determines the correct outbound URL (booking_url / affiliate_url / website)
 *    via partnerStatus.ts — centralised, never per-brand logic in frontend
 * 3. Logs the click to click_log for analytics
 * 4. Issues a 302 redirect to the external site
 *
 * Why server-side? Allows:
 *   - Click tracking per deal (Phase 1)
 *   - Affiliate parameter injection without frontend changes
 *   - URL validation (prevents open-redirect abuse)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dealId = parseInt(id, 10);

    if (isNaN(dealId)) {
      return NextResponse.redirect(new URL('/go', request.url));
    }

    const deal = await prisma.deal.findFirst({
      where: { id: dealId, active: true },
      include: {
        brand: {
          select: {
            partnerStatus: true,
            website:       true,
          },
        },
      },
    });

    if (!deal) {
      return NextResponse.redirect(new URL('/go', request.url));
    }

    const outboundUrl = getRedirectUrl({
      bookingUrl:   deal.bookingUrl,
      affiliateUrl: deal.affiliateUrl,
      brand: {
        partnerStatus: deal.brand.partnerStatus,
        website:       deal.brand.website,
      },
    });

    // ── Click logging (Phase 1 tracking) ─────────────────────────────────────
    try {
      await prisma.clickLog.create({
        data: {
          dealId,
          referrer:  request.headers.get('referer') ?? undefined,
          userAgent: request.headers.get('user-agent') ?? undefined,
        },
      });
    } catch (logErr) {
      // Click logging failure must NEVER block the redirect — it's analytics, not core flow
      console.warn('[redirect] click log failed', logErr);
    }

    if (!outboundUrl) {
      // No URL configured — send back to the deal detail page
      return NextResponse.redirect(new URL(`/deal/${id}`, request.url));
    }

    // Security: validate the URL is a proper http/https URL (no open-redirect abuse)
    try {
      const parsed = new URL(outboundUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      console.error(`[redirect] invalid URL for deal ${id}: ${outboundUrl}`);
      return NextResponse.redirect(new URL(`/deal/${id}`, request.url));
    }

    return NextResponse.redirect(outboundUrl, { status: 302 });
  } catch (error) {
    console.error('[GET /api/redirect/[id]]', error);
    return NextResponse.redirect(new URL('/go', request.url));
  }
}
