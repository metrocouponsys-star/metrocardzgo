'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';

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
    terms: 'Valid on weekdays & weekends. Show active Metro Cardz GO membership pass at the ticketing counter.',
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
    terms: 'Minimum bill ₹2,500. Valid for dine-in reservations Monday through Thursday.',
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
    terms: 'Applicable on canopy & forest machan bookings. Complimentary breakfast included.',
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
    terms: 'Valid for standard 2D & 3D screenings on Tuesday and Wednesday.',
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
    terms: 'Valid with any 2-course meal order. One dessert per table per bill.',
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
    terms: 'Prior booking required 24 hours in advance. Valid on all 60m+ therapies.',
  },
];

const walletStats = [
  { label: 'Points Rate', value: 'Up to 3x' },
  { label: 'Active Deals', value: '40+' },
  { label: 'Partner Brands', value: '25+' },
];

export default function GoDiscoverPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<(typeof deals)[0] | null>(null);
  const [member, setMember] = useState<{ name?: string; phone?: string } | null>(null);
  const [redeemedDeals, setRedeemedDeals] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mc_member') || localStorage.getItem('mc_go_member');
      if (raw) {
        setMember(JSON.parse(raw));
      }
    } catch {}
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('mc_member');
    localStorage.removeItem('mc_go_member');
    setMember(null);
  };

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchCat = activeCategory === 'All' || deal.category === activeCategory;
      const matchSearch =
        !q ||
        deal.brand.toLowerCase().includes(q) ||
        deal.offer.toLowerCase().includes(q) ||
        deal.area.toLowerCase().includes(q) ||
        deal.meta.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
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
        {/* Sticky Header with perfect alignment */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'rgba(255,255,255,0.96)',
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
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <Link
              href="/go"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 11,
                  background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 16,
                  boxShadow: '0 6px 14px rgba(234,88,12,0.18)',
                  flexShrink: 0,
                }}
              >
                M
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: '#111827' }}>
                  Metro Cardz GO
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF' }}>
                  Discover Deals
                </div>
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {member ? (
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
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>account_circle</span>
                    {member.name || 'Member'}
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
                <Link href="/go/login" style={{ textDecoration: 'none' }}>
                  <button
                    style={{
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      borderRadius: 999,
                      padding: '7px 13px',
                      color: '#1F2937',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    Sign in
                  </button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main body */}
        <main style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Hero spotlight card */}
          <section
            style={{
              background: '#fff',
              border: '1px solid #F1F5F9',
              borderRadius: 22,
              overflow: 'hidden',
              boxShadow: '0 12px 24px rgba(15,23,42,0.06)',
            }}
          >
            <div
              style={{
                position: 'relative',
                height: 190,
                backgroundImage:
                  'linear-gradient(180deg, rgba(17,24,39,0.1) 0%, rgba(17,24,39,0.7) 100%), url(https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#1E293B',
              }}
            >
              <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16 }}>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#FED7AA',
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Mumbai & Western Region
                </div>
                <div
                  style={{
                    fontSize: 'clamp(20px, 5.5vw, 26px)',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    letterSpacing: '-0.04em',
                    color: '#fff',
                  }}
                >
                  Top picks & member privileges
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                padding: '12px 14px',
                background: '#FAFAFA',
              }}
            >
              {walletStats.map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 12,
                    padding: '8px 6px',
                    border: '1px solid #F3F4F6',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#EA580C' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                fontSize: 18,
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search brands, offers, areas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 12,
                border: '1px solid #E5E7EB',
                background: '#F9FAFB',
                paddingLeft: 38,
                paddingRight: 14,
                fontSize: 13,
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 800 }}>
                Categories
              </div>
              <span style={{ color: '#EA580C', fontWeight: 700, fontSize: 11 }}>
                {filteredDeals.length} offers
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {categories.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    style={{
                      border: isActive ? '1.5px solid #EA580C' : '1px solid #E5E7EB',
                      background: isActive ? '#FFF7ED' : '#FFFFFF',
                      color: isActive ? '#C2410C' : '#4B5563',
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Deals Feed */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 800 }}>
                Featured Deals
              </div>
              <Link
                href="/go/login"
                style={{
                  color: '#EA580C',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {member ? 'View My Pass' : 'Sign in to redeem'}
              </Link>
            </div>

            {filteredDeals.length === 0 ? (
              <div
                style={{
                  background: '#F9FAFB',
                  border: '1px dashed #D1D5DB',
                  borderRadius: 16,
                  padding: '36px 20px',
                  textAlign: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#9CA3AF' }}>
                  search_off
                </span>
                <p style={{ margin: '8px 0 4px', fontSize: 14, fontWeight: 700, color: '#374151' }}>
                  No deals found
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>
                  Try changing your category filter or search keywords
                </p>
              </div>
            ) : (
              filteredDeals.map((deal) => {
                const isClaimed = redeemedDeals[deal.id];
                return (
                  <article
                    key={deal.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #F1F5F9',
                      borderRadius: 20,
                      overflow: 'hidden',
                      boxShadow: '0 6px 16px rgba(15,23,42,0.04)',
                    }}
                  >
                    {/* Image banner with badge */}
                    <div style={{ position: 'relative', height: 160, background: '#1E293B' }}>
                      <img
                        src={deal.image}
                        alt={deal.brand}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          background: 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: 999,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#EA580C',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        }}
                      >
                        {deal.badge}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 8,
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: '#6B7280', fontSize: 11, fontWeight: 500 }}>
                            {deal.area} · {deal.category}
                          </div>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 800,
                              letterSpacing: '-0.03em',
                              marginTop: 2,
                              color: '#111827',
                            }}
                          >
                            {deal.brand}
                          </div>
                        </div>
                        <div
                          style={{
                            background: '#FFF7ED',
                            border: '1px solid #FFEDD5',
                            borderRadius: 999,
                            color: '#C2410C',
                            padding: '5px 10px',
                            fontWeight: 800,
                            fontSize: 11,
                            flexShrink: 0,
                          }}
                        >
                          {deal.price}
                        </div>
                      </div>

                      <p
                        style={{
                          margin: '10px 0 8px',
                          fontWeight: 700,
                          fontSize: 14,
                          color: '#1F2937',
                          lineHeight: 1.4,
                        }}
                      >
                        {deal.offer}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          marginTop: 12,
                          paddingTop: 10,
                          borderTop: '1px solid #F3F4F6',
                        }}
                      >
                        <div style={{ color: '#6B7280', fontSize: 11 }}>{deal.meta}</div>
                        <button
                          onClick={() => setSelectedDeal(deal)}
                          style={{
                            background: isClaimed ? '#10B981' : '#EA580C',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {isClaimed ? (
                            <>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                              Claimed
                            </>
                          ) : (
                            'View Deal →'
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </main>

        {/* Deal Details Modal — in-place without redirecting to check-membership */}
        {selectedDeal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
            onClick={() => setSelectedDeal(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                background: '#FFFFFF',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: '24px 20px',
                boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 11, color: '#EA580C', fontWeight: 800, textTransform: 'uppercase' }}>
                    {selectedDeal.category} · {selectedDeal.area}
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: '#111827' }}>
                    {selectedDeal.brand}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDeal(null)}
                  style={{
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#6B7280' }}>close</span>
                </button>
              </div>

              <div
                style={{
                  background: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: '#C2410C', marginBottom: 4 }}>
                  {selectedDeal.offer}
                </div>
                <div style={{ fontSize: 12, color: '#9A3412' }}>
                  {selectedDeal.meta} · {selectedDeal.price}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Terms & Conditions
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
                  {selectedDeal.terms}
                </div>
              </div>

              {redeemedDeals[selectedDeal.id] ? (
                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 12,
                    padding: '14px',
                    textAlign: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#16A34A' }}>
                    verified
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#15803D', marginTop: 4 }}>
                    Voucher Code: GO-{selectedDeal.brand.toUpperCase().slice(0, 4)}-{Math.floor(1000 + Math.random() * 9000)}
                  </div>
                  <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
                    Show this code or your Metro Cardz pass at checkout.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => {
                      setRedeemedDeals((prev) => ({ ...prev, [selectedDeal.id]: true }));
                    }}
                    style={{
                      width: '100%',
                      height: 48,
                      border: 'none',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(234,88,12,0.25)',
                    }}
                  >
                    Claim Member Coupon
                  </button>
                  <Link
                    href="/go/login"
                    style={{ textDecoration: 'none', textAlign: 'center', fontSize: 12, color: '#6B7280' }}
                  >
                    Want to save to your member pass? <span style={{ color: '#EA580C', fontWeight: 700 }}>Sign in</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Nav — fixed, contained, proper z-index and Material Symbols */}
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
            zIndex: 40,
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
              { label: 'Home', href: '/go', icon: 'home', active: false },
              { label: 'Explore', href: '/go/discover', icon: 'explore', active: true },
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
      </div>
    </div>
  );
}
