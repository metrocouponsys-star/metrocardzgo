'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect, useCallback } from 'react';
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

// ── Design Tokens (consistent across GO system) ──────────────────────────────
const T = {
  primary:      '#FF6B35',
  primaryDark:  '#C2410C',
  primaryBg:    '#FFF7ED',
  surface:      '#FFFFFF',
  surface2:     '#F8FAFC',
  surface3:     '#F1F5F9',
  border:       '#E2E8F0',
  text:         '#0F172A',
  textMuted:    '#64748B',
  textLight:    '#94A3B8',
  success:      '#059669',
  successBg:    '#ECFDF5',
  error:        '#DC2626',
  info:         '#2563EB',
  shadowSm:     '0 1px 3px rgba(15,23,42,.04), 0 2px 6px rgba(15,23,42,.03)',
  shadowMd:     '0 4px 16px rgba(15,23,42,.08)',
  shadowLg:     '0 8px 32px rgba(15,23,42,.10)',
  glowOrange:   '0 8px 24px rgba(234,88,12,.22)',
  radSm:        '8px',
  radMd:        '12px',
  radLg:        '16px',
  radXl:        '20px',
  radPill:      '999px',
};

// ── SVG Icon Components (replaces emojis) ────────────────────────────────────
function IconLock({ size = 18, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill={color} />
    </svg>
  );
}

function IconCard({ size = 18, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M3 10h18" stroke={color} strokeWidth="1.8" />
      <rect x="6" y="14" width="4" height="2" rx="1" fill={color} />
    </svg>
  );
}

