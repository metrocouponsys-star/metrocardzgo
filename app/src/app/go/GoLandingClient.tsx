'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const categories = [
  { name: 'Water Parks', icon: '🏝️', tag: 'Up to 40% Off', count: '18 offers' },
  { name: 'Restaurants', icon: '🍽️', tag: 'Top Picks', count: '26 offers' },
  { name: 'Resorts', icon: '🏨', tag: 'Stay + Save', count: '15 offers' },
  { name: 'Movies', icon: '🎬', tag: 'Buy 1 Get 1', count: '8 offers' },
  { name: 'Cafés', icon: '☕', tag: 'Coffee Runs', count: '14 offers' },
  { name: 'Gaming', icon: '🎮', tag: 'Weekend Deals', count: '12 offers' },
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
    offer: 'Flat ₹500 off dining',
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
  { title: 'Great food deals', subtitle: 'Popular city picks', icon: '🍽️', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80' },
  { title: 'Water park escapes', subtitle: 'Quick weekend wins', icon: '🎢', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=900&q=80' },
  { title: 'Stay & recharge', subtitle: 'Resorts and escapes', icon: '🏨', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80' },
];

const memberStats = [
  { value: '1,480', label: 'Points' },
  { value: '12', label: 'Active offers' },
  { value: '₹2,300', label: 'Saved' },
];

const perks = [
  { icon: '✨', title: 'Curated discovery', text: 'Hand-picked offers built around lifestyle and weekend plans.' },
  { icon: '🛡️', title: 'Trust-first', text: 'Transparent savings, verified experiences, and no hidden clutter.' },
  { icon: '⚡', title: 'Instant redemption', text: 'Scan, unlock, and redeem in seconds with your member wallet.' },
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
    <div style={{ background: '#F6F3EE', minHeight: '100vh', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 110 }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'rgba(246,243,238,0.86)',
            backdropFilter: 'blur(18px)',
            borderBottom: '1px solid #EAE3DD',
          }}
        >
          <div style={{ padding: '12px 16px 10px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 18,
                boxShadow: '0 12px 20px rgba(234,88,12,0.2)',
              }}
            >
              M
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>Metro Cardz GO</div>
              <div style={{ fontSize: 11, color: '#6B7280', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Rewards & experiences
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href="/go/discover" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    border: '1px solid #F8D7C0',
                    background: '#FFF7ED',
                    color: '#C2410C',
                    padding: '8px 12px',
                    borderRadius: 999,
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Explore deals
                </button>
              </Link>
              <Link href="/go/login" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    border: '1px solid #EAE3DD',
                    background: '#fff',
                    color: '#1F2937',
                    padding: '8px 12px',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px rgba(17, 24, 39, 0.04)',
                  }}
                >
                  Login
                </button>
              </Link>
            </div>
          </div>
        </header>

        <main style={{ padding: '18px 16px 0' }}>
          <section style={{ marginBottom: 20 }}>
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 26,
                border: '1px solid #F1E4D7',
                boxShadow: '0 18px 30px rgba(17, 24, 39, 0.06)',
                background: '#fff',
              }}
            >
              <div
                style={{
                  height: 220,
                  backgroundImage: 'linear-gradient(180deg, rgba(17,24,39,0.15), rgba(17,24,39,0.45)), url(https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(17,24,39,0.08), rgba(17,24,39,0.4))' }} />
                <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
                  <div style={{ fontSize: 11, color: '#fff', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.9 }}>
                    Weekend planner
                  </div>
                  <h1 style={{ margin: '8px 0 6px', fontSize: 30, fontWeight: 800, lineHeight: 1.08, color: '#fff', letterSpacing: '-0.06em' }}>
                    Discover moments worth saving for.
                  </h1>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 14 }}>
                {memberStats.map((stat) => (
                  <div key={stat.label} style={{ background: '#F9F7F4', borderRadius: 14, padding: '10px 8px', border: '1px solid #F0E7E0', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                border: '1px solid #EAE3DD',
                borderRadius: 18,
                padding: '10px 12px',
                boxShadow: '0 12px 20px rgba(15, 23, 42, 0.03)',
              }}
            >
              <span style={{ fontSize: 16 }}>🔍</span>
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
                }}
              />
            </div>
          </section>

          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                Top categories
              </div>
              <Link href="/go/discover" style={{ color: '#EA580C', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>
                View all
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {categories.map((category) => (
                <button
                  key={category.name}
                  style={{
                    border: '1px solid #EAE3DD',
                    background: '#fff',
                    borderRadius: 18,
                    minWidth: 128,
                    padding: '14px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: '0 10px 18px rgba(15, 23, 42, 0.03)',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{category.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#18181B' }}>{category.name}</div>
                  <div style={{ fontSize: 11, color: '#71717A', marginTop: 4 }}>{category.tag}</div>
                  <div style={{ fontSize: 10, color: '#EA580C', marginTop: 8, fontWeight: 700 }}>{category.count}</div>
                </button>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                My wallet
              </div>
              <span style={{ color: '#EA580C', fontSize: 12, fontWeight: 700 }}>+ 15% this month</span>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #fff 0%, #fff2ea 100%)', border: '1px solid #F8D7C0', borderRadius: 22, padding: 18, boxShadow: '0 14px 22px rgba(234,88,12,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ color: '#6B7280', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Metro Cardz GO</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>Gold Member</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #F3D9C4', borderRadius: 999, padding: '7px 10px', color: '#EA580C', fontSize: 11, fontWeight: 800 }}>Tier 3</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                  <div style={{ color: '#6B7280', fontSize: 11 }}>Available points</div>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.06em' }}>1,480</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#6B7280', fontSize: 11 }}>Next reward</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>₹500 dining voucher</div>
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                Curated collections
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {collections.map((collection) => (
                <div key={collection.title} style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', minHeight: 120, background: '#fff', border: '1px solid #EAE3DD', boxShadow: '0 12px 20px rgba(15, 23, 42, 0.04)' }}>
                  <img src={collection.image} alt={collection.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(17,24,39,0.6) 0%, rgba(17,24,39,0.15) 100%)' }} />
                  <div style={{ position: 'relative', zIndex: 1, padding: 18, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 24 }}>{collection.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 8 }}>{collection.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{collection.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                Trending now
              </div>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {filteredDeals.map((deal) => (
                <article
                  key={deal.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #EAE3DD',
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: '0 12px 20px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  <div style={{ position: 'relative', height: 180 }}>
                    <img src={deal.image} alt={deal.brand} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800, color: '#EA580C' }}>{deal.badge}</div>
                  </div>

                  <div style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#71717A', marginBottom: 4 }}>{deal.area}</div>
                        <h3 style={{ margin: 0, fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.04em', fontWeight: 800 }}>{deal.brand}</h3>
                      </div>
                      <div style={{ background: '#FFF7ED', color: '#C2410C', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '6px 8px', border: '1px solid #FED7AA', whiteSpace: 'nowrap' }}>{deal.meta}</div>
                    </div>

                    <p style={{ margin: '12px 0', color: '#27272A', fontWeight: 700, fontSize: 16 }}>{deal.offer}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#71717A', fontSize: 12 }}>Member-only offer</span>
                      <Link href="/go/discover" style={{ textDecoration: 'none', color: '#EA580C', fontWeight: 800, fontSize: 12 }}>View deal →</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#6B7280', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
              Why members stay
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {perks.map((perk) => (
                <div key={perk.title} style={{ background: '#fff', border: '1px solid #EAE3DD', borderRadius: 18, padding: 16, boxShadow: '0 8px 14px rgba(15, 23, 42, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{perk.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{perk.title}</div>
                  </div>
                  <div style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.6 }}>{perk.text}</div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <nav
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 0,
            width: '100%',
            maxWidth: 500,
            background: 'rgba(255,255,255,0.96)',
            borderTop: '1px solid #EAE3DD',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 64 }}>
            {[
              { label: 'Explore', href: '/go/discover', active: true },
              { label: 'Offers', href: '/go/discover', active: false },
              { label: 'My Card', href: '/check-membership', active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: item.active ? '#EA580C' : '#71717A',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
