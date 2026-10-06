'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/deals/BottomNav';

// â”€â”€â”€ Design Tokens (Light theme only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {
  bg:           '#FFFFFF',
  surface:      '#F9F9F9',
  card:         '#FFFFFF',
  border:       '#E8E8E8',
  borderActive: '#F97316',
  text:         '#1A1A1A',
  textMuted:    '#6B6B6B',
  textLight:    '#9B9B9B',
  orange:       '#F97316',
  orangeLight:  '#FFF7F0',
  orangeDark:   '#EA6500',
  green:        '#16A34A',
  navBg:        'rgba(255,255,255,0.97)',
  inputBg:      '#F5F5F5',
  shadow:       '0 1px 4px rgba(0,0,0,0.06)',
  shadowMd:     '0 4px 16px rgba(0,0,0,0.08)',
};

// â”€â”€â”€ Static Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORIES = [
  { id: 1, name: 'Water Parks',     slug: 'waterparks',    icon: 'WP', tag: 'Up to 40% Off',  count: 6,  brands: "Imagicaa, Wet'nJoy, Water Kingdom" },
  { id: 2, name: 'Gaming & Ent.',   slug: 'gaming',        icon: 'GE', tag: '25% Off',         count: 8,  brands: 'Smaaash, Timezone, VR Zone' },
  { id: 3, name: 'Movies',          slug: 'movies',        icon: 'MV', tag: 'Buy 1 Get 1',     count: 4,  brands: 'PVR INOX, Cinepolis' },
  { id: 4, name: 'Fine Dining',     slug: 'dining',        icon: 'FD', tag: 'Up to 30% Off',   count: 14, brands: 'Bastian, Tresind, Social' },
  { id: 5, name: 'Cafes',           slug: 'cafes',         icon: 'CF', tag: '20% Off',         count: 9,  brands: 'Blue Tokai, Subko, Araku' },
  { id: 6, name: 'Events',          slug: 'events',        icon: 'EV', tag: 'VIP Access',      count: 5,  brands: 'Sunburn, Comedy Factory' },
  { id: 7, name: 'Resorts & Stays', slug: 'resorts',       icon: 'RS', tag: 'Member Rates',    count: 11, brands: 'The Machan, Saj Regency' },
  { id: 8, name: 'Hill Stations',   slug: 'hill-stations', icon: 'HS', tag: 'Weekend Deal',    count: 7,  brands: 'Lonavala, Matheran, Alibaug' },
];

const FEATURED_OFFERS = [
  { id: 1, brand: 'Imagicaa',       tag: 'TODAY',   offer: '40% Off Tickets',    sub: 'Theme + Water Park combo', endHours: 18, url: 'https://imagicaa.com' },
  { id: 2, brand: 'Bastian Mumbai', tag: 'FLASH',   offer: 'Rs 500 Off Dining',  sub: 'Min bill Rs 2,500',        endHours: 5,  url: 'https://bastianmumbai.com' },
  { id: 3, brand: 'The Machan',     tag: 'WEEKEND', offer: 'Stay + Breakfast',   sub: 'From Rs 4,999/night',      endHours: 48, url: 'https://themachan.com' },
];

// â”€â”€â”€ Shared input style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const inp: React.CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: '10px',
  background: C.inputBg, border: `1.5px solid ${C.border}`,
  color: C.text, fontSize: '16px', outline: 'none',
  fontFamily: '"Inter", sans-serif', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const btn: React.CSSProperties = {
  width: '100%', padding: '14px', background: C.orange,
  border: 'none', borderRadius: '10px', color: '#fff',
  fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  fontFamily: '"Inter", sans-serif', transition: 'background 0.2s',
};

