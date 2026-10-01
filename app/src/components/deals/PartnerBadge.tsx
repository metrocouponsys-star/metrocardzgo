'use client';

import { getPartnerBadgeLabel, getPartnerBadgeStyle, type PartnerStatus } from '@/lib/partnerStatus';

interface PartnerBadgeProps {
  status: PartnerStatus;
  /** If true, includes a leading shield/star icon for direct_merchant */
  showIcon?: boolean;
  className?: string;
}

/**
 * PartnerBadge — renders the compliance badge for a deal.
 *
 * COMPLIANCE-CRITICAL: height is fixed at 24px, text is uppercase badge-micro.
 * Do NOT override styles that change the visual parity between tiers —
 * all four partner statuses must be visually distinguishable at a glance.
 */
export function PartnerBadge({ status, showIcon = true, className = '' }: PartnerBadgeProps) {
  const style = getPartnerBadgeStyle(status);
  const label = getPartnerBadgeLabel(status);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 rounded-full h-6 shrink-0 ${className}`}
      style={{
        backgroundColor: style.bg,
        border:          `1px solid ${style.border}`,
        color:           style.text,
        fontSize:        '10px',
        fontWeight:      700,
        lineHeight:      '12px',
        letterSpacing:   '0.06em',
        fontFamily:      '"Plus Jakarta Sans", sans-serif',
        whiteSpace:      'nowrap',
      }}
    >
      {showIcon && status === 'direct_merchant' && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M5 0.5L6.18 3.48L9.51 3.64L7.09 5.72L7.94 9L5 7.27L2.06 9L2.91 5.72L0.49 3.64L3.82 3.48L5 0.5Z"
            fill={style.text}
          />
        </svg>
      )}
      {showIcon && status === 'authorised_partner' && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="4" stroke={style.text} strokeWidth="1.2" />
          <path d="M3 5l1.5 1.5L7 3.5" stroke={style.text} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {showIcon && status === 'affiliate' && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 8L8 2M8 2H5M8 2V5" stroke={style.text} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {label}
    </span>
  );
}