function IconHome({ size = 20, active = false }: { size?: number; active?: boolean }) {
  const c = active ? T.primary : T.textMuted;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11.5L12 3l9 8.5" stroke={c} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M5 9.5V20a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V9.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCompass({ size = 20, active = false }: { size?: number; active?: boolean }) {
  const c = active ? T.primary : T.textMuted;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8" />
      <path d="M15.5 8.5l-3 6.5-1.5-3.5L8 10l6.5-3-1.5 4.5z" fill={active ? T.primary : 'none'} stroke={c} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function IconBadge({ size = 20, active = false }: { size?: number; active?: boolean }) {
  const c = active ? T.primary : T.textMuted;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l2.09 6.26L21 9l-5 4.87 1.18 7.13L12 18.77 6.82 21 8 13.87 3 9l6.91-.74L12 2z" stroke={c} strokeWidth="1.8" fill={active ? T.primary : 'none'} strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch({ size = 18, color = T.textLight }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
      <path d="M16 16l4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ size = 16, color = T.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 13l5 5L20 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowRight({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTap({ size = 14, color = T.textLight }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 11V6a3 3 0 016 0v5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 12a4 4 0 014 4v4h6v-4a4 4 0 014-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Category data ────────────────────────────────────────────────────────────
const categories = ['All', 'Dining', 'Food & Café', 'Resorts', 'Movies', 'Water Parks', 'Wellness', 'Gaming'];

// ── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ animation: 'go-spin 0.7s linear infinite' }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" strokeDasharray="42 16" strokeLinecap="round" />
    </svg>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: 'success' | 'info' }) {
  const bg = type === 'success' ? '#065F46' : T.info;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 72,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        background: bg,
        color: '#fff',
        padding: '12px 20px',
        borderRadius: T.radPill,
        fontSize: 13,
        fontWeight: 700,
        boxShadow: T.shadowLg,
        maxWidth: '90vw',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        animation: 'go-fadeSlide 0.3s ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      <IconCheck size={15} color="#fff" />
      {message}
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radXl, overflow: 'hidden', boxShadow: T.shadowSm }}>
      <div style={{ height: 160, background: T.surface3, animation: 'go-pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 11, width: '40%', background: T.surface3, borderRadius: 6, animation: 'go-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 18, width: '70%', background: T.surface3, borderRadius: 6, animation: 'go-pulse 1.5s ease-in-out 0.1s infinite' }} />
        <div style={{ height: 14, width: '90%', background: T.surface3, borderRadius: 6, animation: 'go-pulse 1.5s ease-in-out 0.2s infinite' }} />
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function GoDiscoverPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [dealsList, setDealsList] = useState<GoDeal[]>(GO_CATALOG_DEALS);
  const [selectedDeal, setSelectedDeal] = useState<GoDeal | null>(null);
  const [customer, setCustomer] = useState<GoCustomerProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'claimed' | 'savings'>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [showGoCardPass, setShowGoCardPass] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    const cust = getActiveCustomer();
    if (cust) setCustomer(cust);

    // Fetch dynamic deals from database (/api/deals)
    fetch('/api/deals')
      .then(res => (res.ok ? res.json() : null))
      .then(apiDeals => {
        if (Array.isArray(apiDeals) && apiDeals.length > 0) {
          const mappedDbDeals: GoDeal[] = apiDeals.map((d: any) => ({
            id: d.id,
            brand: d.brand?.name || 'Partner Brand',
            area: d.brand?.city || 'Mumbai',
            offer: d.offerTitle || `${d.offerPercentage}% Off`,
            meta: d.brand?.category || 'Exclusive Privileges',
            badge: d.featured ? 'FEATURED' : 'VERIFIED',
            category: d.brand?.category || 'Dining',
            image: d.heroImageUrl || d.brand?.logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&auto=format&fit=crop&q=80',
            price: d.offerPercentage ? `${d.offerPercentage}% Off` : 'Special Offer',
            savingsAmount: Math.round(Number(d.offerPercentage || 15) * 20),
            pointsReward: 50,
            terms: 'Show your Metro Cardz Gold card to redeem this deal at partner outlet.'
          }));
          const dbIds = new Set(mappedDbDeals.map(x => x.id));
          const existingFiltered = GO_CATALOG_DEALS.filter(x => !dbIds.has(x.id));
          setDealsList([...mappedDbDeals, ...existingFiltered]);
        }
      })
      .catch(() => {});

    // Brief delay to let skeleton show
    const t = setTimeout(() => setPageLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleSignOut = () => {
    logoutCustomer();
    setCustomer(null);
    setSelectedDeal(null);
    setActiveTab('all');
    setAuthSuccess(false);
    showToast('Signed out successfully', 'info');
  };

  const handleAuthSuccess = (authenticatedCustomer: GoCustomerProfile) => {
    setCustomer(authenticatedCustomer);
    setAuthModalOpen(false);
    setAuthSuccess(true);
    showToast(`Welcome back, ${authenticatedCustomer.name}! You now have full member access.`);
    // Sync with server API
    fetch('/api/v1/go/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authenticatedCustomer),
    }).catch(() => {});
  };

  const filteredDeals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dealsList.filter((deal) => {
      const matchCat = activeCategory === 'All' || deal.category === activeCategory;
      const matchSearch =
        !q ||
        deal.brand.toLowerCase().includes(q) ||
        deal.offer.toLowerCase().includes(q) ||
        deal.area.toLowerCase().includes(q) ||
        deal.meta.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, search, dealsList]);

  const handleClaim = async (deal: GoDeal) => {
    if (!customer) {
      setSelectedDeal(deal);
      setAuthModalOpen(true);
      return;
    }
    setClaimingId(deal.id);
    // small artificial delay for UX feedback
    await new Promise((r) => setTimeout(r, 600));
    const result = claimDealForCustomer(customer, deal);
    setCustomer({ ...result.customer });
    setClaimingId(null);
    showToast(result.message);

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
  };

  const remainingCount = getRemainingOffersCount(customer);
  const claimedCount = customer?.claimedOffers.length || 0;
  const claimedMap = useMemo(() => {
    const map = new Map<string, GoClaimedOffer>();
    if (customer?.claimedOffers) {
      for (const c of customer.claimedOffers) map.set(c.dealId, c);
    }
    return map;
  }, [customer]);

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.text, fontFamily: '"Inter", system-ui, sans-serif' }}>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes go-spin { to { transform: rotate(360deg); } }
        @keyframes go-pulse { 0%,100% { opacity:1; } 50% { opacity:.45; } }
        @keyframes go-fadeSlide { from { opacity:0; transform:translateX(-50%) translateY(-8px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes go-scaleIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        .go-btn-active:active { transform: scale(0.97); }
        .go-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(15,23,42,.10); }
      `}</style>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div style={{ maxWidth: 520, margin: '0 auto', paddingBottom: 88, position: 'relative' }}>

        {/* ── Sticky Header ──────────────────────────────────────────────── */}
        <header
          role="banner"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div style={{ padding: '12px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Link href="/go" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }} aria-label="Metro Cardz GO home">
              <div style={{
                width: 38, height: 38, borderRadius: T.radMd,
                background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 16,
                boxShadow: '0 4px 12px rgba(234,88,12,0.22)', flexShrink: 0,
              }}>
                M
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.025em', color: T.text }}>Metro Cardz GO</div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textLight, marginTop: 1 }}>Exclusive Deals</div>
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {customer ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    background: T.primaryBg, border: `1px solid #FFEDD5`, color: T.primaryDark,
                    padding: '6px 12px', borderRadius: T.radPill, fontWeight: 700, fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 5, minHeight: 34,
                  }}>
                    <IconCheck size={12} color={T.primaryDark} />
                    <span>{customer.name}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    className="go-btn-active"
                    style={{
                      border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted,
                      padding: '6px 12px', borderRadius: T.radPill, fontWeight: 600, fontSize: 12,
                      cursor: 'pointer', minHeight: 34, transition: 'all 0.15s',
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  aria-label="Authenticate membership"
                  className="go-btn-active"
                  style={{
                    border: 'none', background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                    borderRadius: T.radPill, padding: '9px 16px', color: '#fff', fontWeight: 700,
                    fontSize: 12, cursor: 'pointer', boxShadow: '0 2px 10px rgba(234,88,12,.25)',
                    display: 'flex', alignItems: 'center', gap: 6, minHeight: 38,
                    transition: 'all 0.15s',
                  }}
                >
                  <IconLock size={14} color="#fff" />
                  <span>Authenticate</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ── Auth Success Banner ─────────────────────────────────────────── */}
        {authSuccess && customer && (
          <div style={{
            margin: '12px 16px 0',
            background: T.successBg,
            border: `1.5px solid #A7F3D0`,
            borderRadius: T.radLg,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'go-scaleIn 0.3s ease',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', background: T.success,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <IconCheck size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#065F46' }}>Membership Verified!</div>
              <div style={{ fontSize: 12, color: '#047857', marginTop: 1 }}>
                Welcome back, {customer.name}. Your member code <strong>{customer.memberCode}</strong> is active.
              </div>
            </div>
            <button
              onClick={() => setAuthSuccess(false)}
              aria-label="Dismiss"
              style={{ marginLeft: 'auto', border: 'none', background: 'none', color: T.textLight, cursor: 'pointer', padding: 4, flexShrink: 0 }}
            >
              <IconClose size={14} />
            </button>
          </div>
        )}

        {/* ── Main Body ──────────────────────────────────────────────────── */}
        <main style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Membership Gate / Stats Card ───────────────────────────── */}
          {!customer ? (
            <section
              style={{
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                border: `1.5px solid #FDBA74`,
                borderRadius: T.radXl,
                padding: '18px 16px',
                boxShadow: '0 4px 14px rgba(234,88,12,.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: T.radMd, background: T.primaryDark,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <IconLock size={20} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#9A3412', letterSpacing: '-0.02em' }}>
                    Offers are Member-Protected
                  </div>
                  <p style={{ margin: '4px 0 14px', fontSize: 13, color: '#7C2D12', lineHeight: 1.5 }}>
                    Exclusive deals are claimable only after authenticating your membership and verifying your registered identity.
                  </p>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="go-btn-active"
                    style={{
                      border: 'none',
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                      color: '#fff', padding: '11px 20px', borderRadius: T.radMd,
                      fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(234,88,12,.28)',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      minHeight: 44, transition: 'all 0.15s',
                    }}
                  >
                    <span>Authenticate Membership</span>
                    <IconArrowRight size={14} color="#fff" />
                  </button>
                </div>
              </div>
            </section>
          ) : (
            /* ── Live Customer Statistics Card ─────────────────────────── */
            <section style={{
              background: T.surface,
              border: `1.5px solid #FFEDD5`,
              borderRadius: T.radXl,
              padding: '16px',
              boxShadow: '0 4px 18px rgba(234,88,12,.07)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.primaryDark, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {customer.tier} · {customer.memberCode}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginTop: 2, letterSpacing: '-0.02em' }}>
                    Welcome, {customer.name}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setShowGoCardPass(!showGoCardPass)}
                    aria-label={showGoCardPass ? 'Hide digital pass' : 'Show digital pass'}
                    className="go-btn-active"
                    style={{
                      background: showGoCardPass ? T.primary : T.surface,
                      color: showGoCardPass ? '#fff' : T.primary,
                      border: `1.5px solid ${showGoCardPass ? T.primary : '#FDBA74'}`,
                      borderRadius: T.radPill, padding: '6px 12px',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all 0.15s', minHeight: 34,
                    }}
                  >
                    <IconCard size={13} color={showGoCardPass ? '#fff' : T.primary} />
                    <span>{showGoCardPass ? 'Hide Pass' : 'My Pass'}</span>
                  </button>
                  <div style={{
                    background: T.successBg, border: `1px solid #A7F3D0`, color: T.success,
                    padding: '5px 10px', borderRadius: T.radPill, fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <IconCheck size={11} color={T.success} />
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              {/* 3D Flip Card */}
              {showGoCardPass && (
                <div style={{ marginBottom: 14, animation: 'go-scaleIn 0.25s ease' }}>
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
                  <p style={{
                    textAlign: 'center', fontSize: 11, color: T.textLight,
                    fontWeight: 600, marginTop: 6, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}>
                    <IconTap size={12} color={T.textLight} />
                    <span>Tap card to flip · Scannable voucher on back</span>
                  </p>
                </div>
              )}

              {/* 2×2 Stat Grid (mobile-safe — no 4-col overflow) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[
                  { label: 'Points', value: customer.points.toLocaleString(), color: T.primary, valueStyle: {} },
                  { label: 'Saved', value: `₹${customer.totalSavedMoney.toLocaleString()}`, color: T.success, valueStyle: {} },
                  { label: 'Claimed', value: String(claimedCount), color: '#2563EB', valueStyle: {} },
                  { label: 'Remaining', value: String(remainingCount), color: '#7C3AED', valueStyle: {} },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      background: T.surface2, borderRadius: T.radMd, padding: '12px 14px',
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginBottom: 4, letterSpacing: '0.03em' }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Tab Bar (only when logged in) ──────────────────────────── */}
          {customer && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              background: T.surface3, borderRadius: T.radMd, padding: 4, gap: 4,
            }}>
              {([
                { id: 'all', label: `All (${GO_CATALOG_DEALS.length})` },
                { id: 'claimed', label: `Claimed (${claimedCount})` },
                { id: 'savings', label: 'Savings' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                  style={{
                    border: 'none',
                    background: activeTab === tab.id ? T.surface : 'transparent',
                    color: activeTab === tab.id ? T.primaryDark : T.textMuted,
                    fontWeight: activeTab === tab.id ? 800 : 600,
                    fontSize: 12, padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                    boxShadow: activeTab === tab.id ? T.shadowSm : 'none',
                    transition: 'all 0.15s', minHeight: 40,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* ── TAB 1: ALL DEALS ───────────────────────────────────────── */}
          {activeTab === 'all' && (
            <>
              {/* Search */}
              <section>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: T.surface, border: `1.5px solid ${T.border}`,
                  borderRadius: T.radLg, padding: '10px 14px',
                  boxShadow: T.shadowSm, minHeight: 48,
                }}>
                  <IconSearch size={16} color={T.textLight} />
                  <input
                    type="search"
                    placeholder="Search restaurant, resort, water park..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search deals"
                    style={{
                      flex: 1, border: 'none', outline: 'none',
                      fontSize: 16, // 16px prevents iOS auto-zoom
                      fontFamily: 'inherit', color: T.text, background: 'transparent',
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                      style={{ border: 'none', background: 'none', color: T.textLight, cursor: 'pointer', padding: 4, display: 'flex', minWidth: 28, minHeight: 28, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <IconClose size={14} />
                    </button>
                  )}
                </div>
              </section>

              {/* Category Pills */}
              <section>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        aria-pressed={isActive}
                        className="go-btn-active"
                        style={{
                          border: isActive ? `1.5px solid ${T.primaryDark}` : `1px solid ${T.border}`,
                          background: isActive ? T.primaryBg : T.surface,
                          color: isActive ? T.primaryDark : T.textMuted,
                          padding: '9px 16px', borderRadius: T.radPill,
                          fontWeight: isActive ? 700 : 600, fontSize: 13,
                          whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
                          minHeight: 38, transition: 'all 0.15s',
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Deals List Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textLight, fontWeight: 700 }}>
                  {customer ? 'Member Deals' : 'Deals Preview'}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>
                  {customer ? `${remainingCount} to claim` : 'Auth to unlock'}
                </span>
              </div>

              {/* Deals Feed */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!pageLoaded ? (
                  [1, 2, 3].map((i) => <SkeletonCard key={i} />)
                ) : filteredDeals.length === 0 ? (
                  <div style={{
                    background: T.surface2, border: `1.5px dashed ${T.border}`,
                    borderRadius: T.radXl, padding: '36px 20px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 13, color: T.textMuted }}>No deals match your search.</div>
                    <button onClick={() => { setSearch(''); setActiveCategory('All'); }}
                      style={{ marginTop: 12, background: 'none', border: `1px solid ${T.border}`, borderRadius: T.radMd, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: T.primary, fontWeight: 700 }}>
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  filteredDeals.map((deal) => {
                    const claimedItem = claimedMap.get(deal.id);
                    const isClaimed = Boolean(claimedItem);
                    const isClaiming = claimingId === deal.id;

                    return (
                      <article
                        key={deal.id}
                        className="go-card-hover"
                        style={{
                          background: T.surface, border: `1px solid ${T.border}`,
                          borderRadius: T.radXl, overflow: 'hidden',
                          boxShadow: T.shadowSm, transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                      >
                        {/* Image */}
                        <div style={{ position: 'relative', height: 160, background: '#1E293B' }}>
                          <img
                            src={deal.image}
                            alt={deal.brand}
                            style={{
                              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                              filter: !customer ? 'blur(2px) brightness(0.85)' : 'none',
                            }}
                          />
                          {/* Badge */}
                          <div style={{
                            position: 'absolute', top: 10, left: 10,
                            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                            borderRadius: T.radPill, padding: '4px 10px',
                            fontSize: 11, fontWeight: 700, color: T.primaryDark,
                          }}>
                            {deal.badge}
                          </div>

                          {/* Member code badge on every card */}
                          {customer && (
                            <div style={{
                              position: 'absolute', top: 10, right: 10,
                              background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)',
                              borderRadius: T.radPill, padding: '4px 8px',
                              fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.04em',
                            }}>
                              {customer.memberCode}
                            </div>
                          )}

                          {/* Lock overlay for unauthenticated */}
                          {!customer && (
                            <div style={{
                              position: 'absolute', inset: 0, background: 'rgba(15,23,42,.5)',
                              display: 'flex', flexDirection: 'column', alignItems: 'center',
                              justifyContent: 'center', gap: 8,
                            }}>
                              <div style={{
                                width: 44, height: 44, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <IconLock size={22} color="#fff" />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>
                                MEMBER ACCESS ONLY
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ padding: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: T.textLight, fontSize: 11, fontWeight: 500 }}>
                                {deal.area} · {deal.category}
                              </div>
                              <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginTop: 2, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                {deal.brand}
                              </div>
                            </div>
                            <div style={{
                              background: T.primaryBg, border: `1px solid #FFEDD5`,
                              borderRadius: T.radPill, color: T.primaryDark,
                              padding: '5px 10px', fontWeight: 700, fontSize: 12, flexShrink: 0,
                            }}>
                              {customer ? deal.price : 'Members Only'}
                            </div>
                          </div>

                          <p style={{ margin: '10px 0 8px', fontWeight: 700, fontSize: 14, color: '#1F2937', lineHeight: 1.4 }}>
                            {deal.offer}
                          </p>

                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.surface3}`, gap: 8,
                          }}>
                            <div style={{ fontSize: 12, color: T.success, fontWeight: 700, flex: 1 }}>
                              {customer
                                ? `Saves ₹${deal.savingsAmount} · +${deal.pointsReward} pts`
                                : 'Sign in to see savings'}
                            </div>

                            {!customer ? (
                              <button
                                onClick={() => { setSelectedDeal(deal); setAuthModalOpen(true); }}
                                aria-label={`Unlock offer: ${deal.brand}`}
                                className="go-btn-active"
                                style={{
                                  background: T.primaryDark, color: '#fff', border: 'none',
                                  borderRadius: T.radMd, padding: '9px 14px', fontSize: 12,
                                  fontWeight: 700, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  minHeight: 38, flexShrink: 0, transition: 'all 0.15s',
                                }}
                              >
                                <IconLock size={12} color="#fff" />
                                <span>Unlock</span>
                              </button>
                            ) : isClaimed ? (
                              <button
                                onClick={() => setSelectedDeal(deal)}
                                aria-label={`View claimed offer: ${deal.brand}`}
                                className="go-btn-active"
                                style={{
                                  background: T.success, color: '#fff', border: 'none',
                                  borderRadius: T.radMd, padding: '9px 14px', fontSize: 12,
                                  fontWeight: 700, cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  minHeight: 38, flexShrink: 0,
                                }}
                              >
                                <IconCheck size={12} />
                                <span>Claimed</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleClaim(deal)}
                                disabled={isClaiming}
                                aria-label={`Claim offer: ${deal.brand}`}
                                className="go-btn-active"
                                style={{
                                  background: isClaiming ? '#F97316' : 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                                  color: '#fff', border: 'none', borderRadius: T.radMd,
                                  padding: '9px 14px', fontSize: 12, fontWeight: 700,
                                  cursor: isClaiming ? 'not-allowed' : 'pointer',
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  boxShadow: '0 4px 12px rgba(234,88,12,.22)',
                                  minHeight: 38, flexShrink: 0, transition: 'all 0.15s',
                                  opacity: isClaiming ? 0.85 : 1,
                                }}
                              >
                                {isClaiming ? <Spinner size={14} /> : <IconArrowRight size={13} />}
                                <span>{isClaiming ? 'Claiming...' : 'Claim Pass'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            </>
          )}

          {/* ── TAB 2: MY CLAIMED OFFERS ────────────────────────────────── */}
          {activeTab === 'claimed' && customer && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>
                  My Passes ({claimedCount})
                </h2>
                <span style={{ fontSize: 12, color: T.textMuted }}>Show voucher at venue</span>
              </div>

              {customer.claimedOffers.length === 0 ? (
                <div style={{
                  background: T.surface2, border: `1.5px dashed ${T.border}`,
                  borderRadius: T.radXl, padding: '36px 20px', textAlign: 'center',
                }}>
                  <div style={{ width: 48, height: 48, background: T.surface3, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <IconCard size={22} color={T.textLight} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#334155' }}>No passes claimed yet</div>
                  <p style={{ fontSize: 13, color: T.textMuted, margin: '4px 0 16px' }}>
                    Browse {GO_CATALOG_DEALS.length} member-exclusive deals.
                  </p>
                  <button
                    onClick={() => setActiveTab('all')}
                    className="go-btn-active"
                    style={{
                      background: T.primaryDark, color: '#fff', border: 'none',
                      borderRadius: T.radMd, padding: '10px 20px', fontSize: 13,
                      fontWeight: 700, cursor: 'pointer', minHeight: 44,
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
                      background: T.surface, border: `1.5px solid #A7F3D0`,
                      borderRadius: T.radXl, padding: 16,
                      boxShadow: '0 4px 14px rgba(5,150,105,.07)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.success, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {claim.category} · {claim.area}
                        </span>
                        <h3 style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
                          {claim.brand}
                        </h3>
                      </div>
                      <span style={{
                        background: T.successBg, color: T.success, borderRadius: T.radPill,
                        padding: '4px 10px', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <IconCheck size={10} color={T.success} />
                        Active
                      </span>
                    </div>

                    <div style={{ margin: '8px 0', fontSize: 14, fontWeight: 700, color: '#374151' }}>
                      {claim.offer}
                    </div>

                    {/* Member code visible on every claim card */}
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>
                      Member Code: <strong style={{ color: T.text }}>{customer.memberCode}</strong>
                    </div>

                    {/* Voucher Box */}
                    <div style={{
                      background: '#F0FDF4', border: '1.5px dashed #86EFAC',
                      borderRadius: T.radMd, padding: '12px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, color: '#166534', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Voucher Redemption Code
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: T.success, letterSpacing: '0.18em', marginTop: 4 }}>
                        {claim.voucherCode}
                      </div>
                      <div style={{ fontSize: 10, color: '#166534', marginTop: 4, fontWeight: 600 }}>
                        Saved ₹{claim.savingsAmount} · Claimed {new Date(claim.claimedAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {/* ── TAB 3: SAVINGS LOG ──────────────────────────────────────── */}
          {activeTab === 'savings' && customer && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Summary banner */}
              <div style={{
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                borderRadius: T.radXl, padding: '20px',
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Total Member Savings
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '6px 0 2px', letterSpacing: '-0.03em' }}>
                  ₹{customer.totalSavedMoney.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                  {customer.points} loyalty points across {claimedCount} claimed offers
                </div>
              </div>

              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.text }}>Transaction History</h3>

              {customer.savingsHistory.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                  No savings recorded yet. Claim offers to start saving!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {customer.savingsHistory.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: T.surface, border: `1px solid ${T.border}`,
                        borderRadius: T.radMd, padding: '12px 14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: T.text, letterSpacing: '-0.01em' }}>{item.brand}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                          {item.offer} · {new Date(item.date).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: T.success }}>+₹{item.savingsAmount}</div>
                        <div style={{ fontSize: 10, color: T.primary, fontWeight: 700, marginTop: 1 }}>+{item.pointsEarned} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* ── Deal Detail Bottom Sheet ────────────────────────────────── */}
        {selectedDeal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedDeal.brand} deal details`}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}
            onClick={() => setSelectedDeal(null)}
          >
            <div
              style={{
                width: '100%', maxWidth: 520, background: T.surface,
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                padding: '0 0 32px',
                boxShadow: '0 -12px 40px rgba(0,0,0,0.18)',
                animation: 'go-scaleIn 0.22s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border }} />
              </div>

              <div style={{ padding: '14px 20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, color: T.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {selectedDeal.category} · {selectedDeal.area}
                    </span>
                    <h2 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.025em' }}>
                      {selectedDeal.brand}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedDeal(null)}
                    aria-label="Close"
                    style={{
                      background: T.surface3, border: 'none', borderRadius: '50%',
                      width: 36, height: 36, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <IconClose size={16} color={T.textMuted} />
                  </button>
                </div>

                {/* Offer highlight */}
                <div style={{
                  background: T.primaryBg, border: `1px solid #FFEDD5`,
                  borderRadius: T.radMd, padding: '14px 16px', marginBottom: 14,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.primaryDark, marginBottom: 4 }}>
                    {selectedDeal.offer}
                  </div>
                  <div style={{ fontSize: 12, color: '#9A3412' }}>
                    {selectedDeal.meta} · Saves ₹{selectedDeal.savingsAmount} · +{selectedDeal.pointsReward} points
                  </div>
                </div>

                {/* T&C */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Terms & Conditions
                  </div>
                  <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.55 }}>
                    {selectedDeal.terms}
                  </div>
                </div>

                {/* CTA */}
                {!customer ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      onClick={() => { setAuthModalOpen(true); }}
                      className="go-btn-active"
                      style={{
                        width: '100%', height: 52, border: 'none', borderRadius: T.radMd,
                        background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                        color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                        boxShadow: T.glowOrange, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 8,
                      }}
                    >
                      <IconLock size={16} color="#fff" />
                      Authenticate Membership to Claim
                    </button>
                    <p style={{ fontSize: 11, textAlign: 'center', color: T.textMuted, margin: 0 }}>
                      Requires verified membership card or mobile identity.
                    </p>
                  </div>
                ) : claimedMap.has(selectedDeal.id) ? (
                  <div style={{
                    background: T.successBg, border: `1px solid #A7F3D0`,
                    borderRadius: T.radMd, padding: '16px', textAlign: 'center',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconCheck size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.success }}>
                      Voucher: {claimedMap.get(selectedDeal.id)?.voucherCode}
                    </div>
                    <div style={{ fontSize: 11, color: '#047857', marginTop: 4 }}>
                      Claimed on {new Date(claimedMap.get(selectedDeal.id)!.claimedAt).toLocaleDateString('en-IN')}. Show at counter.
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { handleClaim(selectedDeal); setSelectedDeal(null); }}
                    disabled={claimingId === selectedDeal.id}
                    className="go-btn-active"
                    style={{
                      width: '100%', height: 52, border: 'none', borderRadius: T.radMd,
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
                      color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                      boxShadow: T.glowOrange, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 8,
                    }}
                  >
                    {claimingId === selectedDeal.id ? <Spinner size={18} /> : <IconArrowRight size={16} />}
                    Claim Member Pass (+{selectedDeal.pointsReward} Points)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom Nav (SVG icons, no emojis) ───────────────────────── */}
        <nav
          aria-label="Main navigation"
          style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 520,
            background: 'rgba(255,255,255,0.97)',
            borderTop: `1px solid ${T.border}`,
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', zIndex: 40,
          }}
        >
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            height: 60, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
            {[
              { label: 'Home', href: '/go', icon: (a: boolean) => <IconHome size={22} active={a} /> },
              { label: 'Explore', href: '/go/discover', icon: (a: boolean) => <IconCompass size={22} active={a} /> },
              { label: 'My Pass', href: '/go/login', icon: (a: boolean) => <IconBadge size={22} active={a} /> },
            ].map((item) => {
              const isActive = item.href === '/go/discover';
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', textDecoration: 'none',
                    color: isActive ? T.primary : T.textMuted, gap: 3,
                    minHeight: 44, padding: '0 8px',
                  }}
                >
                  {item.icon(isActive)}
                  <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: '0.04em' }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Auth Modal */}
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
