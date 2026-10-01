'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Theme ────────────────────────────────────────────────────────────────────
const DARK = {
  bg:         '#09090B',
  surface:    '#111116',
  card:       '#18181B',
  border:     '#27272A',
  borderGold: '#92741F',
  text:       '#FAFAFA',
  textMuted:  '#71717A',
  textSub:    '#A1A1AA',
  gold:       '#D4AF37',
  goldLight:  '#E5C158',
  goldGlow:   'rgba(212,175,55,0.18)',
  navBg:      'rgba(9,9,11,0.96)',
  inputBg:    '#111116',
  green:      '#22C55E',
  badge:      '#1C1C20',
};

const LIGHT = {
  bg:         '#F8F8F6',
  surface:    '#FFFFFF',
  card:       '#FFFFFF',
  border:     '#E4E4E7',
  borderGold: '#D4AF37',
  text:       '#18181B',
  textMuted:  '#71717A',
  textSub:    '#52525B',
  gold:       '#B8962B',
  goldLight:  '#D4AF37',
  goldGlow:   'rgba(212,175,55,0.12)',
  navBg:      'rgba(248,248,246,0.96)',
  inputBg:    '#F4F4F5',
  green:      '#16A34A',
  badge:      '#F4F4F5',
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 1, name: 'Water Parks',       slug: 'waterparks',    emoji: '🌊', tag: 'UP TO 40% OFF',  count: 6,  brands: "Imagicaa, Wet'nJoy, Water Kingdom" },
  { id: 2, name: 'Gaming & Ent.',     slug: 'gaming',        emoji: '🎮', tag: '25% OFF',        count: 8,  brands: 'Smaaash, Timezone, VR Zone' },
  { id: 3, name: 'Movies',            slug: 'movies',        emoji: '🎬', tag: 'BUY 1 GET 1',    count: 4,  brands: 'PVR INOX, Cinepolis' },
  { id: 4, name: 'Fine Dining',       slug: 'dining',        emoji: '🍽️', tag: 'UP TO 30%',     count: 14, brands: 'Bastian, Tresind, Social' },
  { id: 5, name: 'Cafés',             slug: 'cafes',         emoji: '☕', tag: '20% OFF',        count: 9,  brands: 'Blue Tokai, Subko, Araku' },
  { id: 6, name: 'Events',            slug: 'events',        emoji: '🎵', tag: 'VIP ACCESS',     count: 5,  brands: 'Sunburn, Comedy Factory' },
  { id: 7, name: 'Resorts & Stays',   slug: 'resorts',       emoji: '🏨', tag: 'MEMBER RATES',   count: 11, brands: 'The Machan, Saj Regency' },
  { id: 8, name: 'Hill Stations',     slug: 'hill-stations', emoji: '⛰️', tag: 'WEEKEND DEAL',   count: 7,  brands: 'Lonavala, Matheran, Alibaug' },
];

const CITIES = ['Mumbai', 'Thane', 'Navi Mumbai', 'Lonavala', 'Matheran', 'Mahabaleshwar', 'Alibaug', 'Igatpuri'];

const FEATURED_OFFERS = [
  { id: 1, emoji: '🎢', brand: 'Imagicaa', tag: 'TODAY', offer: '40% OFF Tickets', sub: 'Theme + Water Park combo', endHours: 18 },
  { id: 2, emoji: '🍽️', brand: 'Bastian Mumbai', tag: 'FLASH',  offer: '₹500 OFF Dining', sub: 'Min bill ₹2,500', endHours: 5 },
  { id: 3, emoji: '🏨', brand: 'The Machan Lonavala', tag: 'WEEKEND', offer: 'Stay + Breakfast', sub: 'From ₹4,999/night', endHours: 48 },
];

