'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { CountdownTimer } from '@/components/deals/CountdownTimer';
import { BottomNav } from '@/components/deals/BottomNav';
import { getCtaLabel, type PartnerStatus } from '@/lib/partnerStatus';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#F8F9FA',
  card:        '#FFFFFF',
  border:      '#E5E7EB',
  borderAmber: '#FDE68A',
  text:        '#111827',
  textMuted:   '#4B5563',
  textLight:   '#6B7280',
  amber:       '#C59B27',
  amberDark:   '#B45309',
  amberLight:  '#FEF3C7',
  green:       '#047857',
  shadow:      '0 1px 4px rgba(0,0,0,0.06)',
  shadowMd:    '0 4px 16px rgba(0,0,0,0.08)',
};

type TabId = 'all' | 'trending' | 'weekend';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all',      label: 'All Picks' },
  { id: 'trending', label: 'Trending Today' },
  { id: 'weekend',  label: 'Weekend Specials' },
];

interface Props {
  deals: Array<Record<string, unknown>>;
}

// Group deals by category for the live offers curated feed
function groupByCategory(deals: Array<Record<string, unknown>>) {
  const groups = new Map<string, Array<Record<string, unknown>>>();
  for (const deal of deals) {
    const brand = deal.brand as Record<string, unknown>;
    const cat = brand.category as string;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(deal);
  }
  return groups;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Water Parks':        '🌊',
  'Gaming & Entertainment': '🎮',
  'Fine Dining':        '🍽️',
  'Resorts & Stays':    '🏨',
  'Movies':             '🎬',
  "Cafés & Bakeries":   '☕',
  'Events & Nightlife': '🎵',
  'Hill Stations':      '⛰️',
};

// Demo deals for when DB is empty
const DEMO_DEALS = [
  {
    id: 1,
    offerTitle: "EXCLUSIVE -40% Off Wave Pool & Thrill Passes + Free Locker",
    offerPercentage: 40,
    offerType: 'percentage',
    endDate: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(),
    lastVerifiedDate: new Date().toISOString(),
    featured: true,
    heroImageUrl: null,
    brand: { name: "Wet'nJoy Water Park", partnerStatus: 'direct_merchant', city: 'Lonavala', citySlug: 'lonavala', category: 'Water Parks', categorySlug: 'waterparks' },
    memberValue: '₹899',
    memberValueOriginal: '₹1,499',
    savings: 'Save ₹600/pass',
  },
  {
    id: 2,
    offerTitle: 'Flat 50% Off Unlimited Bowling, Laser Tag & VR Experience Simulator',
    offerPercentage: 50,
    offerType: 'percentage',
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastVerifiedDate: new Date().toISOString(),
    featured: true,
    heroImageUrl: null,
    brand: { name: 'Smaaash VIP Arcade Pass', partnerStatus: 'direct_merchant', city: 'Mumbai', citySlug: 'mumbai', category: 'Gaming & Entertainment', categorySlug: 'gaming' },
    memberValue: '₹750',
    memberValueOriginal: '₹1,500',
    savings: '50% SAVINGS',
  },
];

