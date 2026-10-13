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
        background: '#FFFFFF',
        minHeight: '100vh',
        color: '#111827',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: '0 auto',
          paddingBottom: 80,
          position: 'relative',
        }}
      >
        {/* Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderBottom: '1px solid #F1F5F9',
          }}
        >
          <div
            style={{
              padding: '12px 16px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 17,
                boxShadow: '0 8px 18px rgba(234,88,12,0.18)',
                flexShrink: 0,
              }}
            >
              M
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: '#111827' }}>
                Metro Cardz GO
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#9CA3AF',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                Exclusive Member Offers
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Link href="/go/discover" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    border: '1px solid #FDE8CC',
                    background: '#FFF7ED',
                    color: '#C2410C',
                    padding: '7px 12px',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Explore deals
                </button>
              </Link>
              {customer ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      background: '#FFF7ED',
                      border: '1px solid #FFEDD5',
                      color: '#EA580C',
                      padding: '5px 10px',
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>✓</span>
                    <span>{customer.name}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    style={{
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      color: '#6B7280',
                      padding: '5px 9px',
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 11,
                      cursor: 'pointer',
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
                    background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                    color: '#fff',
                    padding: '7px 13px',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🔒 Sign in
                </button>
              )}
            </div>
          </div>
        </header>

        <main style={{ padding: '18px 16px 0' }}>

          {/* Hero Card with Real or Gated Stats */}
          <section style={{ marginBottom: 20 }}>
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 24,
                border: '1px solid #F1F5F9',
                boxShadow: '0 12px 30px rgba(0,0,0,0.07)',
                background: '#fff',
              }}
            >
              <div
                style={{
                  height: 200,
                  backgroundImage:
                    'linear-gradient(180deg, rgba(17,24,39,0.15), rgba(17,24,39,0.6)), url(https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(17,24,39,0.06) 0%, rgba(17,24,39,0.55) 100%)',
                  }}
                />
                <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#FFDDBB',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {customer ? `Verified Member · ${customer.tier}` : 'Membership Pass Required'}
                  </div>
                  <h1
                    style={{
                      margin: '8px 0 0',
                      fontSize: 24,
                      fontWeight: 800,
                      lineHeight: 1.15,
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

              {/* Real / Gated Customer Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  padding: 12,
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    background: '#F9FAFB',
                    borderRadius: 12,
                    padding: '10px 8px',
                    border: '1px solid #F3F4F6',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, color: customer ? '#EA580C' : '#9CA3AF', letterSpacing: '-0.02em' }}>
                    {customer ? customer.points.toLocaleString() : '🔒 Locked'}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>Points</div>
                </div>

                <div
                  style={{
                    background: '#F9FAFB',
                    borderRadius: 12,
                    padding: '10px 8px',
                    border: '1px solid #F3F4F6',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, color: customer ? '#2563EB' : '#111827', letterSpacing: '-0.02em' }}>
                    {customer ? `${claimedCount} claimed (${remainingCount} left)` : `${GO_CATALOG_DEALS.length} Offers`}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>
                    {customer ? 'Claimed / Remaining' : 'Active Offers'}
                  </div>
                </div>

                <div
                  style={{
                    background: '#F9FAFB',
                    borderRadius: 12,
                    padding: '10px 8px',
                    border: '1px solid #F3F4F6',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 800, color: customer ? '#059669' : '#9CA3AF', letterSpacing: '-0.02em' }}>
                    {customer ? `₹${customer.totalSavedMoney.toLocaleString()}` : 'Auth to view'}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>Money Saved</div>
                </div>
              </div>
            </div>
          </section>

          {/* Authentication Banner (If unauthenticated) */}
          {!customer && (
            <section
              style={{
                marginBottom: 20,
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                border: '1.5px solid #FDBA74',
                borderRadius: 18,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#9A3412' }}>
                  🔒 Offers & Discounts Protected
                </div>
                <div style={{ fontSize: 12, color: '#7C2D12', marginTop: 2 }}>
                  Verify your membership card or mobile to view full deals and claim passes.
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 14px',
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 3px 10px rgba(234,88,12,0.25)',
                }}
              >
                Authenticate →
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
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                padding: '10px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#9CA3AF' }}>
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
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#6B7280',
                  letterSpacing: '0.1em',
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
                gap: 10,
                overflowX: 'auto',
                paddingBottom: 8,
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              } as React.CSSProperties}
            >
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href="/go/discover"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      borderRadius: 16,
                      minWidth: 120,
                      padding: '12px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#FFF7ED',
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{category.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>{category.tag}</div>
                    <div style={{ fontSize: 10, color: '#EA580C', marginTop: 6, fontWeight: 700 }}>
                      {category.count}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Wallet Card (Dynamic & Customer Isolated) */}
          <section style={{ marginBottom: 22 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#6B7280',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                My Member Wallet
              </div>
              {customer ? (
                <span style={{ color: '#059669', fontSize: 12, fontWeight: 700 }}>
                  Active Pass · {customer.memberCode}
                </span>
              ) : (
                <span style={{ color: '#EA580C', fontSize: 12, fontWeight: 700 }}>
                  🔒 Auth to Access
                </span>
              )}
            </div>

            <div
              style={{
                background: customer
                  ? 'linear-gradient(135deg, #fff 0%, #FFF4EE 100%)'
                  : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                border: customer ? '1.5px solid #FDE8CC' : '1px solid #E2E8F0',
                borderRadius: 20,
                padding: '18px',
                boxShadow: customer ? '0 8px 22px rgba(234,88,12,0.07)' : 'none',
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
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: '#9CA3AF',
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                      >
                        Metro Cardz GO
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3, color: '#111827' }}>
                        {customer.name}
                      </div>
                    </div>
                    <div
                      style={{
                        background: '#FFF7ED',
                        border: '1px solid #FDE8CC',
                        borderRadius: 999,
                        padding: '6px 10px',
                        color: '#EA580C',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {customer.tier}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ color: '#9CA3AF', fontSize: 11 }}>Available points</div>
                      <div
                        style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#111827' }}
                      >
                        {customer.points.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#9CA3AF', fontSize: 11 }}>Total Saved Money</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>
                        ₹{customer.totalSavedMoney.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                    Membership Wallet Locked
                  </div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 14px' }}>
                    Authenticate your membership to access your wallet, points balance, and saved money history.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '9px 18px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(234, 88, 12, 0.25)',
                    }}
                  >
                    Authenticate Membership
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Curated collections */}
          <section style={{ marginBottom: 22 }}>
            <div
              style={{
                fontSize: 11,
                color: '#6B7280',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Curated collections
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {collections.map((collection) => (
                <Link
                  key={collection.title}
                  href="/go/discover"
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: 18,
                      overflow: 'hidden',
                      minHeight: 110,
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
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
                        background: 'linear-gradient(90deg, rgba(17,24,39,0.62) 0%, rgba(17,24,39,0.15) 100%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        padding: '16px 18px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 22, color: 'rgba(255,255,255,0.8)', marginBottom: 6, fontVariationSettings: "'FILL' 1" }}
                      >
                        {collection.icon}
                      </span>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{collection.title}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                        {collection.subtitle}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Trending Deals (Gated / Unlocked) */}
          <section style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#6B7280',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                {customer ? 'Featured Member Offers' : 'Featured Deals (Auth to Unlock)'}
              </div>
              <Link
                href="/go/discover"
                style={{ color: '#EA580C', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}
              >
                View all ({GO_CATALOG_DEALS.length})
              </Link>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {filteredDeals.map((deal) => {
                const isClaimed = customer?.claimedOffers.some((c) => c.dealId === deal.id);

                return (
                  <article
                    key={deal.id}
                    style={{
                      background: '#fff',
                      border: '1px solid #E5E7EB',
                      borderRadius: 18,
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ position: 'relative', height: 160 }}>
                      <img
                        src={deal.image}
                        alt={deal.brand}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          filter: !customer ? 'blur(1px) brightness(0.92)' : 'none',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: 'rgba(255,255,255,0.92)',
                          borderRadius: 999,
                          padding: '5px 10px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#EA580C',
                        }}
                      >
                        {deal.badge}
                      </div>
                    </div>

                    <div style={{ padding: '14px 14px 12px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                          alignItems: 'flex-start',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>{deal.area} · {deal.category}</div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: 18,
                              lineHeight: 1.2,
                              letterSpacing: '-0.03em',
                              fontWeight: 800,
                              color: '#111827',
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
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '5px 8px',
                            border: '1px solid #FDE8CC',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {deal.meta}
                        </div>
                      </div>

                      <p style={{ margin: '10px 0', color: '#374151', fontWeight: 700, fontSize: 15 }}>
                        {deal.offer}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: 10,
                          borderTop: '1px solid #F3F4F6',
                        }}
                      >
                        <span style={{ color: '#059669', fontSize: 12, fontWeight: 700 }}>
                          {customer ? `Saves ₹${deal.savingsAmount} · +${deal.pointsReward} pts` : '🔒 Members Only'}
                        </span>

                        {!customer ? (
                          <button
                            onClick={() => setAuthModalOpen(true)}
                            style={{
                              border: 'none',
                              background: '#EA580C',
                              color: '#fff',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontWeight: 800,
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Unlock Deal
                          </button>
                        ) : isClaimed ? (
                          <span style={{ color: '#059669', fontWeight: 800, fontSize: 12 }}>
                            ✓ Pass Claimed
                          </span>
                        ) : (
                          <Link
                            href="/go/discover"
                            style={{
                              textDecoration: 'none',
                              color: '#EA580C',
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            Claim Deal →
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
                color: '#6B7280',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Why members choose Metro Cardz GO
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {perks.map((perk) => (
                <div
                  key={perk.title}
                  style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 16,
                    padding: '14px 16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: '#FFF7ED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: '#EA580C', fontVariationSettings: "'FILL' 1" }}
                    >
                      {perk.icon}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                      {perk.title}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.55 }}>{perk.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Bottom Nav */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: 520,
            background: 'rgba(255,255,255,0.97)',
            borderTop: '1px solid #E5E7EB',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            zIndex: 20,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              height: 60,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
                  color: item.active ? '#EA580C' : '#9CA3AF',
                  gap: 3,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 22,
                    fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700 }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Member Authentication Modal */}
        <MemberAuthGateModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
}
