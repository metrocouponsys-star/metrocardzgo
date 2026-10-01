'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { CountdownTimer } from '@/components/deals/CountdownTimer';
import { BottomNav } from '@/components/deals/BottomNav';
import { getCtaLabel, type PartnerStatus } from '@/lib/partnerStatus';

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
    endDate: new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString(), // 14h from now
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
    <div style={{ background: '#0D0F12', minHeight: '100dvh', color: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* Top nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(13,15,18,0.95)', borderBottom: '1px solid #2A303C', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: '#D4AF37' }}>Metro Cardz</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#6B7280', fontWeight: 600 }}>TOP DEALS</div>
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>
            <span style={{ color: '#D4AF37' }}>✦</span> Updated Today, {updatedAt}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 16px 96px' }}>

        {/* Hand-picked header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px' }}>✦</span>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF' }}>HAND-PICKED BY EDITORS</span>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '30px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
            Today&apos;s Curated Picks
          </h1>
          <p style={{ fontSize: '13px', color: '#6B7280' }}>
            Strictly vetted member exclusives refreshed daily at dawn.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #2A303C', paddingBottom: '0' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding:     '8px 14px',
                background:  'transparent',
                border:      'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#D4AF37' : 'transparent'}`,
                color:       activeTab === tab.id ? '#FFFFFF' : '#6B7280',
                fontSize:    '13px',
                fontWeight:  activeTab === tab.id ? 600 : 400,
                cursor:      'pointer',
                transition:  'all 0.2s',
                marginBottom: '-1px',
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
                    <h2 id={`section-${sectionIdx}`} style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
                      {category}
                    </h2>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6B7280' }}>
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

                  return (
                    <div
                      key={deal.id as number}
                      style={{
                        background:   '#14171F',
                        border:       '1px solid #3F3722',
                        borderRadius: '16px',
                        overflow:     'hidden',
                        boxShadow:    '0 0 20px -2px rgba(212,175,55,0.1)',
                      }}
                    >
                      {/* Deal image placeholder */}
                      <div style={{ position: 'relative', height: '160px', background: 'linear-gradient(135deg, #1C212B 0%, #0D0F12 100%)' }}>
                        {/* Status badges */}
                        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                          {isExpiringSoon && (
                            <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', letterSpacing: '0.05em' }}>
                              ENDS IN <CountdownTimer endDate={endDate} />
                            </span>
                          )}
                          <PartnerBadge status={partnerStatus} />
                        </div>
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#D4AF37', background: 'rgba(13,15,18,0.8)', padding: '3px 8px', borderRadius: '9999px' }}>
                            SPOTLIGHT HERO
                          </span>
                        </div>
                      </div>

                      {/* Deal body */}
                      <div style={{ padding: '14px 16px 16px' }}>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', letterSpacing: '0.05em', marginBottom: '6px' }}>
                          {String(brand.city).toUpperCase()}, MAHARASHTRA
                        </div>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px', lineHeight: '26px' }}>
                          {brand.name as string}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#E5C158', fontWeight: 600, marginBottom: '12px' }}>
                          {deal.offerTitle as string}
                        </p>

                        {/* Value row */}
                        {memberValue && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '0.06em', marginBottom: '2px' }}>MEMBER VALUE</div>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                                {memberValue} <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 400, textDecoration: 'line-through' }}>{memberValueOriginal}</span>
                              </div>
                            </div>
                            {savings && (
                              <div>
                                <div style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '0.06em', marginBottom: '2px' }}>EST. SAVINGS</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399' }}>{savings}</div>
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
                            height:         '52px',
                            background:     partnerStatus === 'direct_merchant'
                              ? 'linear-gradient(135deg, #E5C158 0%, #D4AF37 100%)'
                              : '#1C212B',
                            border:         `1px solid ${partnerStatus === 'direct_merchant' ? 'transparent' : '#3F3722'}`,
                            borderRadius:   '9999px',
                            color:          partnerStatus === 'direct_merchant' ? '#0D0F12' : '#F8FAFC',
                            fontSize:       '14px',
                            fontWeight:     700,
                            textDecoration: 'none',
                          }}
                        >
                          ⚡ Single-Tap Instant Pass
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
            background:   '#14171F',
            border:       '1px solid #2A303C',
            borderRadius: '14px',
            padding:      '16px',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🔔</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>Never miss a 24h drop</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Daily concierge alerts at 10…</div>
            </div>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            style={{
              width:        '48px',
              height:       '26px',
              borderRadius: '9999px',
              background:   notificationsEnabled ? '#D4AF37' : '#2A303C',
              border:       'none',
              cursor:       'pointer',
              position:     'relative',
              transition:   'background 0.2s',
            }}
            aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            <span
              style={{
                position:   'absolute',
                top:        '3px',
                left:       notificationsEnabled ? '25px' : '3px',
                width:      '20px',
                height:     '20px',
                borderRadius: '50%',
                background: '#FFFFFF',
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