export function LiveOffersClient({ deals }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const displayDeals = deals.length > 0 ? deals : DEMO_DEALS;
  const grouped = groupByCategory(displayDeals);
  const updatedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

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
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px', fontWeight: 700, color: C.text }}>Metro Cardz</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.amberDark, fontWeight: 700 }}>TOP DEALS</div>
          </div>
          <div style={{ fontSize: '11px', color: C.textLight }}>
            <span style={{ color: C.amber }}>✦</span> Updated Today, {updatedAt}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 16px 96px' }}>

        {/* Hand-picked header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              background:    C.amberLight,
              border:        `1px solid ${C.borderAmber}`,
              color:         C.amberDark,
              fontSize:      '10px',
              fontWeight:    700,
              padding:       '3px 10px',
              borderRadius:  '9999px',
              letterSpacing: '0.08em',
            }}>🔥 HAND-PICKED BY EDITORS</span>
          </div>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '28px', fontWeight: 700, color: C.text, marginBottom: '6px', lineHeight: '36px' }}>
            Today&apos;s Curated Picks
          </h1>
          <p style={{ fontSize: '13px', color: C.textMuted }}>
            Strictly vetted member exclusives refreshed daily at dawn.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: `1px solid ${C.border}`, paddingBottom: '0' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding:      '8px 14px',
                background:   'transparent',
                border:       'none',
                borderBottom: `2px solid ${activeTab === tab.id ? C.amberDark : 'transparent'}`,
                color:        activeTab === tab.id ? C.amberDark : C.textLight,
                fontSize:     '13px',
                fontWeight:   activeTab === tab.id ? 700 : 400,
                cursor:       'pointer',
                transition:   'all 0.2s',
                marginBottom: '-1px',
                fontFamily:   '"Inter", sans-serif',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Array.from(grouped.entries()).map(([category, categoryDeals], sectionIdx) => {
            const icon = CATEGORY_ICONS[category] ?? '🎯';
            return (
              <section key={category} aria-labelledby={`section-${sectionIdx}`}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                    <h2 id={`section-${sectionIdx}`} style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', fontWeight: 700, color: C.text }}>
                      {category}
                    </h2>
                  </div>
                  <span style={{ fontSize: '11px', color: C.textLight, fontWeight: 600 }}>
                    {String(sectionIdx + 1).padStart(2, '0')} / {String(grouped.size).padStart(2, '0')}
                  </span>
                </div>

                {/* Deal card(s) in this category */}
                {categoryDeals.slice(0, 1).map((deal) => {
                  const brand = deal.brand as Record<string, unknown>;
                  const partnerStatus = brand.partnerStatus as PartnerStatus;
                  const endDate = deal.endDate as string;
                  const memberValue = (deal as Record<string, unknown>).memberValue as string | undefined;
                  const memberValueOriginal = (deal as Record<string, unknown>).memberValueOriginal as string | undefined;
                  const savings = (deal as Record<string, unknown>).savings as string | undefined;

                  const isExpiringSoon = (new Date(endDate).getTime() - Date.now()) < 24 * 60 * 60 * 1000;
                  const isDirect = partnerStatus === 'direct_merchant';

                  return (
                    <div
                      key={deal.id as number}
                      style={{
                        background:   '#FFFFFF',
                        border:       `1px solid ${isDirect ? C.borderAmber : C.border}`,
                        borderRadius: '16px',
                        overflow:     'hidden',
                        boxShadow:    isDirect
                          ? '0 4px 20px rgba(197,155,39,0.12)'
                          : C.shadow,
                      }}
                    >
                      {/* Deal image placeholder */}
                      <div style={{
                        position:   'relative',
                        height:     '160px',
                        background: isDirect
                          ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                          : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
                      }}>
                        {/* Status badges */}
                        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {isExpiringSoon && (
                            <span style={{
                              background:    C.amberLight,
                              border:        `1px solid ${C.borderAmber}`,
                              color:         C.amberDark,
                              fontSize:      '10px',
                              fontWeight:    700,
                              padding:       '2px 8px',
                              borderRadius:  '9999px',
                              letterSpacing: '0.04em',
                            }}>
                              ENDS IN <CountdownTimer endDate={endDate} />
                            </span>
                          )}
                          <PartnerBadge status={partnerStatus} />
                        </div>
                        {isDirect && (
                          <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                            <span style={{
                              fontSize:      '10px',
                              fontWeight:    700,
                              letterSpacing: '0.06em',
                              color:         C.amberDark,
                              background:    C.amberLight,
                              padding:       '3px 10px',
                              borderRadius:  '9999px',
                              border:        `1px solid ${C.borderAmber}`,
                            }}>
                              SPOTLIGHT HERO
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Deal body */}
                      <div style={{ padding: '14px 16px 16px' }}>
                        <div style={{ fontSize: '11px', color: C.textLight, letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 500 }}>
                          {String(brand.city).toUpperCase()}, MAHARASHTRA
                        </div>
                        <h3 style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '6px', lineHeight: '26px' }}>
                          {brand.name as string}
                        </h3>
                        <p style={{ fontSize: '13px', color: C.amberDark, fontWeight: 600, marginBottom: '12px' }}>
                          {deal.offerTitle as string}
                        </p>

                        {/* Value row */}
                        {memberValue && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', background: C.bg, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${C.border}` }}>
                            <div>
                              <div style={{ fontSize: '10px', color: C.textLight, letterSpacing: '0.06em', marginBottom: '2px', fontWeight: 600 }}>MEMBER VALUE</div>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: C.text }}>
                                {memberValue} <span style={{ fontSize: '12px', color: C.textLight, fontWeight: 400, textDecoration: 'line-through' }}>{memberValueOriginal}</span>
                              </div>
                            </div>
                            {savings && (
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '10px', color: C.textLight, letterSpacing: '0.06em', marginBottom: '2px', fontWeight: 600 }}>EST. SAVINGS</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: C.green }}>{savings}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* CTA */}
                        <a
                          href={`/api/redirect/${deal.id as number}`}
                          style={{
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            gap:            '8px',
                            width:          '100%',
                            height:         '48px',
                            background:     isDirect
                              ? 'linear-gradient(135deg, #C59B27 0%, #B45309 100%)'
                              : '#F9FAFB',
                            border:         `1px solid ${isDirect ? 'transparent' : C.border}`,
                            borderRadius:   '10px',
                            color:          isDirect ? '#FFFFFF' : C.textMuted,
                            fontSize:       '14px',
                            fontWeight:     700,
                            textDecoration: 'none',
                            fontFamily:     '"Inter", sans-serif',
                          }}
                        >
                          ⚡ {isDirect ? 'Claim Exclusive Offer →' : 'View Deal'}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>

        {/* Notification toggle */}
        <div
          style={{
            marginTop:    '32px',
            background:   '#FFFFFF',
            border:       `1px solid ${C.border}`,
            borderRadius: '14px',
            padding:      '16px',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
            boxShadow:    C.shadow,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🔔</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>Never miss a 24h drop</div>
              <div style={{ fontSize: '12px', color: C.textLight }}>Daily concierge alerts at 10 AM…</div>
            </div>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            style={{
              width:        '48px',
              height:       '26px',
              borderRadius: '9999px',
              background:   notificationsEnabled ? C.amberDark : '#E5E7EB',
              border:       'none',
              cursor:       'pointer',
              position:     'relative',
              transition:   'background 0.2s',
            }}
            aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            <span
              style={{
                position:     'absolute',
                top:          '3px',
                left:         notificationsEnabled ? '25px' : '3px',
                width:        '20px',
                height:       '20px',
                borderRadius: '50%',
                background:   '#FFFFFF',
                transition:   'left 0.2s',
                boxShadow:    '0 1px 4px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
