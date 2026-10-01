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
 * Shows hero image, partner badge, rating, brand, offer, verified date, CTA.
 * Matches the filtered_deals_grid Stitch screen design.
 */
export function DealCard({ id, offerTitle, offerPercentage, endDate, lastVerifiedDate, featured, heroImageUrl, brand, distance, rating }: DealCardProps) {
  const verifiedDaysAgo = Math.floor(
    (Date.now() - new Date(lastVerifiedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const isExpiringSoon = (new Date(endDate).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000;

  return (
    <article
      style={{
        background:     featured ? '#1C212B' : '#14171F',
        border:         `1px solid ${featured ? '#3F3722' : '#2A303C'}`,
        borderRadius:   '16px',
        overflow:       'hidden',
        transition:     'box-shadow 0.2s, transform 0.2s',
      }}
      className="animate-card-reveal"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = featured
          ? '0 0 20px -2px rgba(212,175,55,0.25)'
          : '0 8px 32px -4px rgba(0,0,0,0.6)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Hero image */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0D0F12' }}>
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
              background: 'linear-gradient(135deg, #1C212B 0%, #0D0F12 100%)',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:      '#2A303C',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect x="4" y="8" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="14" cy="17" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 30l10-8 6 5 6-6 10 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div
          style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(to bottom, rgba(13,15,18,0.1) 0%, rgba(13,15,18,0.7) 100%)',
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
              position:      'absolute',
              bottom:        '10px',
              left:          '10px',
              display:       'flex',
              alignItems:    'center',
              gap:           '4px',
              background:    'rgba(13,15,18,0.7)',
              borderRadius:  '9999px',
              padding:       '2px 8px',
            }}
          >
            <span style={{ color: '#E5C158', fontSize: '12px' }}>★</span>
            <span style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 600 }}>{rating.toFixed(1)}</span>
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
          <span style={{ fontSize: '11px', color: '#6B7280', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {brand.city}{distance ? ` • ${distance}` : ''}
          </span>
        </div>

        {/* Brand name */}
        <h3
          style={{
            fontFamily:   'Syne, sans-serif',
            fontSize:     '17px',
            fontWeight:   600,
            color:        '#FFFFFF',
            lineHeight:   '24px',
            marginBottom: '6px',
          }}
        >
          {brand.name}
        </h3>

        {/* Offer title */}
        <p
          style={{
            fontFamily:   '"Plus Jakarta Sans", sans-serif',
            fontSize:     '14px',
            fontWeight:   600,
            color:        '#E5C158',
            lineHeight:   '20px',
            marginBottom: '10px',
          }}
        >
          {offerPercentage ? `${offerTitle}` : offerTitle}
        </p>

        {/* Verified date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: verifiedDaysAgo <= 3 ? '#34D399' : '#6B7280', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {verifiedDaysAgo === 0 ? '✓ Verified today' : `✓ Verified ${verifiedDaysAgo}d ago`}
          </span>
          {isExpiringSoon && (
            <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Expiring soon
            </span>
          )}
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
              ? 'linear-gradient(135deg, #E5C158 0%, #D4AF37 100%)'
              : '#1C212B',
            border:         `1px solid ${brand.partnerStatus === 'direct_merchant' ? 'transparent' : '#2A303C'}`,
            borderRadius:   '9999px',
            color:          brand.partnerStatus === 'direct_merchant' ? '#0D0F12' : '#F8FAFC',
            fontSize:       '13px',
            fontWeight:     600,
            fontFamily:     '"Plus Jakarta Sans", sans-serif',
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