// â”€â”€â”€ Auth Screen (full-page gate) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AuthScreen({ onSuccess }: { onSuccess: (name: string) => void }) {
  const [step, setStep]             = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState('');
  const [name, setName]             = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [sessionId, setSessionId]   = useState('');
  const [countdown, setCountdown]   = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/v1/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'send_otp', phone: digits }),
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
      const res  = await fetch('/api/v1/auth/register', {
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

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '42px', height: '42px', background: C.orange, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px', fontFamily: '"Syne", sans-serif' }}>M</span>
            </div>
            <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 800, color: C.text }}>Metro Cardz</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '99px', padding: '5px 14px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.green, display: 'inline-block' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: C.green, letterSpacing: '0.06em' }}>NFC CARD DETECTED</span>
          </div>
        </div>

        {/* Form card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '32px 28px', boxShadow: C.shadowMd }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 800, color: C.text, margin: '0 0 6px' }}>
            {step === 'phone' ? 'Verify Your Number' : 'Enter OTP'}
          </h1>
          <p style={{ fontSize: '14px', color: C.textMuted, margin: '0 0 28px', lineHeight: 1.6 }}>
            {step === 'phone'
              ? 'Enter your mobile number to access exclusive Metro Cardz deals.'
              : `OTP sent to +91-${phone.replace(/\D/g, '').slice(-10).replace(/(\d{5})(\d{5})/, '*****$2')}`}
          </p>

          {step === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ ...inp, width: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, fontWeight: 600, fontSize: '14px' }}>+91</div>
                <input style={inp} type="tel" placeholder="10-digit mobile number" value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }} maxLength={10} autoFocus />
              </div>
              {error && <p style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>{error}</p>}
              <button style={btn} onClick={sendOtp} disabled={loading}
                onMouseEnter={e => (e.currentTarget.style.background = C.orangeDark)}
                onMouseLeave={e => (e.currentTarget.style.background = C.orange)}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '12px', color: C.textLight, margin: 0 }}>
                By continuing you agree to our{' '}
                <Link href="/terms-and-conditions" style={{ color: C.orange, textDecoration: 'none' }}>Terms</Link>
                {' & '}
                <Link href="/privacy-policy" style={{ color: C.orange, textDecoration: 'none' }}>Privacy Policy</Link>
              </p>
            </div>
          )}

          {step === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: C.textMuted, display: 'block', marginBottom: '6px' }}>Your Name (for membership card)</label>
                <input style={inp} type="text" placeholder="Full Name" value={name}
                  onChange={e => { setName(e.target.value); setError(''); }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: C.textMuted, display: 'block', marginBottom: '6px' }}>6-Digit OTP</label>
                <input style={{ ...inp, letterSpacing: '0.5em', fontSize: '24px', textAlign: 'center', fontWeight: 700 }}
                  type="number" placeholder="------" value={otp}
                  onChange={e => { setOtp(e.target.value.slice(0, 6)); setError(''); }} maxLength={6} autoFocus />
              </div>
              {error && <p style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>{error}</p>}
              <button style={btn} onClick={verifyOtp} disabled={loading}
                onMouseEnter={e => (e.currentTarget.style.background = C.orangeDark)}
                onMouseLeave={e => (e.currentTarget.style.background = C.orange)}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep('phone')}
                  style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: '13px', cursor: 'pointer', padding: 0 }}>
                  Change number
                </button>
                <button onClick={sendOtp} disabled={countdown > 0}
                  style={{ background: 'none', border: 'none', color: countdown > 0 ? C.textLight : C.orange, fontSize: '13px', cursor: countdown > 0 ? 'default' : 'pointer', padding: 0 }}>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Offer Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OfferModal({ offer, onClose }: { offer: typeof FEATURED_OFFERS[0]; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: '100%', maxWidth: '480px', background: C.card, borderRadius: '20px 20px 0 0', padding: '28px 24px 48px', border: `1px solid ${C.border}` }}>
        <div style={{ width: '36px', height: '3px', background: C.border, borderRadius: '2px', margin: '0 auto 24px' }} />

        <span style={{ display: 'inline-block', background: C.orangeLight, color: C.orange, border: `1px solid ${C.borderActive}`, borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '16px' }}>
          {offer.tag}
        </span>

        <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>{offer.offer}</h2>
        <p style={{ fontSize: '14px', color: C.textMuted, margin: '0 0 4px' }}>{offer.brand}</p>
        <p style={{ fontSize: '13px', color: C.textLight, margin: '0 0 24px' }}>{offer.sub}</p>

        <div style={{ background: C.surface, borderRadius: '10px', padding: '16px', marginBottom: '24px', border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: C.textMuted, marginBottom: '8px', letterSpacing: '0.04em' }}>HOW TO AVAIL</div>
          <ol style={{ fontSize: '13px', color: C.text, lineHeight: 1.8, paddingLeft: '16px', margin: 0 }}>
            <li>Click "Avail Offer" below to visit the partner website.</li>
            <li>Show your Metro Cardz Gold card or mention "Metro Cardz Member".</li>
            <li>Enjoy your exclusive member discount.</li>
          </ol>
        </div>

        <a href={offer.url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', width: '100%', padding: '14px', background: C.orange, borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 700, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box', fontFamily: '"Inter", sans-serif' }}>
          Avail Offer â€” Visit Website
        </a>

        <button onClick={onClose}
          style={{ width: '100%', marginTop: '10px', padding: '12px', background: 'none', border: `1px solid ${C.border}`, borderRadius: '10px', color: C.textMuted, fontSize: '14px', cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}>
          Close
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function NFCLandingClient({ categories: _categories, featuredDeal: _featuredDeal }: { categories: unknown[]; featuredDeal: unknown }) {
  const router = useRouter();
  const [member, setMember]               = useState<{ name: string } | null>(null);
  const [mounted, setMounted]             = useState(false);
  const [search, setSearch]               = useState('');
  const [selectedOffer, setSelectedOffer] = useState<typeof FEATURED_OFFERS[0] | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('mc_member');
      if (stored) setMember(JSON.parse(stored));
    } catch {}
  }, []);

  if (!mounted) return null;

  // Auth gate â€” show login screen first
  if (!member) {
    return <AuthScreen onSuccess={name => setMember({ name })} />;
  }

  const filteredCats = CATEGORIES.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.brands.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: C.bg, minHeight: '100dvh', color: C.text, fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }}>

      {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: C.navBg, borderBottom: `1px solid ${C.border}`, boxShadow: C.shadow }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', fontWeight: 800, color: C.text }}>Metro Cardz</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.textMuted, fontWeight: 600 }}>EXCLUSIVE DEALS</div>
          </div>

          <div style={{ background: C.orangeLight, border: `1px solid ${C.border}`, borderRadius: '99px', padding: '5px 14px', fontSize: '12px', fontWeight: 600, color: C.orange }}>
            {member.name.split(' ')[0]}
          </div>

          <button onClick={() => { localStorage.removeItem('mc_member'); setMember(null); }}
            style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 10px', fontSize: '12px', color: C.textMuted, cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}>
            Sign out
          </button>
        </div>
      </header>

      {/* â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '0 0 80px' }}>

        {/* NFC Status */}
        <div style={{ margin: '14px 16px 0', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.green, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: C.green }}>Gold Member â€” NFC Card Verified</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: C.textLight, whiteSpace: 'nowrap' }}>450+ offers</span>
        </div>

        {/* Heading + Search */}
        <div style={{ padding: '18px 16px 0' }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', fontWeight: 800, color: C.text, margin: '0 0 4px', lineHeight: 1.2 }}>
            Welcome, {member.name.split(' ')[0]}
          </h1>
          <p style={{ fontSize: '14px', color: C.textMuted, margin: '0 0 18px', lineHeight: 1.6 }}>
            Tap a category to see all offers available to you.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: C.inputBg, border: `1.5px solid ${C.border}`, borderRadius: '10px', padding: '0 14px', height: '46px', marginBottom: '24px' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke={C.textLight} strokeWidth="1.5" />
              <path d="M11 11l2.5 2.5" stroke={C.textLight} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input type="search" placeholder="Search deals, brands..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: '14px', fontFamily: '"Inter", sans-serif' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '16px', padding: 0, lineHeight: 1 }}>
                x
              </button>
            )}
          </div>
        </div>

        {/* â”€â”€ FEATURED DEALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {!search && (
          <div style={{ padding: '0 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: C.textMuted }}>TODAY'S TOP DEALS</span>
              <Link href="/live-offers" style={{ fontSize: '12px', color: C.orange, textDecoration: 'none', fontWeight: 600 }}>See all</Link>
            </div>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {FEATURED_OFFERS.map(deal => (
                <div key={deal.id}
                  style={{ minWidth: '210px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px', flexShrink: 0, cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: C.shadow }}
                  onClick={() => setSelectedOffer(deal)}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.borderActive; (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadowMd; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow; }}>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: C.orangeLight, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: C.orange, fontFamily: '"Syne", sans-serif' }}>
                      {deal.brand.charAt(0)}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', background: C.orangeLight, color: C.orange, border: `1px solid ${C.borderActive}`, borderRadius: '6px', padding: '2px 8px' }}>{deal.tag}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: C.textMuted, marginBottom: '3px' }}>{deal.brand}</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: C.text, marginBottom: '3px', lineHeight: 1.3 }}>{deal.offer}</div>
                  <div style={{ fontSize: '12px', color: C.textLight, marginBottom: '14px' }}>{deal.sub}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: C.textLight }}>Ends in {deal.endHours}h</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: C.orange }}>Avail Offer</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* â”€â”€ CATEGORIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: C.textMuted }}>
              {search ? `RESULTS (${filteredCats.length})` : 'ALL CATEGORIES'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {filteredCats.map(cat => (
              <button key={cat.id}
                onClick={() => router.push(`/category/${cat.slug}`)}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '18px 16px', textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', fontFamily: '"Inter", sans-serif', boxShadow: C.shadow }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderActive; (e.currentTarget as HTMLButtonElement).style.boxShadow = C.shadowMd; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.boxShadow = C.shadow; }}>

                <div style={{ width: '40px', height: '40px', background: C.orangeLight, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: C.orange, fontFamily: '"Syne", sans-serif', marginBottom: '12px' }}>
                  {cat.icon}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '3px', lineHeight: 1.3 }}>{cat.name}</div>
                <div style={{ fontSize: '11px', color: C.textLight, marginBottom: '10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'] }}>{cat.brands}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.orange, background: C.orangeLight, border: `1px solid ${C.borderActive}`, borderRadius: '6px', padding: '2px 8px' }}>{cat.tag}</span>
                  <span style={{ fontSize: '11px', color: C.textLight }}>{cat.count} offers</span>
                </div>
              </button>
            ))}
          </div>

          {filteredCats.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '14px', color: C.textMuted, marginBottom: '8px' }}>No results for &ldquo;{search}&rdquo;</div>
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: C.orange, fontSize: '13px', cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}>Clear search</button>
            </div>
          )}
        </div>
      </main>

      {/* â”€â”€ BOTTOM NAV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: C.navBg, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', height: '58px' }}>
          {[
            { id: 'explore', label: 'Explore',     href: '/go',          active: true },
            { id: 'offers',  label: 'Live Offers',  href: '/live-offers', active: false },
            { id: 'card',    label: 'My Card',      href: '/my-card',     active: false },
          ].map(item => (
            <button key={item.id}
              onClick={() => router.push(item.href)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Inter", sans-serif', borderTop: item.active ? `2px solid ${C.orange}` : '2px solid transparent', transition: 'border-color 0.2s' }}>
              <span style={{ fontSize: '11px', fontWeight: item.active ? 700 : 500, color: item.active ? C.orange : C.textMuted, letterSpacing: '0.02em' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* â”€â”€ OFFER MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {selectedOffer && <OfferModal offer={selectedOffer} onClose={() => setSelectedOffer(null)} />}

      <style>{`
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { display: none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}
