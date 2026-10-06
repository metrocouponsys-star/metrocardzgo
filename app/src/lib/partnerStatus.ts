/**
 * Metro Cardz — Partner Status Logic (Centralized)
 *
 * COMPLIANCE-CRITICAL: This file is the single source of truth for all
 * partner-status-dependent UI decisions. Every deal card, deal detail page,
 * badge, CTA button, and redirect MUST read from these functions.
 *
 * Never hardcode partner language ("Metro Cardz Partner", "Book via us", etc.)
 * in any component or template — always call these helpers.
 */

export type PartnerStatus =
  | 'public_link'
  | 'affiliate'
  | 'authorised_partner'
  | 'direct_merchant';

// ── Badge Labels ─────────────────────────────────────────────────────────────
export function getPartnerBadgeLabel(status: PartnerStatus): string {
  switch (status) {
    case 'public_link':        return 'PUBLIC DIRECT LISTING';
    case 'affiliate':          return 'AFFILIATE PARTNER PASS';
    case 'authorised_partner': return 'METRO CARDZ PARTNER';
    case 'direct_merchant':    return 'DIRECT MERCHANT';
  }
}

// ── Badge visual config — colors defined here, not scattered across components ─
// ── Badge visual config — classical modern light palette ─────────────────────
export function getPartnerBadgeStyle(status: PartnerStatus): {
  bg: string;
  border: string;
  text: string;
  dot?: string;
} {
  switch (status) {
    case 'public_link':
      return {
        bg:     '#F3F4F6',
        border: '#E5E7EB',
        text:   '#4B5563',
        dot:    '#6B7280',
      };
    case 'affiliate':
      return {
        bg:     '#EFF6FF',
        border: '#BFDBFE',
        text:   '#1D4ED8',
        dot:    '#2563EB',
      };
    case 'authorised_partner':
      return {
        bg:     '#ECFDF5',
        border: '#A7F3D0',
        text:   '#047857',
        dot:    '#059669',
      };
    case 'direct_merchant':
      return {
        bg:     '#FEF3C7',
        border: '#FDE68A',
        text:   '#92400E',
        dot:    '#B45309',
      };
  }
}

// ── CTA button label ─────────────────────────────────────────────────────────
export function getCtaLabel(status: PartnerStatus): string {
  switch (status) {
    case 'public_link':        return 'Visit Website ↗';
    case 'affiliate':          return 'Get Deal on Partner Site ↗';
    case 'authorised_partner': return 'View Partner Deal →';
    case 'direct_merchant':    return 'Claim Exclusive Offer →';
  }
}

// ── Deal redirect URL selection ───────────────────────────────────────────────
// Server-side: determines the outbound URL for /api/redirect/[id]
export function getRedirectUrl(deal: {
  bookingUrl:   string | null;
  affiliateUrl: string | null;
  brand: {
    partnerStatus: string;
    website:       string | null;
  };
}): string | null {
  const status = deal.brand.partnerStatus as PartnerStatus;

  if (status === 'affiliate' && deal.affiliateUrl) {
    return deal.affiliateUrl;
  }
  if (deal.bookingUrl) {
    return deal.bookingUrl;
  }
  if (deal.brand.website) {
    return deal.brand.website;
  }
  return null;
}

// ── Disclosure text (shown on deal detail page) ───────────────────────────────
// Makes the redirect honest — no dark patterns
export function getDisclosureText(status: PartnerStatus): string {
  switch (status) {
    case 'public_link':
      return 'This is a publicly available listing. Metro Cardz has not independently verified the discount. Tapping redirects to the brand\'s official site.';
    case 'affiliate':
      return 'Metro Cardz earns a referral commission if you book via this link. The offer is provided by a third-party affiliate programme, not directly by Metro Cardz.';
    case 'authorised_partner':
      return 'This brand has an authorised partnership with Metro Cardz. Tapping redirects directly to the partner\'s booking engine. Metro Cardz never processes your payment.';
    case 'direct_merchant':
      return 'This is a directly negotiated Metro Cardz exclusive. Tapping redirects to the merchant\'s official reservation system. Metro Cardz never processes your payment.';
  }
}

// ── Priority sort weight (admin + public ordering) ───────────────────────────
export function getPartnerPriority(status: PartnerStatus): number {
  switch (status) {
    case 'direct_merchant':    return 4;
    case 'authorised_partner': return 3;
    case 'affiliate':          return 2;
    case 'public_link':        return 1;
  }
}

// ── Stale content threshold ───────────────────────────────────────────────────
export const STALE_CONTENT_DAYS = 30;

export function isStaleContent(lastVerifiedDate: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - lastVerifiedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > STALE_CONTENT_DAYS;
}
