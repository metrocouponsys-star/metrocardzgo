'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const categories = [
  { name: 'Water Parks', tag: 'Up to 40% Off', count: '18 offers', icon: 'pool' },
  { name: 'Restaurants', tag: 'Top Picks', count: '26 offers', icon: 'restaurant' },
  { name: 'Resorts', tag: 'Stay + Save', count: '15 offers', icon: 'hotel' },
  { name: 'Movies', tag: 'Buy 1 Get 1', count: '8 offers', icon: 'movie' },
  { name: 'Cafes', tag: 'Coffee Runs', count: '14 offers', icon: 'local_cafe' },
  { name: 'Gaming', tag: 'Weekend Deals', count: '12 offers', icon: 'sports_esports' },
];

const deals = [
  {
    id: 'imagicaa',
    brand: 'Imagicaa',
    area: 'Khopoli',
    offer: '40% OFF on combo tickets',
    meta: 'Theme + Water Park',
    badge: 'Hot Deal',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'bastian',
    brand: 'Bastian',
    area: 'Mumbai',
    offer: 'Flat Rs. 500 off dining',
    meta: 'Premium dinner',
    badge: 'Flash Sale',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'machan',
    brand: 'The Machan',
    area: 'Lonavala',
    offer: 'Sunset stay packages',
    meta: 'Weekend getaway',
    badge: 'Weekend',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'foodie',
    brand: 'Bamboo House',
    area: 'Powai',
    offer: 'Free dessert with 2-course meal',
    meta: 'Chef special',
    badge: 'Member Favorite',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80',
  },
];

const collections = [
  { title: 'Great food deals', subtitle: 'Popular city picks', icon: 'restaurant', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80' },
  { title: 'Water park escapes', subtitle: 'Quick weekend wins', icon: 'pool', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80' },
  { title: 'Stay and recharge', subtitle: 'Resorts and escapes', icon: 'hotel', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80' },
];

const memberStats = [
  { value: '1,480', label: 'Points' },
  { value: '12', label: 'Active offers' },
  { value: 'Rs. 2,300', label: 'Saved' },
];

const perks = [
  { icon: 'auto_awesome', title: 'Curated discovery', text: 'Hand-picked offers built around lifestyle and weekend plans.' },
  { icon: 'verified_user', title: 'Trust-first', text: 'Transparent savings, verified experiences, and no hidden clutter.' },
  { icon: 'bolt', title: 'Instant redemption', text: 'Scan, unlock, and redeem in seconds with your member wallet.' },
];

export function GoLandingClient() {
  const [query, setQuery] = useState('');

  const filteredDeals = useMemo(() => {
    if (!query.trim()) return deals;
    const value = query.toLowerCase();
    return deals.filter(
      (deal) =>
        deal.brand.toLowerCase().includes(value) ||
        deal.offer.toLowerCase().includes(value) ||
        deal.area.toLowerCase().includes(value)
    );
  }, [query]);

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
                Rewards and experiences
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
              <Link href="/go/login" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    border: '1px solid #E5E7EB',
                    background: '#fff',
                    color: '#374151',
                    padding: '7px 12px',
                    borderRadius: 999,
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Sign in
                </button>
              </Link>
            </div>
          </div>
        </header>

        <main style={{ padding: '18px 16px 0' }}>

          {/* Hero card */}
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
                    'linear-gradient(180deg, rgba(17,24,39,0.15), rgba(17,24,39,0.5)), url(https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(17,24,39,0.06) 0%, rgba(17,24,39,0.42) 100%)',
                  }}
                />
                <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#fff',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      opacity: 0.85,
                    }}
                  >
                    Weekend planner
                  </div>
                  <h1
                    style={{
                      margin: '8px 0 0',
                      fontSize: 26,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: '#fff',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    Discover moments<br />worth saving for.
                  </h1>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  padding: 12,
                  background: '#fff',
                }}
              >
                {memberStats.map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: '#F9FAFB',
                      borderRadius: 12,
                      padding: '10px 8px',
                      border: '1px solid #F3F4F6',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

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
                <button
                  key={category.name}
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
                    transition: 'box-shadow 0.15s',
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
                </button>
              ))}
            </div>
          </section>

          {/* Wallet card */}
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
                My wallet
              </div>
              <span style={{ color: '#EA580C', fontSize: 12, fontWeight: 700 }}>+15% this month</span>
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #fff 0%, #FFF4EE 100%)',
                border: '1px solid #FDE8CC',
                borderRadius: 20,
                padding: '18px',
                boxShadow: '0 8px 22px rgba(234,88,12,0.07)',
              }}
            >
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
                  <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3, color: '#111827' }}>Gold Member</div>
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
                  Tier 3
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ color: '#9CA3AF', fontSize: 11 }}>Available points</div>
                  <div
                    style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.04em', color: '#111827' }}
                  >
                    1,480
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#9CA3AF', fontSize: 11 }}>Next reward</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Rs. 500 dining voucher</div>
                </div>
              </div>
            </div>
          </section>

          {/* Collections */}
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
                <div
                  key={collection.title}
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
              ))}
            </div>
          </section>

          {/* Trending deals */}
          <section style={{ marginBottom: 20 }}>
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
              Trending now
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {filteredDeals.map((deal) => (
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
                  <div style={{ position: 'relative', height: 170 }}>
                    <img
                      src={deal.image}
                      alt={deal.brand}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>{deal.area}</div>
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
                      }}
                    >
                      <span style={{ color: '#9CA3AF', fontSize: 12 }}>Member-only offer</span>
                      <Link
                        href="/go/discover"
                        style={{
                          textDecoration: 'none',
                          color: '#EA580C',
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      >
                        View deal
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Why members stay */}
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
              Why members stay
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

        {/* Bottom Nav — fixed, properly contained */}
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
              { label: 'Explore', href: '/go/discover', icon: 'explore', active: true },
              { label: 'Offers', href: '/go/discover', icon: 'local_offer', active: false },
              { label: 'My Card', href: '/check-membership', icon: 'credit_card', active: false },
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
      </div>
    </div>
  );
}
