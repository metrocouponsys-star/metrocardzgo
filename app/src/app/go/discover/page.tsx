'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import {
  GO_CATALOG_DEALS,
  GoDeal,
  GoCustomerProfile,
  GoClaimedOffer,
  getActiveCustomer,
  claimDealForCustomer,
  getRemainingOffersCount,
  logoutCustomer,
  saveCustomerData,
} from '@/lib/goStore';
import { MemberAuthGateModal } from '@/components/deals/MemberAuthGateModal';
import { InteractiveFlipCard } from '@/components/cards/InteractiveFlipCard';
import { loadSavedCardDesign } from '@/types/cardDesign';

const categories = ['All', 'Dining', 'Food & Café', 'Resorts', 'Movies', 'Water Parks', 'Wellness', 'Gaming'];

export default function GoDiscoverPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDeal, setSelectedDeal] = useState<GoDeal | null>(null);
  const [customer, setCustomer] = useState<GoCustomerProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'claimed' | 'savings'>('all');
  const [lastClaimNotice, setLastClaimNotice] = useState<string | null>(null);
  const [showGoCardPass, setShowGoCardPass] = useState(false);

  // Load customer state on mount
  useEffect(() => {
    const cust = getActiveCustomer();
    if (cust) {
      setCustomer(cust);
    }
  }, []);

  const handleSignOut = () => {
    logoutCustomer();
    setCustomer(null);
    setSelectedDeal(null);
    setActiveTab('all');
  };

  const handleAuthSuccess = (authenticatedCustomer: GoCustomerProfile) => {
    setCustomer(authenticatedCustomer);
    setAuthModalOpen(false);
    // Sync with server API
    fetch('/api/v1/go/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authenticatedCustomer),
    }).catch(() => {});
  };

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return GO_CATALOG_DEALS.filter((deal) => {
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

  // Handle claiming an offer
  const handleClaim = (deal: GoDeal) => {
    if (!customer) {
      // Must authenticate membership and right person first
      setSelectedDeal(deal);
      setAuthModalOpen(true);
      return;
    }

    const result = claimDealForCustomer(customer, deal);
    setCustomer({ ...result.customer });
    setLastClaimNotice(result.message);

    // Sync claim to server
    fetch('/api/v1/go/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: customer.phone || customer.memberCode || customer.id,
        dealId: deal.id,
        brand: deal.brand,
        offer: deal.offer,
        savingsAmount: deal.savingsAmount,
        pointsReward: deal.pointsReward,
      }),
    }).catch(() => {});

    setTimeout(() => {
      setLastClaimNotice(null);
    }, 4000);
  };

  const remainingCount = getRemainingOffersCount(customer);
  const claimedCount = customer?.claimedOffers.length || 0;
  const claimedMap = useMemo(() => {
    const map = new Map<string, GoClaimedOffer>();
    if (customer?.claimedOffers) {
      for (const c of customer.claimedOffers) {
        map.set(c.dealId, c);
      }
    }
    return map;
  }, [customer]);

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
          paddingBottom: 90,
          position: 'relative',
        }}
      >
        {/* Sticky Header */}
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
                  Exclusive Deals
                </div>
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
                    borderRadius: 999,
                    padding: '7px 14px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span>🔒</span>
                  <span>Authenticate</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Floating Notification */}
        {lastClaimNotice && (
          <div
            style={{
              position: 'fixed',
              top: 70,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              background: '#065F46',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              maxWidth: '90%',
              textAlign: 'center',
            }}
          >
            {lastClaimNotice}
          </div>
        )}

        {/* Main Body */}
        <main style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Membership Gate Alert (Shown if unauthenticated) */}
          {!customer ? (
            <section
              style={{
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                border: '1.5px solid #FDBA74',
                borderRadius: 20,
                padding: '18px 16px',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#EA580C',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  🔒
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#9A3412', letterSpacing: '-0.02em' }}>
                    Offers are Member-Protected
                  </div>
                  <p style={{ margin: '4px 0 12px', fontSize: 13, color: '#7C2D12', lineHeight: 1.45 }}>
                    Offers and discounts are strictly visible and claimable <strong>only after authenticating membership</strong> and verifying your registered identity.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    style={{
                      border: 'none',
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                      color: '#fff',
                      padding: '10px 18px',
                      borderRadius: 12,
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(234, 88, 12, 0.28)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Authenticate Membership Now</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </section>
          ) : (
            /* Live Customer Statistics Card (Isolated per customer!) */
            <section
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF8F3 100%)',
                border: '1.5px solid #FFEDD5',
                borderRadius: 22,
                padding: '18px',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {customer.tier} · {customer.memberCode}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginTop: 2 }}>
                    Welcome, {customer.name}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setShowGoCardPass(!showGoCardPass)}
                    style={{
                      background: showGoCardPass ? '#EA580C' : '#FFF',
                      color: showGoCardPass ? '#FFF' : '#EA580C',
                      border: '1px solid #FDBA74',
                      borderRadius: 999,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>💳</span>
                    <span>{showGoCardPass ? 'Hide Pass' : 'Digital Pass'}</span>
                  </button>
                  <div
                    style={{
                      background: '#DCFCE7',
                      border: '1px solid #BBF7D0',
                      color: '#15803D',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    Verified
                  </div>
                </div>
              </div>

              {/* 3D Interactive Flippable GO Deal Pass */}
              {showGoCardPass && (
                <div style={{ marginBottom: 16 }} className="animate-fade-in">
                  <InteractiveFlipCard
                    design={loadSavedCardDesign('mer-001', 'go_pass')}
                    memberName={customer.name}
                    cardNumber={`MC-GO-${customer.memberCode || '8842'}`}
                    validThru="12/28"
                    tier={customer.tier}
                    points={customer.points}
                    qrValue={`https://metrocardz.in/go/c/${customer.memberCode}`}
                    interactive={true}
                  />
                  <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span>👆</span>
                    <span>Tap card to flip 3D · Scannable partner voucher on back</span>
                  </p>
                </div>
              )}

              {/* 4 Real Metric Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#EA580C' }}>
                    {customer.points.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>Points</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>
                    ₹{customer.totalSavedMoney.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>Saved</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#2563EB' }}>
                    {claimedCount}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>Claimed</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#7C3AED' }}>
                    {remainingCount}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>Remaining</div>
                </div>
              </div>
            </section>
          )}

          {/* Navigation Sub-Tabs (All Offers vs My Claimed vs Savings Ledger) */}
          {customer && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.2fr 1fr',
                background: '#F1F5F9',
                borderRadius: 14,
                padding: 4,
                gap: 4,
              }}
            >
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  border: 'none',
                  background: activeTab === 'all' ? '#fff' : 'transparent',
                  color: activeTab === 'all' ? '#EA580C' : '#64748B',
                  fontWeight: activeTab === 'all' ? 800 : 600,
                  fontSize: 12,
                  padding: '9px 8px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                All Deals ({GO_CATALOG_DEALS.length})
              </button>
              <button
                onClick={() => setActiveTab('claimed')}
                style={{
                  border: 'none',
                  background: activeTab === 'claimed' ? '#fff' : 'transparent',
                  color: activeTab === 'claimed' ? '#EA580C' : '#64748B',
                  fontWeight: activeTab === 'claimed' ? 800 : 600,
                  fontSize: 12,
                  padding: '9px 8px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'claimed' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Claimed ({claimedCount})
              </button>
              <button
                onClick={() => setActiveTab('savings')}
                style={{
                  border: 'none',
                  background: activeTab === 'savings' ? '#fff' : 'transparent',
                  color: activeTab === 'savings' ? '#EA580C' : '#64748B',
                  fontWeight: activeTab === 'savings' ? 800 : 600,
                  fontSize: 12,
                  padding: '9px 8px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  boxShadow: activeTab === 'savings' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Savings Log
              </button>
            </div>
          )}

          {/* TAB 1: ALL DEALS FEED */}
          {activeTab === 'all' && (
            <>
              {/* Search */}
              <section>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#fff',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: 16,
                    padding: '10px 14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <span style={{ fontSize: 16, color: '#9CA3AF' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search restaurant, resort, water park..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      color: '#111827',
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      style={{ border: 'none', background: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 14 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </section>

              {/* Categories Carousel */}
              <section>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    overflowX: 'auto',
                    paddingBottom: 4,
                    scrollbarWidth: 'none',
                  }}
                >
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                          border: isActive ? '1.5px solid #EA580C' : '1px solid #E5E7EB',
                          background: isActive ? '#FFF7ED' : '#FFFFFF',
                          color: isActive ? '#C2410C' : '#4B5563',
                          padding: '7px 14px',
                          borderRadius: 999,
                          fontWeight: isActive ? 800 : 600,
                          fontSize: 12,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Deals Feed */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', fontWeight: 800 }}>
                    {customer ? 'Available Member Deals' : 'Exclusive Deals Preview (Locked)'}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#EA580C' }}>
                    {customer ? `${remainingCount} Remaining to Claim` : 'Auth to Unlock'}
                  </span>
                </div>

                {filteredDeals.map((deal) => {
                  const claimedItem = claimedMap.get(deal.id);
                  const isClaimed = Boolean(claimedItem);

                  return (
                    <article
                      key={deal.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #F1F5F9',
                        borderRadius: 20,
                        overflow: 'hidden',
                        boxShadow: '0 6px 16px rgba(15,23,42,0.04)',
                        position: 'relative',
                      }}
                    >
                      {/* Image Banner */}
                      <div style={{ position: 'relative', height: 160, background: '#1E293B' }}>
                        <img
                          src={deal.image}
                          alt={deal.brand}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            filter: !customer ? 'blur(1.5px) brightness(0.9)' : 'none',
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
                          }}
                        >
                          {deal.badge}
                        </div>

                        {/* Unauthenticated Lock Overlay */}
                        {!customer && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(15, 23, 42, 0.45)',
                              backdropFilter: 'blur(2px)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                              gap: 6,
                              color: '#fff',
                            }}
                          >
                            <span style={{ fontSize: 28 }}>🔒</span>
                            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.04em' }}>
                              MEMBER ACCESS ONLY
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ color: '#6B7280', fontSize: 11, fontWeight: 500 }}>
                              {deal.area} · {deal.category}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginTop: 2 }}>
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
                            }}
                          >
                            {customer ? deal.price : 'Members Only'}
                          </div>
                        </div>

                        <p style={{ margin: '10px 0 8px', fontWeight: 700, fontSize: 14, color: '#1F2937' }}>
                          {deal.offer}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: 12,
                            paddingTop: 10,
                            borderTop: '1px solid #F3F4F6',
                          }}
                        >
                          <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>
                            {customer ? `Saves ₹${deal.savingsAmount} · +${deal.pointsReward} pts` : 'Sign in to see savings'}
                          </div>

                          {/* Action Button: Gated strictly behind authentication */}
                          {!customer ? (
                            <button
                              onClick={() => {
                                setSelectedDeal(deal);
                                setAuthModalOpen(true);
                              }}
                              style={{
                                background: '#EA580C',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '8px 14px',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                boxShadow: '0 3px 10px rgba(234, 88, 12, 0.25)',
                              }}
                            >
                              <span>🔒 Unlock Offer</span>
                            </button>
                          ) : isClaimed ? (
                            <button
                              onClick={() => setSelectedDeal(deal)}
                              style={{
                                background: '#059669',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '8px 14px',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <span>✓ Claimed</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleClaim(deal)}
                              style={{
                                background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 10,
                                padding: '8px 14px',
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
                              }}
                            >
                              <span>Claim Pass →</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          )}

          {/* TAB 2: MY CLAIMED OFFERS */}
          {activeTab === 'claimed' && customer && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  My Claimed Passes ({customer.claimedOffers.length})
                </h3>
                <span style={{ fontSize: 12, color: '#6B7280' }}>
                  Show voucher at venue
                </span>
              </div>

              {customer.claimedOffers.length === 0 ? (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: 20,
                    padding: '36px 20px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎟️</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#334155' }}>No offers claimed yet</div>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 16px' }}>
                    Browse our {GO_CATALOG_DEALS.length} member-exclusive deals and claim your passes.
                  </p>
                  <button
                    onClick={() => setActiveTab('all')}
                    style={{
                      background: '#EA580C',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '9px 18px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Browse Available Deals
                  </button>
                </div>
              ) : (
                customer.claimedOffers.map((claim) => (
                  <div
                    key={claim.claimId}
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #BBF7D0',
                      borderRadius: 20,
                      padding: 16,
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>
                          {claim.category} · {claim.area}
                        </span>
                        <h4 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, color: '#111827' }}>
                          {claim.brand}
                        </h4>
                      </div>
                      <span
                        style={{
                          background: '#DCFCE7',
                          color: '#15803D',
                          borderRadius: 999,
                          padding: '3px 10px',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        Active Pass
                      </span>
                    </div>

                    <div style={{ margin: '8px 0', fontSize: 14, fontWeight: 700, color: '#374151' }}>
                      {claim.offer}
                    </div>

                    {/* Voucher Code Box */}
                    <div
                      style={{
                        background: '#F0FDF4',
                        border: '1px dashed #86EFAC',
                        borderRadius: 12,
                        padding: '12px',
                        textAlign: 'center',
                        margin: '12px 0 8px',
                      }}
                    >
                      <div style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>VOUCHER REDEMPTION CODE</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#15803D', letterSpacing: '0.15em', marginTop: 2 }}>
                        {claim.voucherCode}
                      </div>
                      <div style={{ fontSize: 10, color: '#166534', marginTop: 3 }}>
                        Saved ₹{claim.savingsAmount} · Claimed {new Date(claim.claimedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {/* TAB 3: SAVINGS & POINTS LOG */}
          {activeTab === 'savings' && customer && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                  borderRadius: 20,
                  padding: '20px',
                  color: '#fff',
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Cumulative Member Savings
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, margin: '6px 0 2px' }}>
                  ₹{customer.totalSavedMoney.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>
                  Earned {customer.points} Loyalty Points across {customer.claimedOffers.length} claimed offers
                </div>
              </div>

              <h4 style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 800, color: '#334155' }}>
                Savings Transaction History
              </h4>

              {customer.savingsHistory.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                  No savings recorded yet. Claim offers to start saving money!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {customer.savingsHistory.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: '#fff',
                        border: '1px solid #E2E8F0',
                        borderRadius: 12,
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{item.brand}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          {item.offer} · {new Date(item.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#059669' }}>
                          +₹{item.savingsAmount}
                        </div>
                        <div style={{ fontSize: 10, color: '#EA580C', fontWeight: 700 }}>
                          +{item.pointsEarned} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </main>

        {/* Modal: Deal Details & Claim Pass */}
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
                    fontSize: 16,
                  }}
                >
                  ✕
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
                  {selectedDeal.meta} · Saves approx ₹{selectedDeal.savingsAmount} · Earns +{selectedDeal.pointsReward} Points
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

              {/* Action */}
              {!customer ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => {
                      setAuthModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      height: 48,
                      border: 'none',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(234,88,12,0.25)',
                    }}
                  >
                    🔒 Authenticate Membership to Claim Pass
                  </button>
                  <span style={{ fontSize: 11, textAlign: 'center', color: '#6B7280' }}>
                    Requires verified membership card or mobile identity.
                  </span>
                </div>
              ) : claimedMap.has(selectedDeal.id) ? (
                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: 12,
                    padding: '14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24 }}>✓</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#15803D', marginTop: 4 }}>
                    Voucher Code: {claimedMap.get(selectedDeal.id)?.voucherCode}
                  </div>
                  <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>
                    Already claimed on {new Date(claimedMap.get(selectedDeal.id)!.claimedAt).toLocaleDateString()}. Show at counter.
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    handleClaim(selectedDeal);
                    setSelectedDeal(null);
                  }}
                  style={{
                    width: '100%',
                    height: 48,
                    border: 'none',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(234,88,12,0.25)',
                  }}
                >
                  Claim Member Pass Now (+{selectedDeal.pointsReward} Points)
                </button>
              )}
            </div>
          </div>
        )}

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
              { label: 'Home', href: '/go', icon: '🏠', active: false },
              { label: 'Explore', href: '/go/discover', icon: '🔍', active: true },
              { label: 'My Pass', href: '/go/login', icon: '💳', active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: item.active ? '#EA580C' : '#6B7280',
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 11, fontWeight: item.active ? 800 : 500 }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Member Authentication Modal */}
        <MemberAuthGateModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          title="Authenticate Membership"
          subtitle="Verify your membership card or registered phone to unlock exclusive member offers and claim passes."
        />
      </div>
    </div>
  );
}
