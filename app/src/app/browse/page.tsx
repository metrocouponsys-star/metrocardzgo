'use client';
/**
 * /browse — Public Offers Browse Page
 * Customer-facing, no login required.
 * Shows all active offer templates grouped by type, with search.
 * Mobile-first, dark glassmorphism card grid.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Merchant {
  id: string;
  businessName: string;
  logoUrl?: string;
  category?: string;
}

interface Offer {
  id: string;
  title: string;
  description?: string;
  offerType?: string;
  value?: number;
  minPurchaseAmount?: number;
  loyaltyPointsEarn?: number;
  merchant: Merchant;
}

// Map offer types to readable labels and icons
const OFFER_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  'percentage_discount': { label: '% Off',       icon: '🏷️',  color: '#f97316' },
  'flat_discount':       { label: '₹ Off',        icon: '💸',  color: '#22c55e' },
  'free_item':           { label: 'Free Item',    icon: '🎁',  color: '#a855f7' },
  'bogo':                { label: 'Buy 1 Get 1',  icon: '2️⃣',  color: '#3b82f6' },
  'points_multiplier':   { label: 'Bonus Points', icon: '⭐',  color: '#eab308' },
  'cashback':            { label: 'Cashback',     icon: '💰',  color: '#06b6d4' },
  'referral':            { label: 'Referral',     icon: '👥',  color: '#ec4899' },
  'birthday':            { label: 'Birthday',     icon: '🎂',  color: '#f43f5e' },
  'anniversary':         { label: 'Anniversary',  icon: '💍',  color: '#8b5cf6' },
  'visit_reward':        { label: 'Visit Reward', icon: '🏆',  color: '#10b981' },
  'Other':               { label: 'Special',      icon: '✨',  color: '#6366f1' },
};

function getTypeMeta(offerType?: string) {
  return OFFER_TYPE_META[offerType ?? 'Other'] ?? OFFER_TYPE_META['Other'];
}

function valueBadge(offerType?: string, value?: number): string {
  if (!value) return '';
  if (offerType === 'percentage_discount') return `${value}% OFF`;
  if (offerType === 'flat_discount')       return `₹${value} OFF`;
  if (offerType === 'bogo')                return 'BUY 1 GET 1';
  if (offerType === 'free_item')           return 'FREE ITEM';
  if (offerType === 'cashback')            return `₹${value} BACK`;
  if (offerType === 'points_multiplier')   return `${value}× POINTS`;
  return '';
}

export default function BrowsePage() {
  const [offers, setOffers]           = useState<Offer[]>([]);
  const [categories, setCategories]   = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [activeType, setActiveType]   = useState<string>('All');
  const [debouncedSearch, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (activeType !== 'All') params.set('offerType', activeType);
      if (debouncedSearch)      params.set('search', debouncedSearch);
      const res  = await fetch(`/api/v1/offers/public?${params}`);
      const data = await res.json();
      setOffers(data.offers ?? []);
      if (data.categories?.length) setCategories(data.categories);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [activeType, debouncedSearch]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0f0f1a',
      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
      color: '#fff',
    }}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,15,26,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Link href="/" style={{ textDecoration: 'none', fontSize: '24px' }}>🎟️</Link>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                Exclusive Deals & Offers
              </h1>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                Metro Cardz member benefits
              </p>
            </div>
            <Link href="/join" id="browse-join-btn" style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'linear-gradient(135deg,#6366f1,#a855f7)',
              color: '#fff', fontSize: '13px', fontWeight: 700,
              textDecoration: 'none', whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}>
              Join Free →
            </Link>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
            <input
              id="browse-search"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search offers, restaurants, brands…"
              style={{
                width: '100%', height: '44px', paddingLeft: '42px', paddingRight: '14px',
                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.07)', color: '#fff',
                fontSize: '14px', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category pills */}
          <div style={{ overflowX: 'auto', display: 'flex', gap: '8px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {['All', ...categories].map(type => {
              const meta = type === 'All' ? { label: 'All', icon: '🎁', color: '#6366f1' } : getTypeMeta(type);
              const active = activeType === type;
              return (
                <button
                  key={type}
                  id={`cat-${type.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                  onClick={() => setActiveType(type)}
                  style={{
                    flexShrink: 0, padding: '7px 14px', borderRadius: '20px', border: 'none',
                    background: active ? `linear-gradient(135deg,${meta.color}cc,${meta.color}88)` : 'rgba(255,255,255,0.08)',
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: active ? `0 4px 12px ${meta.color}55` : 'none',
                  }}
                >
                  {meta.icon} {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 16px 100px' }}>
        {loading ? (
          <LoadingSkeleton />
        ) : offers.length === 0 ? (
          <EmptyState search={search} type={activeType} />
        ) : (
          <>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '16px' }}>
              {offers.length} offer{offers.length !== 1 ? 's' : ''} found
              {activeType !== 'All' ? ` in ${getTypeMeta(activeType).label}` : ''}
              {search ? ` for "${search}"` : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
              {offers.map(offer => <OfferCard key={offer.id} offer={offer} />)}
            </div>
          </>
        )}
      </main>

      {/* ── Sticky CTA ───────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center',
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>🎟️ Unlock all exclusive offers</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Join Metro Cardz — free!</p>
        </div>
        <Link href="/join" style={{
          flexShrink: 0, padding: '10px 20px', borderRadius: '12px',
          background: 'linear-gradient(135deg,#6366f1,#a855f7)',
          color: '#fff', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
        }}>
          Join Now
        </Link>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { outline: none; border-color: #6366f1 !important; }
        ::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%,100%{opacity:.4;} 50%{opacity:.8;} }
      `}</style>
    </div>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const meta  = getTypeMeta(offer.offerType);
  const badge = valueBadge(offer.offerType, offer.value);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '18px', overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Hero area */}
      <div style={{
        height: '120px',
        background: `linear-gradient(135deg, ${meta.color}33, ${meta.color}11)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{ fontSize: '48px' }}>{meta.icon}</span>
        {badge && (
          <div style={{
            position: 'absolute', top: '10px', left: '10px',
            background: meta.color, color: '#fff',
            fontSize: '11px', fontWeight: 800, padding: '4px 10px',
            borderRadius: '8px', letterSpacing: '0.5px',
            boxShadow: `0 2px 8px ${meta.color}66`,
          }}>
            {badge}
          </div>
        )}
        {offer.loyaltyPointsEarn && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)',
            color: '#fbbf24', fontSize: '11px', fontWeight: 700,
            padding: '3px 8px', borderRadius: '8px',
          }}>
            +{offer.loyaltyPointsEarn} pts
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px' }}>
        {/* Merchant row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: `${meta.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {offer.merchant.logoUrl
              ? <img src={offer.merchant.logoUrl} alt={offer.merchant.businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              : <span style={{ fontSize: '13px' }}>🏪</span>}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: meta.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {offer.merchant.businessName}
            </p>
            {offer.merchant.category && (
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>🏪 {offer.merchant.category}</p>
            )}
          </div>
          <span style={{
            fontSize: '10px', fontWeight: 600, color: meta.color,
            background: `${meta.color}22`, padding: '2px 8px', borderRadius: '6px',
            border: `1px solid ${meta.color}44`, whiteSpace: 'nowrap',
          }}>
            {meta.label}
          </span>
        </div>

        <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, lineHeight: 1.3 }}>{offer.title}</h3>
        {offer.description && (
          <p style={{
            margin: '0 0 10px', fontSize: '13px', color: 'rgba(255,255,255,0.5)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {offer.description}
          </p>
        )}
        {offer.minPurchaseAmount && (
          <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
            Min. purchase: ₹{offer.minPurchaseAmount}
          </p>
        )}

        <Link href="/join" style={{
          display: 'block', padding: '10px', borderRadius: '10px', textAlign: 'center',
          background: `${meta.color}22`, border: `1px solid ${meta.color}44`,
          color: meta.color, fontSize: '13px', fontWeight: 700, textDecoration: 'none',
          transition: 'background 0.2s',
        }}>
          🔓 Join to Unlock This Deal
        </Link>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ height: '120px', background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
          <div style={{ padding: '14px' }}>
            {[60, 100, 80].map((w, j) => (
              <div key={j} style={{ height: j === 1 ? '16px' : '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.07)', marginBottom: '8px', animation: 'pulse 1.5s infinite', width: `${w}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ search, type }: { search: string; type: string }) {
  const meta = type === 'All' ? { label: 'any category', icon: '🎁' } : getTypeMeta(type);
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>{meta.icon}</div>
      <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>No offers found</h3>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
        {search ? `No results for "${search}" in ${meta.label}.` : `No active offers in ${meta.label} right now.`}
      </p>
    </div>
  );
}
