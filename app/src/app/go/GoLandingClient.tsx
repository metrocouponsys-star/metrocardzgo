'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import {
  GO_CATALOG_DEALS,
  getActiveCustomer,
  getRemainingOffersCount,
  logoutCustomer,
  GoCustomerProfile,
} from '@/lib/goStore';
import { MemberAuthGateModal } from '@/components/deals/MemberAuthGateModal';

const categories = [
  { name: 'Water Parks', tag: 'Up to 40% Off', count: '18 offers', icon: 'pool' },
  { name: 'Restaurants', tag: 'Top Picks', count: '26 offers', icon: 'restaurant' },
  { name: 'Resorts', tag: 'Stay + Save', count: '15 offers', icon: 'hotel' },
  { name: 'Movies', tag: 'Buy 1 Get 1', count: '8 offers', icon: 'movie' },
  { name: 'Cafes', tag: 'Coffee Runs', count: '14 offers', icon: 'local_cafe' },
  { name: 'Gaming', tag: 'Weekend Deals', count: '12 offers', icon: 'sports_esports' },
];

const collections = [
  { title: 'Great food deals', subtitle: 'Popular city picks', icon: 'restaurant', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80' },
  { title: 'Water park escapes', subtitle: 'Quick weekend wins', icon: 'pool', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80' },
  { title: 'Stay and recharge', subtitle: 'Resorts and escapes', icon: 'hotel', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80' },
];

const perks = [
  { icon: 'verified_user', title: 'Member-Exclusive Deals', text: 'Offers are unlocked only after authenticating membership & identity.' },
  { icon: 'savings', title: 'Verified Savings & Ledgers', text: 'Transparent tracking of claimed offers, remaining quota, points, and money saved.' },
  { icon: 'bolt', title: 'Instant Mobile Redemption', text: 'Show your digital voucher code or QR pass directly at partner venues.' },
];

export function GoLandingClient() {
  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState<GoCustomerProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const cust = getActiveCustomer();
    if (cust) {
      setCustomer(cust);
    }
  }, []);

  const handleSignOut = () => {
    logoutCustomer();
    setCustomer(null);
  };

  const handleAuthSuccess = (authenticatedCustomer: GoCustomerProfile) => {
    setCustomer(authenticatedCustomer);
    setAuthModalOpen(false);
  };

  const filteredDeals = useMemo(() => {
    if (!query.trim()) return GO_CATALOG_DEALS.slice(0, 4);
    const value = query.toLowerCase();
    return GO_CATALOG_DEALS.filter(
      (deal) =>
        deal.brand.toLowerCase().includes(value) ||
        deal.offer.toLowerCase().includes(value) ||
        deal.area.toLowerCase().includes(value)
    );
  }, [query]);

  const claimedCount = customer?.claimedOffers.length || 0;
  const remainingCount = getRemainingOffersCount(customer);

  return (
    <div
      style={{
        background: '#FAFAFA',
        minHeight: '100dvh',
        color: '#111827',
        fontFamily: '"Inter", system-ui, sans-serif',
        overflowX: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          paddingBottom: 90,
          position: 'relative',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(241,245,249,0.8)',
            boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: 56,
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 16,
                boxShadow: '0 4px 12px rgba(234,88,12,0.28)',
                flexShrink: 0,
                letterSpacing: '-0.03em',
              }}
            >
              M
            </div>

            {/* Brand name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.025em', color: '#0F172A', lineHeight: 1.2 }}>
                Metro Cardz GO
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: '#94A3B8',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Exclusive Member Offers
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Link href="/go/discover" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    border: '1.5px solid #FDBA74',
                    background: '#FFF7ED',
                    color: '#C2410C',
                    padding: '6px 11px',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Explore
                </button>
              </Link>

              {customer ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    style={{
                      background: '#F0FDF4',
                      border: '1.5px solid #BBF7D0',
                      color: '#15803D',
                      padding: '5px 9px',
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      maxWidth: 90,
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 13, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
                    >
                      check_circle
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customer.name}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    style={{
                      border: '1px solid #E2E8F0',
                      background: '#fff',
                      color: '#64748B',
                      padding: '5px 8px',
                      borderRadius: 20,
                      fontWeight: 600,
                      fontSize: 11,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  style={{
                    border: 'none',
                    background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                    color: '#fff',
                    padding: '7px 13px',
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(194, 65, 12, 0.30)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>
                    lock
                  </span>
                  Sign in
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <main style={{ padding: '16px 16px 0', boxSizing: 'border-box', width: '100%' }}>

          {/* Hero Card */}
          <section style={{ marginBottom: 16 }}>
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 22,
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                background: '#fff',
              }}
            >
              <div
                style={{
                  height: 190,
                  backgroundImage:
                    'linear-gradient(180deg, rgba(15,23,42,0.10), rgba(15,23,42,0.65)), url(https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.04) 0%, rgba(15,23,42,0.58) 100%)',
                  }}
                />
                <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
                  <div
                    style={{
                      fontSize: 9,
                      color: '#FED7AA',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                    }}
                  >
                    {customer ? `Verified Member · ${customer.tier}` : 'Membership Pass Required'}
                  </div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: '#fff',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {customer
                      ? `Welcome, ${customer.name}.\nYour member benefits are live.`
                      : 'Authenticate membership\nto unlock offers & savings.'}
                  </h1>
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  padding: '10px 10px',
                  background: '#fff',
                }}
              >
                {[
                  {
                    value: customer ? customer.points.toLocaleString() : '—',
                    label: 'Points',
                    color: customer ? '#EA580C' : '#94A3B8',
                    locked: !customer,
                  },
                  {
                    value: customer ? `${claimedCount}/${GO_CATALOG_DEALS.length}` : `${GO_CATALOG_DEALS.length} Offers`,
                    label: customer ? 'Claimed' : 'Active',
                    color: customer ? '#2563EB' : '#0F172A',
                    locked: false,
                  },
                  {
                    value: customer ? `₹${customer.totalSavedMoney.toLocaleString()}` : '—',
                    label: 'Saved',
                    color: customer ? '#059669' : '#94A3B8',
                    locked: !customer,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#F8FAFC',
                      borderRadius: 12,
                      padding: '10px 6px',
                      border: '1px solid #F1F5F9',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {stat.locked && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(248,250,252,0.85)',
                          backdropFilter: 'blur(3px)',
                          borderRadius: 12,
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 16, color: '#CBD5E1', fontVariationSettings: "'FILL' 1" }}
                        >
                          lock
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 800, color: stat.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Auth Banner (unauthenticated) */}
          {!customer && (
            <section
              style={{
                marginBottom: 16,
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                border: '1.5px solid #FDBA74',
                borderRadius: 16,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#9A3412', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 15, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
                  >
                    shield_lock
                  </span>
                  Offers &amp; Discounts Protected
                </div>
                <div style={{ fontSize: 11, color: '#7C2D12', marginTop: 3, lineHeight: 1.4 }}>
                  Verify your membership card to view and claim exclusive deals.
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 14px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 3px 10px rgba(194,65,12,0.28)',
                  flexShrink: 0,
                }}
              >
                Verify now
              </button>
            </section>
          )}

          {/* Search */}
          <section style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                border: '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '10px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: '#94A3B8', flexShrink: 0 }}>
                search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search brands or experiences"
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: '#111827',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                  minWidth: 0,
                }}
              />
            </div>
          </section>

          {/* Categories */}
          <section style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#475569',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Top categories
              </div>
              <Link
                href="/go/discover"
                style={{ color: '#EA580C', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}
              >
                View all
              </Link>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 9,
                overflowX: 'auto',
                paddingBottom: 6,
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                paddingLeft: 0,
                paddingRight: 2,
              } as React.CSSProperties}
            >
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href="/go/discover"
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                >
                  <div
                    style={{
                      border: '1.5px solid #F1F5F9',
                      background: '#fff',
                      borderRadius: 16,
                      width: 108,
                      padding: '12px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18, color: '#EA580C', fontVariationSettings: "'FILL' 1" }}
                      >
                        {category.icon}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{category.name}</div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{category.tag}</div>
                    <div style={{ fontSize: 10, color: '#EA580C', marginTop: 5, fontWeight: 700 }}>
                      {category.count}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Member Wallet */}
          <section style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#475569',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                My Member Wallet
              </div>
              {customer ? (
                <span style={{ color: '#059669', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  {customer.memberCode}
                </span>
              ) : (
                <span
                  style={{ color: '#EA580C', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                  onClick={() => setAuthModalOpen(true)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>
                    lock
                  </span>
                  Auth to Access
                </span>
              )}
            </div>

            <div
              style={{
                background: customer
                  ? 'linear-gradient(135deg, #fff 0%, #FFF4EE 100%)'
                  : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                border: customer ? '1.5px solid #FED7AA' : '1.5px solid #E2E8F0',
                borderRadius: 18,
                padding: '16px',
                boxShadow: customer ? '0 6px 20px rgba(234,88,12,0.08)' : 'none',
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              {customer ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 14,
                      gap: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: '#94A3B8',
                          fontSize: 9,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        Metro Cardz GO
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 3, color: '#0F172A', letterSpacing: '-0.02em' }}>
                        {customer.name}
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                        border: '1px solid #FED7AA',
                        borderRadius: 999,
                        padding: '5px 10px',
                        color: '#C2410C',
                        fontSize: 10,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {customer.tier}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
                    <div>
                      <div style={{ color: '#94A3B8', fontSize: 10, fontWeight: 500 }}>Available points</div>
                      <div
                        style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.05em', color: '#0F172A', lineHeight: 1 }}
                      >
                        {customer.points.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#94A3B8', fontSize: 10, fontWeight: 500 }}>Total Saved</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#059669', letterSpacing: '-0.03em' }}>
                        ₹{customer.totalSavedMoney.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 24, color: '#94A3B8', fontVariationSettings: "'FILL' 1" }}
                    >
                      lock
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    Membership Wallet Locked
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '6px 0 14px', lineHeight: 1.5 }}>
                    Authenticate your membership to access your wallet, points balance, and savings history.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(194, 65, 12, 0.28)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>
                      fingerprint
                    </span>
                    Authenticate Membership
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Curated collections */}
          <section style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                color: '#475569',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Curated collections
            </div>
            <div style={{ display: 'grid', gap: 9, width: '100%', boxSizing: 'border-box' }}>
              {collections.map((collection) => (
                <Link
                  key={collection.title}
                  href="/go/discover"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: 16,
                      overflow: 'hidden',
                      minHeight: 100,
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      width: '100%',
                    }}
                  >
                    <img
                      src={collection.image}
                      alt={collection.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        inset: 0,
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, rgba(15,23,42,0.68) 0%, rgba(15,23,42,0.14) 100%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        padding: '14px 16px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        minHeight: 100,
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)', marginBottom: 5, fontVariationSettings: "'FILL' 1" }}
                      >
                        {collection.icon}
                      </span>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{collection.title}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2 }}>
                        {collection.subtitle}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Featured Deals */}
          <section style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#475569',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                {customer ? 'Featured Member Offers' : 'Featured Deals'}
              </div>
              <Link
                href="/go/discover"
                style={{ color: '#EA580C', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}
              >
                View all ({GO_CATALOG_DEALS.length})
              </Link>
            </div>

            <div style={{ display: 'grid', gap: 10, width: '100%', boxSizing: 'border-box' }}>
              {filteredDeals.map((deal) => {
                const isClaimed = customer?.claimedOffers.some((c) => c.dealId === deal.id);

                return (
                  <article
                    key={deal.id}
                    style={{
                      background: '#fff',
                      border: '1.5px solid #F1F5F9',
                      borderRadius: 18,
                      overflow: 'hidden',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
                      <img
                        src={deal.image}
                        alt={deal.brand}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          filter: !customer ? 'blur(2px) brightness(0.88)' : 'none',
                        }}
                      />
                      {/* Blur overlay lock badge when not authenticated */}
                      {!customer && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              background: 'rgba(15,23,42,0.55)',
                              backdropFilter: 'blur(2px)',
                              borderRadius: 12,
                              padding: '8px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}
                            >
                              lock
                            </span>
                            Members Only
                          </div>
                        </div>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: 'rgba(255,255,255,0.94)',
                          backdropFilter: 'blur(6px)',
                          borderRadius: 999,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#C2410C',
                          border: '1px solid rgba(253,186,116,0.5)',
                        }}
                      >
                        {deal.badge}
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px 12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3, fontWeight: 500 }}>{deal.area} · {deal.category}</div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: 16,
                              lineHeight: 1.25,
                              letterSpacing: '-0.03em',
                              fontWeight: 800,
                              color: '#0F172A',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {deal.brand}
                          </h3>
                        </div>
                        <div
                          style={{
                            background: '#FFF7ED',
                            color: '#C2410C',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '4px 8px',
                            border: '1px solid #FED7AA',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {deal.meta}
                        </div>
                      </div>

                      <p style={{ margin: '8px 0', color: '#334155', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                        {deal.offer}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: 10,
                          borderTop: '1px solid #F1F5F9',
                          gap: 8,
                        }}
                      >
                        <span style={{ color: '#059669', fontSize: 12, fontWeight: 700 }}>
                          {customer ? `Saves ₹${deal.savingsAmount} · +${deal.pointsReward} pts` : 'Sign in to view savings'}
                        </span>

                        {!customer ? (
                          <button
                            onClick={() => setAuthModalOpen(true)}
                            style={{
                              border: 'none',
                              background: 'linear-gradient(135deg, #FF8A3D, #C2410C)',
                              color: '#fff',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontWeight: 700,
                              fontSize: 11,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            Unlock
                          </button>
                        ) : isClaimed ? (
                          <span
                            style={{
                              color: '#059669',
                              fontWeight: 700,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>
                              check_circle
                            </span>
                            Claimed
                          </span>
                        ) : (
                          <Link
                            href="/go/discover"
                            style={{
                              textDecoration: 'none',
                              color: '#EA580C',
                              fontWeight: 700,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            Claim
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              chevron_right
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Perks */}
          <section style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 11,
                color: '#475569',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Why members choose Metro Cardz GO
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {perks.map((perk) => (
                <div
                  key={perk.title}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #F1F5F9',
                    borderRadius: 14,
                    padding: '14px 16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 17, color: '#EA580C', fontVariationSettings: "'FILL' 1" }}
                    >
                      {perk.icon}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>
                      {perk.title}
                    </div>
                    <div style={{ color: '#64748B', fontSize: 12, lineHeight: 1.55 }}>{perk.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* ── Premium Bottom Nav ─────────────────────────────────────────── */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 520,
            background: 'rgba(255,255,255,0.97)',
            borderTop: '1px solid rgba(226,232,240,0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 40,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              height: 58,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              paddingLeft: 8,
              paddingRight: 8,
            }}
          >
            {[
              { label: 'Home', href: '/go', icon: 'home', active: true },
              { label: 'Explore', href: '/go/discover', icon: 'explore', active: false },
              { label: 'My Pass', href: '/go/login', icon: 'credit_card', active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  gap: 3,
                  position: 'relative',
                }}
              >
                {item.active && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                      border: '1px solid #FED7AA',
                    }}
                  />
                )}
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 21,
                    color: item.active ? '#EA580C' : '#94A3B8',
                    fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0",
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: item.active ? 700 : 500,
                    color: item.active ? '#EA580C' : '#94A3B8',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Member Auth Modal */}
        <MemberAuthGateModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
}
