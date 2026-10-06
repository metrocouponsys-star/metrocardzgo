'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DealCard, type DealCardProps } from '@/components/deals/DealCard';
import { CityFilter } from '@/components/deals/CityFilter';
import { BottomNav } from '@/components/deals/BottomNav';
import { type PartnerStatus } from '@/lib/partnerStatus';

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
  shadow:      '0 1px 4px rgba(0,0,0,0.06)',
};

interface Props {
  categorySlug:  string;
  categoryName:  string;
  initialDeals:  Array<Record<string, unknown>>;
  cities:        Array<{ id: number; name: string; slug: string }>;
}

type SortMode = 'partner' | 'verified';

export function DealsGridClient({ categorySlug, categoryName, initialDeals, cities }: Props) {
  const [deals, setDeals] = useState<DealCardProps[]>(mapDeals(initialDeals));
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>('partner');
  const [loading, setLoading] = useState(false);

  // Re-fetch when city filter changes
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const url = `/api/deals?category=${categorySlug}${selectedCity ? `&city=${selectedCity}` : ''}`;
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setDeals(mapDeals(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => controller.abort();
  }, [categorySlug, selectedCity]);

  // Client-side sort
  const sorted = [...deals].sort((a, b) => {
    if (sort === 'verified') {
      return new Date(b.lastVerifiedDate).getTime() - new Date(a.lastVerifiedDate).getTime();
    }
    return 0;
  });

  const activeCount = deals.filter((d) => !d.featured).length + deals.filter((d) => d.featured).length;

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
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            flexShrink:     0,
          }} aria-label="Back">←</Link>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px', fontWeight: 700, color: C.text }}>Metro Cardz</div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 16px 96px' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: '11px', color: C.textLight, marginBottom: '12px', letterSpacing: '0.05em', fontWeight: 500 }} aria-label="Breadcrumb">
          <Link href="/go" style={{ color: C.textLight, textDecoration: 'none' }}>CURATED ACCESS</Link>
          {' › '}
          <span style={{ color: C.amberDark, fontWeight: 700 }}>{categoryName.toUpperCase()}</span>
        </nav>

        {/* Heading */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', fontWeight: 700, color: C.text, marginBottom: '4px', lineHeight: '36px' }}>
            {categoryName}
          </h1>
          <p style={{ fontSize: '13px', color: C.textMuted }}>
            Exclusive cardholder privileges and verified merchant partnerships across Mumbai metropolitan region.
          </p>
        </div>

        {/* Active deal count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{
            background:    '#ECFDF5',
            border:        '1px solid #A7F3D0',
            color:         C.green,
            fontSize:      '11px',
            fontWeight:    700,
            padding:       '2px 10px',
            borderRadius:  '9999px',
            letterSpacing: '0.04em',
          }}>
            ● {activeCount} Offers Active
          </span>
        </div>

        {/* City filter */}
        <CityFilter cities={cities} selected={selectedCity} onChange={setSelectedCity} />

        {/* Sort pills */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginBottom: '20px' }}>
          {(['partner', 'verified'] as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                height:       '32px',
                padding:      '0 12px',
                borderRadius: '9999px',
                fontSize:     '11px',
                fontWeight:   600,
                letterSpacing: '0.03em',
                background:   sort === s ? C.amberLight : '#FFFFFF',
                border:       `1px solid ${sort === s ? C.borderAmber : C.border}`,
                color:        sort === s ? C.amberDark : C.textLight,
                cursor:       'pointer',
                fontFamily:   '"Inter", sans-serif',
              }}
            >
              {s === 'partner' ? '% HIGHEST DISCOUNT' : '✓ VERIFIED FIRST'}
            </button>
          ))}
        </div>

        {/* Deals grid */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height:       '280px',
                  background:   '#FFFFFF',
                  borderRadius: '16px',
                  border:       `1px solid ${C.border}`,
                  animation:    'pulse 1.5s ease-in-out infinite',
                  opacity:      0.6,
                }}
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: C.textMuted }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎫</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>No deals found</div>
            <div style={{ fontSize: '14px', color: C.textMuted }}>Try selecting a different city or check back soon.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sorted.map((deal) => (
              <DealCard key={deal.id} {...deal} />
            ))}
          </div>
        )}

        {/* Transparency footer */}
        <div
          style={{
            marginTop:    '32px',
            padding:      '20px',
            background:   '#FFFFFF',
            border:       `1px solid ${C.border}`,
            borderRadius: '16px',
            textAlign:    'center',
            boxShadow:    C.shadow,
          }}
        >
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>🛡️</div>
          <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '6px' }}>
            Guaranteed Deal Transparency
          </div>
          <div style={{ fontSize: '12px', color: C.textMuted, lineHeight: '18px', marginBottom: '12px' }}>
            Metro Cardz categorises every partner into verified direct contracts, vetted networks, or public discoveries to protect your privileges.
          </div>
          <button style={{ fontSize: '12px', color: C.amberDark, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: '"Inter", sans-serif', fontWeight: 600 }}>
            Suggest a Spot
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

// Map raw API response to DealCard props
function mapDeals(raw: Array<Record<string, unknown>>): DealCardProps[] {
  return raw.map((d) => {
    const brand = d.brand as Record<string, unknown>;
    return {
      id:              d.id as number,
      offerTitle:      d.offerTitle as string,
      offerPercentage: d.offerPercentage as number | null,
      offerType:       d.offerType as string,
      endDate:         d.endDate as string,
      lastVerifiedDate: d.lastVerifiedDate as string,
      featured:        d.featured as boolean,
      heroImageUrl:    d.heroImageUrl as string | null,
      brand: {
        name:          brand.name as string,
        logoUrl:       brand.logoUrl as string | null,
        partnerStatus: brand.partnerStatus as PartnerStatus,
        city:          brand.city as string,
        category:      brand.category as string,
      },
    };
  });
}