// ─── Auth Modal Component ─────────────────────────────────────────────────────
function AuthModal({ T, onClose, onSuccess }: { T: typeof DARK; onClose: () => void; onSuccess: (name: string) => void }) {
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const sendOtp = async () => {
    if (phone.replace(/\D/g, '').length !== 10) { setError('Enter a valid 10-digit number'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'send_otp', phone: phone.replace(/\D/g, '') }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Failed to send OTP'); return; }
      setSessionId(data.session_id);
      setStep('otp');
      setCountdown(30);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'verify_otp', session_id: sessionId, otp, name: name || 'Member', consent_marketing: true, consent_whatsapp: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Invalid OTP'); return; }
      localStorage.setItem('mc_member', JSON.stringify({ name: data.user?.name || 'Member', token: data.access_token, id: data.user?.id }));
      onSuccess(data.user?.name || 'Member');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '12px',
    background: T.inputBg, border: `1.5px solid ${T.border}`,
    color: T.text, fontSize: '16px', outline: 'none',
    fontFamily: '"Plus Jakarta Sans", sans-serif', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: '480px', background: T.card, borderRadius: '24px 24px 0 0', padding: '32px 24px 48px', border: `1px solid ${T.border}` }}>
        {/* Handle */}
        <div style={{ width: '40px', height: '4px', background: T.border, borderRadius: '2px', margin: '0 auto 24px' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            {step === 'phone' ? '👋' : step === 'otp' ? '🔐' : '✨'}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: T.text, margin: 0, fontFamily: 'Syne, sans-serif' }}>
            {step === 'phone' ? 'Join Metro Cardz' : step === 'otp' ? 'Verify Your Number' : 'Almost There!'}
          </h2>
          <p style={{ fontSize: '14px', color: T.textMuted, marginTop: '6px' }}>
            {step === 'phone' ? 'Get exclusive deals with your digital membership' :
             step === 'otp'   ? `OTP sent to +91-${phone.slice(-10).replace(/(\d{5})(\d{5})/, '•••••$2')}` :
             'What should we call you?'}
          </p>
        </div>

        {/* Step: Phone */}
        {step === 'phone' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ ...inputStyle, width: '56px', flexShrink: 0, textAlign: 'center', color: T.textMuted, fontSize: '14px' }}>+91</div>
              <input style={inputStyle} type="tel" placeholder="Mobile Number" value={phone}
                onChange={e => { setPhone(e.target.value); setError(''); }} maxLength={10} autoFocus />
            </div>
            {error && <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>{error}</p>}
            <button onClick={sendOtp} disabled={loading}
              style={{ width: '100%', padding: '15px', background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`, border: 'none', borderRadius: '12px', color: '#111', fontSize: '15px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {loading ? 'Sending...' : 'Send OTP →'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: T.textMuted, margin: 0 }}>
              By continuing you agree to our <Link href="/terms-and-conditions" style={{ color: T.gold }}>Terms</Link> & <Link href="/privacy-policy" style={{ color: T.gold }}>Privacy</Link>
            </p>
          </div>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', color: T.textMuted, marginBottom: '4px' }}>Your Name (for your membership card)</p>
              <input style={inputStyle} type="text" placeholder="Full Name" value={name}
                onChange={e => { setName(e.target.value); setError(''); }} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: T.textMuted, marginBottom: '4px' }}>6-Digit OTP</p>
              <input style={{ ...inputStyle, letterSpacing: '0.4em', fontSize: '22px', textAlign: 'center' }}
                type="number" placeholder="• • • • • •" value={otp}
                onChange={e => { setOtp(e.target.value.slice(0,6)); setError(''); }} maxLength={6} autoFocus />
            </div>
            {error && <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>{error}</p>}
            <button onClick={verifyOtp} disabled={loading}
              style={{ width: '100%', padding: '15px', background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`, border: 'none', borderRadius: '12px', color: '#111', fontSize: '15px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {loading ? 'Verifying...' : 'Verify & Join Free →'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: '13px', cursor: 'pointer', padding: 0 }}>← Change number</button>
              <button onClick={sendOtp} disabled={countdown > 0}
                style={{ background: 'none', border: 'none', color: countdown > 0 ? T.textMuted : T.gold, fontSize: '13px', cursor: countdown > 0 ? 'default' : 'pointer', padding: 0 }}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── City Picker Modal ────────────────────────────────────────────────────────
function CityModal({ T, selected, onSelect, onClose }: { T: typeof DARK; selected: string; onSelect: (c: string) => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: T.card, borderRadius: '24px 24px 0 0', padding: '24px 20px 48px', border: `1px solid ${T.border}` }}>
        <div style={{ width: '40px', height: '4px', background: T.border, borderRadius: '2px', margin: '0 auto 20px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: T.text, marginBottom: '16px', fontFamily: 'Syne, sans-serif' }}>Choose City</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {CITIES.map(city => (
            <button key={city} onClick={() => { onSelect(city); onClose(); }}
              style={{ padding: '13px 16px', borderRadius: '12px', background: city === selected ? T.goldGlow : T.surface, border: `1.5px solid ${city === selected ? T.gold : T.border}`, color: city === selected ? T.gold : T.text, fontWeight: city === selected ? 700 : 500, fontSize: '14px', cursor: 'pointer', textAlign: 'left', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              {city === selected ? '✓ ' : ''}{city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function NFCLandingClient({ categories: _categories, featuredDeal: _featuredDeal }: { categories: any[]; featuredDeal: any }) {
  const router = useRouter();
  const [dark, setDark]             = useState(true);
  const [city, setCity]             = useState('Mumbai');
  const [showAuth, setShowAuth]     = useState(false);
  const [showCity, setShowCity]     = useState(false);
  const [member, setMember]         = useState<{ name: string } | null>(null);
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState<'explore' | 'offers' | 'card'>('explore');
  const [mounted, setMounted]       = useState(false);

  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('mc_member');
      if (stored) setMember(JSON.parse(stored));
    } catch {}
  }, []);

  const filteredCats = CATEGORIES.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.brands.toLowerCase().includes(search.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, fontFamily: '"Plus Jakarta Sans", sans-serif', overflowX: 'hidden' }}>

      {/* ── STICKY HEADER ────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: T.navBg, borderBottom: `1px solid ${T.border}`, backdropFilter: 'blur(16px)' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Logo */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 800, color: T.gold, lineHeight: 1 }}>Metro Cardz</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.12em', color: T.textMuted, fontWeight: 600, marginTop: '2px' }}>EXCLUSIVE DEALS</div>
          </div>

          {/* City */}
          <button onClick={() => setShowCity(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '9999px', padding: '7px 12px', color: T.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            📍 {city}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>

          {/* Theme toggle */}
          <button onClick={() => setDark(d => !d)} aria-label="Toggle theme"
            style={{ width: '36px', height: '36px', borderRadius: '50%', background: T.card, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px' }}>
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Auth avatar / login */}
          {member ? (
            <Link href="/my-card" style={{ textDecoration: 'none' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, border: `2px solid ${T.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#111' }}>
                {member.name.charAt(0).toUpperCase()}
              </div>
            </Link>
          ) : (
            <button onClick={() => setShowAuth(true)}
              style={{ padding: '7px 14px', background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`, border: 'none', borderRadius: '9999px', color: '#111', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', whiteSpace: 'nowrap' }}>
              Join Free
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '0 0 80px' }}>

        {/* Hero Section */}
        <div style={{ padding: '20px 16px 0' }}>
          {/* NFC status */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: T.badge, border: `1px solid ${T.borderGold}`, borderRadius: '9999px', padding: '5px 12px', marginBottom: '14px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.green, display: 'inline-block', boxShadow: `0 0 6px ${T.green}` }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: T.gold }}>NFC CARD DETECTED • GOLD MEMBER</span>
          </div>

          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '30px', fontWeight: 800, lineHeight: 1.15, color: T.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            ONE CARD.<br />
            <span style={{ color: T.gold }}>ENDLESS DEALS.</span>
          </h1>
          <p style={{ fontSize: '13px', color: T.textMuted, margin: '0 0 20px', lineHeight: 1.6 }}>
            {member ? `Welcome back, ${member.name}! ` : ''}
            Tap a category to unlock exclusive privileges in {city} & beyond.
          </p>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: T.inputBg, border: `1.5px solid ${T.border}`, borderRadius: '14px', padding: '0 16px', height: '50px', marginBottom: '20px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke={T.textMuted} strokeWidth="1.5"/>
              <path d="M11 11l2.5 2.5" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input type="search" placeholder="Search deals, brands, offers..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: '14px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              aria-label="Search deals" />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: '16px', padding: 0 }}>✕</button>
            )}
          </div>
        </div>

        {/* ── FEATURED FLASH DEALS ─────────────────────────────────────────── */}
        {!search && (
          <div style={{ padding: '0 16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: T.textMuted }}>🔥 TODAY'S TOP DEALS</span>
              <Link href="/live-offers" style={{ fontSize: '12px', color: T.gold, textDecoration: 'none', fontWeight: 600 }}>See all →</Link>
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {FEATURED_OFFERS.map(deal => (
                <div key={deal.id}
                  style={{ minWidth: '200px', background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '14px', flexShrink: 0, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onClick={() => !member ? setShowAuth(true) : router.push('/live-offers')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{deal.emoji}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', background: T.goldGlow, color: T.gold, border: `1px solid ${T.borderGold}`, borderRadius: '9999px', padding: '3px 8px' }}>{deal.tag}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: T.textMuted, marginBottom: '3px' }}>{deal.brand}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '2px' }}>{deal.offer}</div>
                  <div style={{ fontSize: '11px', color: T.textMuted }}>{deal.sub}</div>
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', color: T.textMuted }}>⏱ Ends in {deal.endHours}h</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: T.gold }}>
                      {member ? 'Claim →' : 'Join to Unlock →'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CATEGORY GRID ────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', color: T.textMuted }}>
              {search ? `RESULTS (${filteredCats.length})` : 'ALL CATEGORIES'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {filteredCats.map(cat => (
              <button key={cat.id}
                onClick={() => !member ? setShowAuth(true) : router.push(`/category/${cat.slug}`)}
                style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '16px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s', fontFamily: '"Plus Jakarta Sans", sans-serif', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.gold; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}>
                {/* Background glow */}
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: T.goldGlow, borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{cat.emoji}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: T.text, marginBottom: '3px', lineHeight: 1.2 }}>{cat.name}</div>
                <div style={{ fontSize: '10px', color: T.textMuted, marginBottom: '8px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as any }}>{cat.brands}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: T.gold, background: T.goldGlow, border: `1px solid ${T.borderGold}`, borderRadius: '9999px', padding: '2px 8px' }}>{cat.tag}</span>
                  <span style={{ fontSize: '10px', color: T.textMuted }}>{cat.count} offers</span>
                </div>
                {!member && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '12px', padding: '8px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: T.gold }}>🔒 Join Free</div>
                      <div style={{ fontSize: '10px', color: T.textMuted }}>to unlock</div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── JOIN CTA (if not member) ──────────────────────────────────────── */}
        {!member && (
          <div style={{ margin: '20px 16px 0', background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.borderGold}`, borderRadius: '20px', padding: '24px', textAlign: 'center', boxShadow: `0 0 40px ${T.goldGlow}` }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🥇</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: T.text, margin: '0 0 8px' }}>
              Unlock 450+ Exclusive Deals
            </h3>
            <p style={{ fontSize: '13px', color: T.textMuted, margin: '0 0 20px', lineHeight: 1.6 }}>
              Water parks, dining, gaming, resorts & more — all with your Metro Cardz Gold membership. Free to join.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[['🎢', 'Water Parks'], ['🍽️', 'Dining'], ['🏨', 'Resorts']].map(([e, l]) => (
                <div key={l as string} style={{ background: T.inputBg, borderRadius: '12px', padding: '10px 6px', fontSize: '11px', color: T.textSub, fontWeight: 600 }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{e as string}</div>{l as string}
                </div>
              ))}
            </div>
            <button onClick={() => setShowAuth(true)}
              style={{ width: '100%', padding: '15px', background: `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`, border: 'none', borderRadius: '14px', color: '#111', fontSize: '15px', fontWeight: 800, cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '0.02em' }}>
              Join Free — Unlock All Deals →
            </button>
            <p style={{ fontSize: '11px', color: T.textMuted, marginTop: '8px', margin: '10px 0 0' }}>No credit card • Instant digital card • Free forever</p>
          </div>
        )}
      </main>

      {/* ── BOTTOM NAV (Customer Only — No Admin) ────────────────────────────── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: T.navBg, borderTop: `1px solid ${T.border}`, backdropFilter: 'blur(16px)' }}
        aria-label="Main navigation">
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', height: '64px' }}>
          {[
            { id: 'explore', label: 'EXPLORE', emoji: '🧭', href: '/go' },
            { id: 'offers',  label: 'OFFERS',  emoji: '🔥', href: '/live-offers' },
            { id: 'card',    label: 'MY CARD', emoji: '💳', href: member ? '/my-card' : undefined },
          ].map(item => {
            const isActive = item.id === 'explore';
            return (
              <button key={item.id}
                onClick={() => {
                  if (item.id === 'card' && !member) { setShowAuth(true); return; }
                  if (item.href) router.push(item.href);
                }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif', position: 'relative' }}>
                {isActive && <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '32px', height: '2px', background: T.gold, borderRadius: '0 0 2px 2px', boxShadow: `0 0 8px ${T.gold}` }} />}
                <span style={{ fontSize: '20px' }}>{item.emoji}</span>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: isActive ? T.gold : T.textMuted }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      {showAuth && (
        <AuthModal T={T} onClose={() => setShowAuth(false)}
          onSuccess={name => { setMember({ name }); setShowAuth(false); }} />
      )}
      {showCity && (
        <CityModal T={T} selected={city} onSelect={setCity} onClose={() => setShowCity(false)} />
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}
