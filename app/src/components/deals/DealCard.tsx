'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PartnerBadge } from './PartnerBadge';
import { getCtaLabel, type PartnerStatus } from '@/lib/partnerStatus';

export interface DealCardProps {
  id: number;
  offerTitle: string;
  offerPercentage?: number | null;
  offerType: string;
  endDate: string;
  lastVerifiedDate: string;
  featured?: boolean;
  heroImageUrl?: string | null;
  brand: {
    name:          string;
    logoUrl?:      string | null;
    partnerStatus: PartnerStatus;
    city:          string;
    category:      string;
  };
  /** Optional: distance label e.g. "1.8 km" */
  distance?: string;
  /** Optional: rating 0-5 */
  rating?: number;
}

/**
 * DealCard — deal listing card for the category grid page.
 * White/light theme — classical modern design.
 */
export function DealCard({ id, offerTitle, offerPercentage, endDate, lastVerifiedDate, featured, heroImageUrl, brand, distance, rating }: DealCardProps) {
  const verifiedDaysAgo = Math.floor(
    (Date.now() - new Date(lastVerifiedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const isExpiringSoon = (new Date(endDate).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000;

  const isFeatured = featured || brand.partnerStatus === 'direct_merchant';

  return (
    <article
      style={{
        background:   '#FFFFFF',
        border:       `1px solid ${isFeatured ? '#FDE68A' : '#E5E7EB'}`,
        borderRadius: '16px',
        overflow:     'hidden',
        boxShadow:    isFeatured
          ? '0 4px 20px rgba(197,155,39,0.12)'
          : '0 1px 6px rgba(0,0,0,0.06)',
        transition:   'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = isFeatured
          ? '0 8px 32px rgba(197,155,39,0.2)'
          : '0 6px 24px rgba(0,0,0,0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = isFeatured
          ? '0 4px 20px rgba(197,155,39,0.12)'
          : '0 1px 6px rgba(0,0,0,0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'none';
      }}
    >
      {/* Hero image */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#F3F4F6' }}>
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={`${brand.name} — ${offerTitle}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div
            style={{
              position:   'absolute',
              inset:      0,
              background: isFeatured
                ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:      isFeatured ? '#C59B27' : '#D1D5DB',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="4" y="8" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="14" cy="17" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 30l10-8 6 5 6-6 10 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Light gradient overlay */}
        <div
          style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.25) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Partner badge — top left */}
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <PartnerBadge status={brand.partnerStatus} />
        </div>

        {/* Rating — bottom left */}
        {rating && (
          <div
            style={{
              position:     'absolute',
              bottom:       '10px',
              left:         '10px',
              display:      'flex',
              alignItems:   'center',
              gap:          '4px',
              background:   'rgba(255,255,255,0.92)',
              borderRadius: '9999px',
              padding:      '2px 8px',
              border:       '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <span style={{ color: '#C59B27', fontSize: '12px' }}>★</span>
            <span style={{ color: '#111827', fontSize: '12px', fontWeight: 600 }}>{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Expiring soon badge */}
        {isExpiringSoon && (
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <span style={{
              background:    '#FEF3C7',
              border:        '1px solid #FDE68A',
              color:         '#92400E',
              fontSize:      '10px',
              fontWeight:    700,
              padding:       '2px 8px',
              borderRadius:  '9999px',
              letterSpacing: '0.04em',
            }}>
              ENDS SOON
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Location + distance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1C4.34 1 3 2.34 3 4c0 2.5 3 7 3 7s3-4.5 3-7c0-1.66-1.34-3-3-3z" stroke="#6B7280" strokeWidth="1.2" />
            <circle cx="6" cy="4" r="1" stroke="#6B7280" strokeWidth="1" />
          </svg>
          <span style={{ fontSize: '11px', color: '#6B7280', fontFamily: '"Inter", sans-serif' }}>
            {brand.city}{distance ? ` • ${distance}` : ''}
          </span>
        </div>

        {/* Brand name */}
        <h3
          style={{
            fontFamily:   '"Syne", sans-serif',
            fontSize:     '17px',
            fontWeight:   700,
            color:        '#111827',
            lineHeight:   '24px',
            marginBottom: '4px',
          }}
        >
          {brand.name}
        </h3>

        {/* Offer title */}
        <p
          style={{
            fontFamily:   '"Inter", sans-serif',
            fontSize:     '13px',
            fontWeight:   600,
            color:        '#B45309',
            lineHeight:   '20px',
            marginBottom: '10px',
          }}
        >
          {offerPercentage ? `${offerPercentage}% — ${offerTitle}` : offerTitle}
        </p>

        {/* Verified date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{
            fontSize:  '11px',
            color:     verifiedDaysAgo <= 3 ? '#047857' : '#6B7280',
            fontFamily: '"Inter", sans-serif',
          }}>
            {verifiedDaysAgo === 0 ? '✓ Verified today' : `✓ Verified ${verifiedDaysAgo}d ago`}
          </span>
        </div>

        {/* CTA button */}
        <Link
          href={`/deal/${id}`}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          '100%',
            height:         '44px',
            background:     brand.partnerStatus === 'direct_merchant'
              ? 'linear-gradient(135deg, #C59B27 0%, #B45309 100%)'
              : '#F9FAFB',
            border:         `1px solid ${brand.partnerStatus === 'direct_merchant' ? 'transparent' : '#E5E7EB'}`,
            borderRadius:   '10px',
            color:          brand.partnerStatus === 'direct_merchant' ? '#FFFFFF' : '#374151',
            fontSize:       '13px',
            fontWeight:     600,
            fontFamily:     '"Inter", sans-serif',
            textDecoration: 'none',
            transition:     'opacity 0.15s, transform 0.15s',
          }}
          aria-label={`${getCtaLabel(brand.partnerStatus)} for ${brand.name}`}
        >
          {getCtaLabel(brand.partnerStatus)}
        </Link>
      </div>
    </article>
  );
}
