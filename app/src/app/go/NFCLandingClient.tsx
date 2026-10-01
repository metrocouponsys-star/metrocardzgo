'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CategoryTile } from '@/components/deals/CategoryTile';
import { BottomNav } from '@/components/deals/BottomNav';
import { CountdownTimer } from '@/components/deals/CountdownTimer';

// Fallback categories when API is empty (e.g. DB not yet seeded)
const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Water Parks',          slug: 'waterparks',    icon: '🌊', bestOffer: '40% OFF',   brands: "Wet'nJoy, Imagicaa" },
  { id: 2, name: 'Gaming & Ent.',        slug: 'gaming',        icon: '🎮', bestOffer: '25% OFF',   brands: 'Smaaash, Timezone' },
  { id: 3, name: 'Movies',               slug: 'movies',        icon: '🎬', bestOffer: '1+1 DEAL',  brands: 'PVR INOX, Cinepolis' },
  { id: 4, name: 'Fine Dining',          slug: 'dining',        icon: '🍽️', bestOffer: 'UP TO 30%', brands: 'Bastian, Tresind, Social' },
  { id: 5, name: 'Cafés & Bakeries',     slug: 'cafes',         icon: '☕', bestOffer: '20% OFF',   brands: 'Blue Tokai, Subko' },
  { id: 6, name: 'Events & Nightlife',   slug: 'events',        icon: '🎵', bestOffer: 'VIP PASS',  brands: 'Sunburn, Live Comedy' },
  { id: 7, name: 'Resorts & Stays',      slug: 'resorts',       icon: '🏨', bestOffer: 'MEMBERS',   brands: 'Taj, The Machan' },
  { id: 8, name: 'Hill Stations',        slug: 'hill-stations', icon: '⛰️', bestOffer: 'GETAWAY',   brands: 'Lonavala, Matheran' },
];

interface Props {
  categories: Array<{ id: number; name: string; slug: string; icon: string | null }>;
  featuredDeal: {
    id: number;
    offerTitle: string;
    brand: { name: string };
    heroImageUrl: string | null;
    endDate: string;
  } | null;
}

