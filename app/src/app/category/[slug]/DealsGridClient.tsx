'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DealCard, type DealCardProps } from '@/components/deals/DealCard';
import { CityFilter } from '@/components/deals/CityFilter';
import { BottomNav } from '@/components/deals/BottomNav';
import { type PartnerStatus } from '@/lib/partnerStatus';

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
    // Default: featured + partner tier (already sorted by API, just keep)
    return 0;
  });

  const activeCount = deals.filter((d) => !d.featured).length + deals.filter((d) => d.featured).length;

  return (
    <div style={{ background: '#0D0F12', minHeight: '100dvh', color: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* Top nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(13,15,18,0.95)', borderBottom: '1px solid #2A303C', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/go" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#14171F', border: '1px solid #2A303C', color: '#9CA3AF', textDecoration: 'none', fontSize: '18px' }} aria-label="Back">←</Link>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: '#D4AF37' }}>Metro Cardz</div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 16px 96px' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: '11px', color: '#6B7280', marginBottom: '12px', letterSpacing: '0.05em' }} aria-label="Breadcrumb">
          <Link href="/go" style={{ color: '#6B7280', textDecoration: 'none' }}>CURATED ACCESS</Link>
          {' › '}
          <span style={{ color: '#9CA3AF' }}>{categoryName.toUpperCase()}</span>
        </nav>

        {/* Heading */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px', lineHeight: '36px' }}>
            {categoryName}
          </h1>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            Exclusive cardholder privileges, verified merchant partnerships, and public culinary privileges across Mumbai metropolitan region.
          </p>
        </div>

        {/* Active deal count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: '#34D399', fontWeight: 600 }}>●</span>
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{activeCount} Offers Active</span>
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
                display:     'flex',
                alignItems:  'center',
                gap:         '6px',
                height:      '32px',
                padding:     '0 12px',
                borderRadius: '9999px',
                fontSize:    '11px',
                fontWeight:  600,
                letterSpacing: '0.03em',
                background:  sort === s ? '#1C212B' : 'transparent',
                border:      `1px solid ${sort === s ? '#D4AF37' : '#2A303C'}`,
                color:       sort === s ? '#FFF3D6' : '#9CA3AF',
                cursor:      'pointer',
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
                style={{ height: '280px', background: '#14171F', borderRadius: '16px', border: '1px solid #2A303C', animation: 'auricPulse 1.5s ease-in-out infinite' }}
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎫</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px' }}>No deals found</div>
            <div style={{ fontSize: '14px' }}>Try selecting a different city or check back soon.</div>
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
            background:   '#14171F',
            border:       '1px solid #2A303C',
            borderRadius: '16px',
            textAlign:    'center',
          }}
        >
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>🛡️</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
            Guaranteed Deal Transparency
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: '18px', marginBottom: '12px' }}>
            Metro Cardz categorises every dining partner into verified direct contracts, vetted networks, or external public discoveries to protect your privileges.
          </div>
          <button style={{ fontSize: '12px', color: '#D4AF37', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Suggest a Dining Spot
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
