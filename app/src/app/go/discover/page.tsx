'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const categories = ['All', 'Dining', 'Food & Café', 'Resorts', 'Movies', 'Water Parks', 'Wellness'];

const deals = [
  {
    id: 'imagicaa',
    brand: 'Imagicaa',
    area: 'Khopoli',
    offer: '40% OFF on combo tickets',
    meta: 'Theme + Water Park',
    badge: 'Hot Deal',
    category: 'Water Parks',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    price: 'From ₹699',
  },
  {
    id: 'bastian',
    brand: 'Bastian',
    area: 'Mumbai',
    offer: 'Flat ₹500 off dining',
    meta: 'Premium dinner',
    badge: 'Chef pick',
    category: 'Dining',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
    price: 'Saver ₹500',
  },
  {
    id: 'machan',
    brand: 'The Machan',
    area: 'Lonavala',
    offer: 'Sunset stay packages',
    meta: 'Weekend getaway',
    badge: 'Weekend',
    category: 'Resorts',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80',
    price: 'From ₹2,299',
  },
  {
    id: 'cinepolis',
    brand: 'Cinepolis',
    area: 'Andheri',
    offer: 'Buy 1 get 1 movie nights',
    meta: 'Premium cinema',
    badge: 'New',
    category: 'Movies',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
    price: 'Pair offer',
  },
  {
    id: 'cafewave',
    brand: 'Café Wave',
    area: 'Powai',
    offer: 'Free dessert with brunch',
    meta: 'Coffee + bites',
    badge: 'Popular',
    category: 'Food & Café',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=80',
    price: 'Complimentary',
  },
  {
    id: 'muse',
    brand: 'Muse Spa',
    area: 'Bandra',
    offer: '30% OFF wellness rituals',
    meta: 'Relax & recharge',
    badge: 'Wellness',
    category: 'Wellness',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1000&q=80',
    price: 'Save 30%',
  },
];

const walletStats = [
  { label: 'Points', value: '1,480' },
  { label: 'Saved', value: '₹2,300' },
  { label: 'Active', value: '12' },
];

export default function GoDiscoverPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredDeals = useMemo(() => {
    if (activeCategory === 'All') return deals;
    return deals.filter((deal) => deal.category === activeCategory);
  }, [activeCategory]);

  return (
    <div style={{ minHeight: '100vh', background: '#F6F3EE', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '18px 16px 100px', position: 'relative' }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: 'rgba(246,243,238,0.9)',
            backdropFilter: 'blur(18px)',
            margin: '0 -16px',
            padding: '12px 16px 10px',
            borderBottom: '1px solid #EAE3DD',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>M</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Metro Cardz GO</div>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B7280' }}>Discover</div>
              </div>
            </div>
            <Link href="/go/login" style={{ textDecoration: 'none' }}>
              <button style={{ border: '1px solid #EAE3DD', background: '#fff', borderRadius: 999, padding: '8px 12px', color: '#1F2937', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                Login
              </button>
            </Link>
          </div>
        </header>

        <main style={{ display: 'grid', gap: 20, marginTop: 18 }}>
          <section style={{ background: '#fff', border: '1px solid #EAE3DD', borderRadius: 26, overflow: 'hidden', boxShadow: '0 16px 26px rgba(15,23,42,0.05)' }}>
            <div style={{ position: 'relative', height: 210, backgroundImage: 'linear-gradient(180deg, rgba(17,24,39,0.18), rgba(17,24,39,0.45)), url(https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(17,24,39,0.08) 0%, rgba(17,24,39,0.5) 100%)' }} />
              <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', opacity: 0.9, marginBottom: 8 }}>This week</div>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.06em', color: '#fff' }}>Top picks for your city</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 14 }}>
              {walletStats.map((item) => (
                <div key={item.label} style={{ background: '#F9F7F5', borderRadius: 14, padding: '10px 8px', border: '1px solid #F1E7DF', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ background: '#fff', border: '1px solid #EAE3DD', borderRadius: 22, padding: 14, boxShadow: '0 12px 20px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 800 }}>Categories</div>
              <span style={{ color: '#EA580C', fontWeight: 700, fontSize: 12 }}>Mumbai</span>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  style={{
                    border: activeCategory === category ? '1px solid #F9D2B0' : '1px solid #EAE3DD',
                    background: activeCategory === category ? '#FFF7ED' : '#fff',
                    color: activeCategory === category ? '#C2410C' : '#374151',
                    padding: '9px 12px',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          <section style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 800 }}>Recommended</div>
              <Link href="/check-membership" style={{ color: '#EA580C', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>My membership</Link>
            </div>

            {filteredDeals.map((deal) => (
              <article key={deal.id} style={{ background: '#fff', border: '1px solid #EAE3DD', borderRadius: 22, overflow: 'hidden', boxShadow: '0 12px 20px rgba(15,23,42,0.04)' }}>
                <div style={{ position: 'relative', height: 180 }}>
                  <img src={deal.image} alt={deal.brand} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800, color: '#EA580C' }}>{deal.badge}</div>
                </div>

                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ color: '#71717A', fontSize: 11 }}>{deal.area}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 4 }}>{deal.brand}</div>
                    </div>
                    <div style={{ background: '#FFF7ED', border: '1px solid #F0C498', borderRadius: 999, color: '#C2410C', padding: '7px 9px', fontWeight: 800, fontSize: 11 }}>{deal.price}</div>
                  </div>

                  <p style={{ margin: '12px 0 10px', fontWeight: 700, fontSize: 16 }}>{deal.offer}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ color: '#6B7280', fontSize: 12 }}>{deal.meta}</div>
                    <Link href="/check-membership" style={{ color: '#EA580C', textDecoration: 'none', fontWeight: 800, fontSize: 12 }}>View member benefits →</Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </main>

        <nav style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 0, width: '100%', maxWidth: 520, background: 'rgba(255,255,255,0.96)', borderTop: '1px solid #EAE3DD', backdropFilter: 'blur(18px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: 64 }}>
            {[
              { label: 'Explore', href: '/go/discover', active: true },
              { label: 'My Card', href: '/check-membership', active: false },
              { label: 'Member access', href: '/check-membership', active: false },
            ].map((item) => (
              <Link key={item.label} href={item.href} aria-current={item.active ? 'page' : undefined} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: item.active ? '#EA580C' : '#71717A', fontWeight: 700, fontSize: 12 }}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