export function NFCLandingClient({ categories, featuredDeal }: Props) {
  const [selectedCity, setSelectedCity] = useState('Mumbai');

  // Merge API categories with fallback display data
  const displayCategories = FALLBACK_CATEGORIES.map((fallback) => {
    const api = categories.find((c) => c.slug === fallback.slug);
    return { ...fallback, ...(api && { name: api.name, icon: api.icon ?? fallback.icon }) };
  });

  return (
    <div
      style={{ background: '#0D0F12', minHeight: '100dvh', color: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      {/* ── Top nav bar ──────────────────────────────────────────────────────── */}
      <header
        style={{
          position:   'sticky',
          top:        0,
          zIndex:     40,
          background: 'rgba(13,15,18,0.95)',
          borderBottom: '1px solid #2A303C',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>Metro Cardz</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#6B7280', fontWeight: 600 }}>EXPLORE</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* City selector */}
            <button
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         '6px',
                background:  '#1C212B',
                border:      '1px solid #2A303C',
                borderRadius: '9999px',
                padding:     '6px 12px',
                color:       '#F8FAFC',
                fontSize:    '13px',
                fontWeight:  500,
                cursor:      'pointer',
              }}
              onClick={() => {/* city picker — future enhancement */}}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1C4.34 1 3 2.34 3 4c0 2.5 3 7 3 7s3-4.5 3-7c0-1.66-1.34-3-3-3z" stroke="#D4AF37" strokeWidth="1.2" />
                <circle cx="6" cy="4" r="1" fill="#D4AF37" />
              </svg>
              {selectedCity}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 4.5l3 3 3-3" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Avatar placeholder */}
            <div
              style={{
                width:       '32px',
                height:      '32px',
                borderRadius: '50%',
                background:  'linear-gradient(135deg, #D4AF37, #1C212B)',
                border:      '2px solid #D4AF37',
                display:     'flex',
                alignItems:  'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <span style={{ fontSize: '14px' }}>👤</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 16px 96px' }}>

        {/* NFC Card Linked status bar */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', animation: 'auricPulse 2s ease-in-out infinite' }}>📶</span>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#D4AF37' }}>
              INSTANT CARD LINKED
            </span>
          </div>
          <div
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         '6px',
              background:  '#1C212B',
              border:      '1px solid #2A303C',
              borderRadius: '9999px',
              padding:     '4px 10px',
              fontSize:    '12px',
              color:       '#9CA3AF',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
            {selectedCity}
          </div>
        </div>

        {/* Hero headline */}
        <h1
          style={{
            fontFamily:   'Syne, sans-serif',
            fontSize:     '32px',
            fontWeight:   700,
            lineHeight:   '40px',
            letterSpacing: '-0.015em',
            color:        '#FFFFFF',
            marginBottom: '8px',
          }}
        >
          Tap to Unlock{' '}
          <span style={{ color: '#D4AF37' }}>{selectedCity} &amp; Beyond</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '20px', lineHeight: '20px' }}>
          Physical NFC card detected. Tap any privilege to redeem immediately.
        </p>

        {/* Search bar */}
        <div
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '10px',
            background:  '#14171F',
            border:      '1px solid #2A303C',
            borderRadius: '12px',
            padding:     '0 16px',
            height:      '52px',
            marginBottom: '24px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="5.5" stroke="#6B7280" strokeWidth="1.5" />
            <path d="M13 13l2.5 2.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search 450+ exclusive offers..."
            style={{
              flex:        1,
              background:  'transparent',
              border:      'none',
              outline:     'none',
              color:       '#F8FAFC',
              fontSize:    '15px',
              fontFamily:  '"Plus Jakarta Sans", sans-serif',
            }}
            aria-label="Search deals"
          />
        </div>

        {/* Category grid — 2 columns */}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}
        >
          {displayCategories.map((cat, i) => (
            <CategoryTile
              key={cat.id}
              name={cat.name}
              slug={cat.slug}
              icon={cat.icon}
              bestOffer={cat.bestOffer}
              brands={cat.brands}
            />
          ))}
        </div>

        {/* Featured "Flash Privilege" banner */}
        {featuredDeal ? (
          <div
            style={{
              background:   '#14171F',
              border:       '1px solid #3F3722',
              borderRadius: '16px',
              padding:      '14px',
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
              marginBottom: '24px',
              boxShadow:    '0 0 20px -2px rgba(212,175,55,0.15)',
            }}
          >
            {featuredDeal.heroImageUrl && (
              <div
                style={{
                  width:          '52px',
                  height:         '52px',
                  borderRadius:   '10px',
                  overflow:       'hidden',
                  flexShrink:     0,
                  background:     '#1C212B',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featuredDeal.heroImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: '#D4AF37', marginBottom: '2px' }}>
                FLASH PRIVILEGE
              </div>
              <div
                style={{
                  fontSize:   '14px',
                  fontWeight: 600,
                  color:      '#FFFFFF',
                  overflow:   'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {featuredDeal.offerTitle}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <CountdownTimer endDate={featuredDeal.endDate} />
              <Link
                href={`/deal/${featuredDeal.id}`}
                style={{
                  background:   'linear-gradient(135deg, #E5C158, #D4AF37)',
                  color:        '#0D0F12',
                  fontWeight:   700,
                  fontSize:     '13px',
                  padding:      '8px 14px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  whiteSpace:   'nowrap',
                }}
              >
                Claim →
              </Link>
            </div>
          </div>
        ) : (
          /* Flash Privilege placeholder when no featured deal */
          <div
            style={{
              background:   '#14171F',
              border:       '1px solid #2A303C',
              borderRadius: '16px',
              padding:      '14px',
              marginBottom: '24px',
              textAlign:    'center',
              color:        '#6B7280',
              fontSize:     '13px',
            }}
          >
            Flash privileges update daily at 10:00 AM
          </div>
        )}

        {/* NFC verified footer strip */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
            background:   '#14171F',
            border:       '1px solid #2A303C',
            borderRadius: '12px',
            padding:      '12px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🛡️</span>
            <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>Gold Member NFC Verified</span>
          </div>
          <span style={{ fontSize: '11px', color: '#6B7280', fontFamily: '"Space Mono", monospace' }}>
            CARD #MC-8821
          </span>
        </div>
      </main>

      {/* ── Bottom navigation ─────────────────────────────────────────────────── */}
      <BottomNav />
    </div>
  );
}
