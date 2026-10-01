'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { BottomNav } from '@/components/deals/BottomNav';
import { getCtaLabel, getDisclosureText, type PartnerStatus } from '@/lib/partnerStatus';

interface DealDetailProps {
  deal: {
    id: number;
    offerTitle: string;
    offerPercentage: number | null;
    offerType: string;
    startDate: string;
    endDate: string;
    bookingUrl: string | null;
    affiliateUrl: string | null;
    terms: string | null;
    lastVerifiedDate: string;
    featured: boolean;
    heroImageUrl: string | null;
    brand: {
      id: number;
      name: string;
      logoUrl: string | null;
      website: string | null;
      instagram: string | null;
      phone: string | null;
      mapsUrl: string | null;
      partnerStatus: PartnerStatus;
      description: string | null;
      category: string;
      city: string;
    };
  };
}

export function DealDetailClient({ deal }: DealDetailProps) {
  const [termsOpen, setTermsOpen] = useState(false);
  const { brand } = deal;

  const verifiedAgo = Math.floor((Date.now() - new Date(deal.lastVerifiedDate).getTime()) / (1000 * 60 * 60 * 24));
  const disclosureText = getDisclosureText(brand.partnerStatus);

  return (
    <div style={{ background: '#0D0F12', minHeight: '100dvh', color: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* Top nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(13,15,18,0.95)', borderBottom: '1px solid #2A303C', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/go" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#14171F', border: '1px solid #2A303C', color: '#9CA3AF', textDecoration: 'none', fontSize: '18px' }} aria-label="Back">←</Link>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Experience Detail</div>
              <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#6B7280' }}>METRO CARDZ CONCIERGE</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href={`/category/${deal.brand.category.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '11px', color: '#9CA3AF', textDecoration: 'none', letterSpacing: '0.05em' }}>
              ← {deal.brand.category.toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>

        {/* Hero image */}
        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#14171F' }}>
          {deal.heroImageUrl ? (
            <Image
              src={deal.heroImageUrl}
              alt={`${brand.name} — ${deal.offerTitle}`}
              fill
              sizes="(max-width: 600px) 100vw, 600px"
              className="object-cover"
              priority
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1C212B 0%, #0D0F12 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '48px' }}>🏛️</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,15,18,0.1) 0%, rgba(13,15,18,0.85) 100%)' }} aria-hidden="true" />

          {/* Rating overlay */}
          <div style={{ position: 'absolute', bottom: '12px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#E5C158', fontSize: '14px' }}>★</span>
            <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600 }}>4.9</span>
            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>(640+ Privileged Diners)</span>
          </div>
        </div>

        <div style={{ padding: '16px' }}>

          {/* Offer banner */}
          <div
            style={{
              background:   'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
              borderRadius: '12px',
              padding:      '14px 16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#6B4C00', marginBottom: '4px' }}>
              METRO CARDZ EXCLUSIVE
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0D0F12', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {deal.offerPercentage && <span style={{ fontSize: '18px' }}>%</span>}
              {deal.offerTitle.toUpperCase()}
            </div>
          </div>

          {/* Partner badge + tier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <PartnerBadge status={brand.partnerStatus} />
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>• Tier 1 Gold Privilege</span>
          </div>

          {/* Brand name + description */}
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
            {brand.name}
          </h1>
          {brand.description && (
            <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '12px', lineHeight: '20px' }}>
              {brand.description} • {brand.city}
            </p>
          )}

          {/* Verified timestamp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ color: '#34D399', fontSize: '12px' }}>🛡️</span>
            <span style={{ fontSize: '12px', color: '#34D399', fontWeight: 500 }}>
              Verified {verifiedAgo === 0 ? 'today' : `${verifiedAgo}h ago`} by Metro Cardz Ops • Real-time redemption live
            </span>
          </div>

          {/* Disclosure notice — compliance required */}
          <div
            style={{
              background:   '#14171F',
              border:       '1px solid #2A303C',
              borderRadius: '12px',
              padding:      '14px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: '#D4AF37', fontSize: '16px', flexShrink: 0 }}>ℹ️</span>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                  Transparent Booking Notice
                </div>
                <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '20px' }}>
                  {disclosureText}
                </p>
              </div>
            </div>
          </div>

          {/* Merchant touchpoints */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF' }}>MERCHANT TOUCHPOINTS</span>
              <span style={{ fontSize: '11px', color: '#D4AF37' }}>Instant Concierge</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { icon: '📞', label: 'Call Desk', sub: brand.phone ?? '+91 22 6825', href: brand.phone ? `tel:${brand.phone}` : undefined },
                { icon: '📍', label: 'Map View', sub: brand.city, href: brand.mapsUrl ?? undefined },
                { icon: '📸', label: 'Instagram', sub: brand.instagram ? `@${brand.instagram}` : '@brand', href: brand.instagram ? `https://instagram.com/${brand.instagram}` : undefined },
                { icon: '🍽️', label: 'Full Menu', sub: 'PDF (Curated)', href: brand.website ?? undefined },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href ?? '#'}
                  target={item.href && !item.href.startsWith('tel') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  style={{
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    gap:            '4px',
                    background:     '#14171F',
                    border:         '1px solid #2A303C',
                    borderRadius:   '10px',
                    padding:        '10px 4px',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#FFFFFF', textAlign: 'center' }}>{item.label}</span>
                  <span style={{ fontSize: '9px', color: '#6B7280', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.sub}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Offer terms accordion */}
          <div style={{ marginBottom: '24px' }}>
            <button
              onClick={() => setTermsOpen(!termsOpen)}
              style={{
                width:          '100%',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                background:     '#14171F',
                border:         '1px solid #2A303C',
                borderRadius:   termsOpen ? '12px 12px 0 0' : '12px',
                padding:        '14px 16px',
                color:          '#FFFFFF',
                cursor:         'pointer',
              }}
              aria-expanded={termsOpen}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 600 }}>
                <span>✅</span> Offer Terms &amp; Privileges
              </div>
              <span style={{ color: '#D4AF37', fontSize: '18px', transition: 'transform 0.2s', transform: termsOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>
            {termsOpen && deal.terms && (
              <div
                style={{
                  background:   '#14171F',
                  border:       '1px solid #2A303C',
                  borderTop:    'none',
                  borderRadius: '0 0 12px 12px',
                  padding:      '16px',
                }}
              >
                <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: '22px', whiteSpace: 'pre-line' }}>
                  {deal.terms}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Book Now CTA — bottom bar */}
      <div
        style={{
          position:     'fixed',
          bottom:       '64px', // above bottom nav
          left:         0,
          right:        0,
          zIndex:       49,
          background:   'rgba(13,15,18,0.95)',
          borderTop:    '1px solid #2A303C',
          backdropFilter: 'blur(12px)',
          padding:      '12px 16px',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <a
            href={`/api/redirect/${deal.id}`}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              width:          '100%',
              height:         '56px',
              background:     brand.partnerStatus === 'direct_merchant'
                ? 'linear-gradient(135deg, #E5C158 0%, #D4AF37 100%)'
                : '#1C212B',
              border:         `1px solid ${brand.partnerStatus === 'direct_merchant' ? 'transparent' : '#3F3722'}`,
              borderRadius:   '9999px',
              padding:        '0 20px',
              color:          brand.partnerStatus === 'direct_merchant' ? '#0D0F12' : '#F8FAFC',
              fontSize:       '15px',
              fontWeight:     700,
              fontFamily:     '"Plus Jakarta Sans", sans-serif',
              textDecoration: 'none',
              boxShadow:      brand.partnerStatus === 'direct_merchant' ? '0 4px 16px rgba(212,175,55,0.35)' : 'none',
            }}
          >
            <div>
              <div>{getCtaLabel(brand.partnerStatus)}</div>
              {brand.website && (
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '1px' }}>
                  Redirects to official merchant site
                </div>
              )}
            </div>
            <span style={{ fontSize: '20px' }}>↗</span>
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
