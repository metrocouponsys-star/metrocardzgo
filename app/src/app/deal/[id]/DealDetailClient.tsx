'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { BottomNav } from '@/components/deals/BottomNav';
import { getCtaLabel, getDisclosureText, type PartnerStatus } from '@/lib/partnerStatus';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#F8F9FA',
  card:        '#FFFFFF',
  border:      '#E5E7EB',
  borderAmber: '#FDE68A',
  text:        '#111827',
  textMuted:   '#4B5563',
  textLight:   '#6B7280',
  amberDark:   '#B45309',
  amberLight:  '#FEF3C7',
  green:       '#047857',
  greenBg:     '#ECFDF5',
  greenBorder: '#A7F3D0',
  shadow:      '0 1px 4px rgba(0,0,0,0.06)',
  shadowMd:    '0 4px 16px rgba(0,0,0,0.08)',
};

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
  const isDirect = brand.partnerStatus === 'direct_merchant';

  return (
    <div style={{ background: C.bg, minHeight: '100dvh', color: C.text, fontFamily: '"Inter", sans-serif' }}>

      {/* Top nav */}
      <header style={{
        position:     'sticky',
        top:          0,
        zIndex:       40,
        background:   'rgba(255,255,255,0.97)',
        borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow:    C.shadow,
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/go" style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              width:          '36px',
              height:         '36px',
              borderRadius:   '10px',
              background:     '#F9FAFB',
              border:         `1px solid ${C.border}`,
              color:          C.textMuted,
              textDecoration: 'none',
              fontSize:       '18px',
            }} aria-label="Back">←</Link>
            <div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '15px', fontWeight: 700, color: C.text }}>Experience Detail</div>
              <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: C.amberDark, fontWeight: 700 }}>METRO CARDZ</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href={`/category/${deal.brand.category.toLowerCase().replace(/\s+/g, '-')}`} style={{
              fontSize:      '11px',
              color:         C.textLight,
              textDecoration: 'none',
              letterSpacing: '0.05em',
              fontWeight:    600,
            }}>
              ← {deal.brand.category.toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '130px' }}>

        {/* Hero image */}
        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#F3F4F6' }}>
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
            <div style={{
              position:   'absolute',
              inset:      0,
              background: isDirect
                ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '48px' }}>🏛️</span>
            </div>
          )}
          {/* Gradient overlay for bottom text readability */}
          <div style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35) 100%)',
          }} aria-hidden="true" />

          {/* Rating overlay */}
          <div style={{ position: 'absolute', bottom: '12px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.9)', borderRadius: '9999px', padding: '3px 10px', border: `1px solid ${C.border}` }}>
            <span style={{ color: '#C59B27', fontSize: '13px' }}>★</span>
            <span style={{ color: C.text, fontSize: '13px', fontWeight: 700 }}>4.9</span>
            <span style={{ color: C.textLight, fontSize: '11px' }}>(640+ Diners)</span>
          </div>
        </div>

        <div style={{ padding: '16px' }}>

          {/* Offer banner */}
          <div
            style={{
              background:   isDirect
                ? 'linear-gradient(135deg, #C59B27 0%, #B45309 100%)'
                : C.amberLight,
              borderRadius: '12px',
              padding:      '14px 16px',
              marginBottom: '16px',
              border:       isDirect ? 'none' : `1px solid ${C.borderAmber}`,
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: isDirect ? 'rgba(255,255,255,0.7)' : C.amberDark, marginBottom: '4px' }}>
              METRO CARDZ EXCLUSIVE
            </div>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '20px', fontWeight: 700, color: isDirect ? '#FFFFFF' : C.text, lineHeight: '28px' }}>
              {deal.offerPercentage && <span style={{ fontSize: '16px' }}>%</span>}
              {deal.offerTitle.toUpperCase()}
            </div>
          </div>

          {/* Partner badge + tier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <PartnerBadge status={brand.partnerStatus} />
            <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 500 }}>• Tier 1 Gold Privilege</span>
          </div>

          {/* Brand name + description */}
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>
            {brand.name}
          </h1>
          {brand.description && (
            <p style={{ fontSize: '14px', color: C.textMuted, marginBottom: '12px', lineHeight: '22px' }}>
              {brand.description} • {brand.city}
            </p>
          )}

          {/* Verified timestamp */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            marginBottom: '16px',
            background:   C.greenBg,
            border:       `1px solid ${C.greenBorder}`,
            borderRadius: '10px',
            padding:      '10px 12px',
          }}>
            <span style={{ color: C.green, fontSize: '14px', flexShrink: 0 }}>🛡️</span>
            <span style={{ fontSize: '12px', color: C.green, fontWeight: 600 }}>
              Verified {verifiedAgo === 0 ? 'today' : `${verifiedAgo}d ago`} by Metro Cardz Ops • Real-time redemption live
            </span>
          </div>

          {/* Disclosure notice — compliance required */}
          <div
            style={{
              background:   C.amberLight,
              border:       `1px solid ${C.borderAmber}`,
              borderRadius: '12px',
              padding:      '14px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ color: C.amberDark, fontSize: '16px', flexShrink: 0 }}>ℹ️</span>
              <div>
                <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>
                  Transparent Booking Notice
                </div>
                <p style={{ fontSize: '13px', color: C.textMuted, lineHeight: '20px' }}>
                  {disclosureText}
                </p>
              </div>
            </div>
          </div>

          {/* Merchant touchpoints */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: C.textLight }}>MERCHANT TOUCHPOINTS</span>
              <span style={{ fontSize: '11px', color: C.amberDark, fontWeight: 600 }}>Instant Concierge</span>
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
                    background:     '#FFFFFF',
                    border:         `1px solid ${C.border}`,
                    borderRadius:   '10px',
                    padding:        '10px 4px',
                    textDecoration: 'none',
                    boxShadow:      C.shadow,
                    transition:     'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, textAlign: 'center' }}>{item.label}</span>
                  <span style={{ fontSize: '9px', color: C.textLight, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{item.sub}</span>
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
                background:     '#FFFFFF',
                border:         `1px solid ${C.border}`,
                borderRadius:   termsOpen ? '12px 12px 0 0' : '12px',
                padding:        '14px 16px',
                color:          C.text,
                cursor:         'pointer',
                boxShadow:      C.shadow,
                fontFamily:     '"Inter", sans-serif',
              }}
              aria-expanded={termsOpen}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Syne", sans-serif', fontSize: '15px', fontWeight: 700 }}>
                <span>✅</span> Offer Terms & Privileges
              </div>
              <span style={{ color: C.amberDark, fontSize: '18px', transition: 'transform 0.2s', transform: termsOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>
            {termsOpen && deal.terms && (
              <div
                style={{
                  background:   '#FFFFFF',
                  border:       `1px solid ${C.border}`,
                  borderTop:    'none',
                  borderRadius: '0 0 12px 12px',
                  padding:      '16px',
                }}
              >
                <p style={{ fontSize: '14px', color: C.textMuted, lineHeight: '22px', whiteSpace: 'pre-line' }}>
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
          position:      'fixed',
          bottom:        '64px', // above bottom nav
          left:          0,
          right:         0,
          zIndex:        49,
          background:    'rgba(255,255,255,0.97)',
          borderTop:     `1px solid ${C.border}`,
          backdropFilter: 'blur(12px)',
          padding:       '12px 16px',
          boxShadow:     '0 -4px 20px rgba(0,0,0,0.06)',
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
              background:     isDirect
                ? 'linear-gradient(135deg, #C59B27 0%, #B45309 100%)'
                : '#F9FAFB',
              border:         `1px solid ${isDirect ? 'transparent' : C.border}`,
              borderRadius:   '12px',
              padding:        '0 20px',
              color:          isDirect ? '#FFFFFF' : C.textMuted,
              fontSize:       '15px',
              fontWeight:     700,
              fontFamily:     '"Inter", sans-serif',
              textDecoration: 'none',
              boxShadow:      isDirect ? '0 4px 16px rgba(181,67,9,0.25)' : C.shadow,
            }}
          >
            <div>
              <div>{getCtaLabel(brand.partnerStatus)}</div>
              {brand.website && (
                <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '1px' }}>
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
