'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Unified Design Tokens (Matching Swiggy / CRED / Metro Cardz) ───────────
const T = {
  primary: '#FF6B35',
  primaryDark: '#C2410C',
  primaryBg: '#FFF7ED',
  surface: '#FFFFFF',
  surface2: '#F8FAFC',
  surface3: '#F1F5F9',
  border: '#E2E8F0',
  borderActive: '#FF6B35',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  success: '#059669',
  successBg: '#ECFDF5',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  shadowSm: '0 1px 3px rgba(15,23,42,0.04), 0 2px 6px rgba(15,23,42,0.03)',
  shadowMd: '0 4px 16px rgba(15,23,42,0.08)',
  shadowLg: '0 8px 32px rgba(15,23,42,0.12)',
  glowOrange: '0 8px 24px rgba(255,107,53,0.22)',
  radSm: '8px',
  radMd: '12px',
  radLg: '16px',
  radXl: '20px',
  radPill: '999px',
};

// ─── SVG Icons (Clean 1.8px Stroke, Zero Emojis) ───────────────────────────
function IconNFC({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8.5a7 7 0 0 1 12 0" />
      <path d="M8.5 11.5a3.5 3.5 0 0 1 7 0" />
      <path d="M12 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill={color} />
      <rect x="2" y="4" width="20" height="16" rx="4" />
    </svg>
  );
}

function IconWaterPark({ size = 20, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c1.5-1.5 3.5-1.5 5 0 1.5 1.5 3.5 1.5 5 0 1.5-1.5 3.5-1.5 5 0 1.5 1.5 3.5 1.5 5 0" />
      <path d="M2 17c1.5-1.5 3.5-1.5 5 0 1.5 1.5 3.5 1.5 5 0 1.5-1.5 3.5-1.5 5 0 1.5 1.5 3.5 1.5 5 0" />
      <path d="M12 3v5m-4-3l4-2 4 2" />
    </svg>
  );
}

function IconGaming({ size = 20, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="4" />
      <path d="M6 12h4m-2-2v4m7-2h.01m3-2h.01m-3 4h.01" />
    </svg>
  );
}

function IconMovie({ size = 20, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M7 4v16M17 4v16M2 8h20M2 16h20" />
    </svg>
  );
}

function IconDining({ size = 20, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.66 1.34 3 3 3h0c1.66 0 3-1.34 3-3V2M6 12v10M18 2v20M21 2c0 4-3 5-3 5" />
    </svg>
  );
}

function IconCafe({ size = 20, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 2v3M10 2v3M14 2v3" />
    </svg>
  );
}

function IconEvents({ size = 20, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M8 2v4M16 2v4M2 10h20" />
      <path d="M12 14l1.5 2.5 3-.5-2 2.5.5 3-3-1.5-3 1.5.5-3-2-2.5 3 .5z" />
    </svg>
  );
}

function IconResorts({ size = 20, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h2M13 10h2M9 14h2M13 14h2M9 18h2M13 18h2" />
    </svg>
  );
}

function IconHillStations({ size = 20, color = T.primary }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20l7-12 4 6 3-4 4 10H3z" />
      <path d="M9 14l2-3 2 3" />
    </svg>
  );
}

function IconCompass({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={color} fillOpacity="0.15" />
    </svg>
  );
}

function IconTag({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function IconCard({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="3" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconSearch({ size = 18, color = T.textLight }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconSpinner({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'nfc-spin 0.75s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Categories & Deals Data ────────────────────────────────────────────────
const CATEGORIES = [
  { id: 1, name: 'Water Parks',     slug: 'waterparks',    iconComponent: IconWaterPark,    tag: 'Up to 40% Off',  count: 6,  brands: "Imagicaa, Wet'nJoy, Water Kingdom" },
  { id: 2, name: 'Gaming & Ent.',   slug: 'gaming',        iconComponent: IconGaming,       tag: '25% Off',         count: 8,  brands: 'Smaaash, Timezone, VR Zone' },
  { id: 3, name: 'Movies',          slug: 'movies',        iconComponent: IconMovie,        tag: 'Buy 1 Get 1',     count: 4,  brands: 'PVR INOX, Cinepolis' },
  { id: 4, name: 'Fine Dining',     slug: 'dining',        iconComponent: IconDining,       tag: 'Up to 30% Off',   count: 14, brands: 'Bastian, Tresind, Social' },
  { id: 5, name: 'Cafes',           slug: 'cafes',         iconComponent: IconCafe,         tag: '20% Off',         count: 9,  brands: 'Blue Tokai, Subko, Araku' },
  { id: 6, name: 'Events',          slug: 'events',        iconComponent: IconEvents,       tag: 'VIP Access',      count: 5,  brands: 'Sunburn, Comedy Factory' },
  { id: 7, name: 'Resorts & Stays', slug: 'resorts',       iconComponent: IconResorts,      tag: 'Member Rates',    count: 11, brands: 'The Machan, Saj Regency' },
  { id: 8, name: 'Hill Stations',   slug: 'hill-stations', iconComponent: IconHillStations, tag: 'Weekend Deal',    count: 7,  brands: 'Lonavala, Matheran, Alibaug' },
];

const FEATURED_OFFERS = [
  { id: 1, brand: 'Imagicaa',       tag: 'TODAY',   offer: '40% Off Tickets',    sub: 'Theme + Water Park combo', endHours: 18, url: 'https://imagicaa.com' },
  { id: 2, brand: 'Bastian Mumbai', tag: 'FLASH',   offer: '₹500 Off Dining',    sub: 'Min bill ₹2,500',          endHours: 5,  url: 'https://bastianmumbai.com' },
  { id: 3, brand: 'The Machan',     tag: 'WEEKEND', offer: 'Stay + Breakfast',   sub: 'From ₹4,999/night',        endHours: 48, url: 'https://themachan.com' },
];

// ─── Input & Button Styles (Universal Usability: 16px min font, 44px+ touch) ─
const inputBase: React.CSSProperties = {
  width: '100%',
  height: '48px',
  padding: '0 16px',
  borderRadius: T.radMd,
  background: T.surface2,
  border: `1.5px solid ${T.border}`,
  color: T.text,
  fontSize: '16px', // Rule 2: Prevents iOS auto-zoom
  outline: 'none',
  fontFamily: '"Inter", sans-serif',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const btnPrimary: React.CSSProperties = {
  width: '100%',
  minHeight: '48px', // Rule 2: Apple HIG 44px+ tap target
  padding: '12px 20px',
  background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDark} 100%)`,
  border: 'none',
  borderRadius: T.radMd,
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: '"Inter", sans-serif',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: T.glowOrange,
  transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
};

// ─── Auth Screen (NFC Gate) ──────────────────────────────────────────────────
function AuthScreen({ onSuccess }: { onSuccess: (name: string) => void }) {
  const [step, setStep]           = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState('');
  const [name, setName]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [sessionId, setSessionId] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, ''); // Rule 5: Error prevention
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'send_otp', phone: digits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.message || 'Failed to send verification code');
        return;
      }
      setSessionId(data.session_id);
      setStep('otp');
      setCountdown(30);
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const digits = otp.replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6) {
      setError('Please enter the full 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'verify_otp',
          session_id: sessionId,
          otp: digits,
          name: name.trim() || 'Metro Member',
          consent_marketing: true,
          consent_whatsapp: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.message || 'Invalid or expired OTP');
        return;
      }
      const memberName = data.user?.name || name.trim() || 'Metro Member';
      localStorage.setItem('mc_member', JSON.stringify({ name: memberName, token: data.access_token, id: data.user?.id }));
      onSuccess(memberName);
    } catch {
      setError('Verification failed. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: T.surface2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Branding & NFC Pulse */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <img
              src="/logo.png"
              alt="Metro Cardz"
              style={{ height: '44px', width: 'auto', objectFit: 'contain' }}
            />
            <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>Metro Cardz</span>
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: T.successBg, border: `1px solid ${T.success}30`, borderRadius: T.radPill, padding: '6px 14px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.success, display: 'inline-block', boxShadow: `0 0 0 3px ${T.success}20` }} />
              <IconNFC size={14} color={T.success} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.success, letterSpacing: '0.06em' }}>NFC CARD DETECTED</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radXl, padding: '28px 24px', boxShadow: T.shadowLg }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            {step === 'phone' ? 'Verify Membership' : 'Enter 6-Digit OTP'}
          </h1>
          <p style={{ fontSize: '14px', color: T.textMuted, margin: '0 0 24px', lineHeight: 1.5 }}>
            {step === 'phone'
              ? 'Enter your mobile number to unlock your exclusive Metro Cardz partner deals.'
              : `Verification code sent to +91-${phone.replace(/\D/g, '').slice(-10).replace(/(\d{5})(\d{5})/, '*****$2')}`}
          </p>

          {step === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Mobile Number
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ ...inputBase, width: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontWeight: 700, fontSize: '15px' }}>
                    +91
                  </div>
                  <input
                    style={inputBase}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(clean);
                      setError('');
                    }}
                    maxLength={10}
                    autoFocus
                    aria-label="10-digit mobile number"
                  />
                </div>
              </div>

              {error && (
                <div role="alert" style={{ background: T.errorBg, border: `1px solid ${T.error}30`, borderRadius: T.radSm, padding: '10px 14px', fontSize: '13px', color: T.error, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700 }}>Notice:</span> {error}
                </div>
              )}

              <button
                style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
                onClick={sendOtp}
                disabled={loading}
                aria-label="Send verification code"
              >
                {loading ? <><IconSpinner /> Sending OTP...</> : 'Send OTP'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: T.textLight, margin: '8px 0 0', lineHeight: 1.5 }}>
                By continuing you agree to our{' '}
                <Link href="/terms-and-conditions" style={{ color: T.primary, textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
                {' & '}
                <Link href="/privacy-policy" style={{ color: T.primary, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
              </p>
            </div>
          )}

          {step === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Your Full Name
                </label>
                <input
                  style={inputBase}
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  autoComplete="name"
                  aria-label="Your full name"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  6-Digit OTP
                </label>
                <input
                  style={{ ...inputBase, letterSpacing: '0.4em', fontSize: '22px', textAlign: 'center', fontWeight: 800, height: '52px' }}
                  type="text"
                  inputMode="numeric"
                  placeholder="······"
                  value={otp}
                  onChange={e => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(clean);
                    setError('');
                  }}
                  maxLength={6}
                  autoFocus
                  aria-label="6-digit verification code"
                />
              </div>

              {error && (
                <div role="alert" style={{ background: T.errorBg, border: `1px solid ${T.error}30`, borderRadius: T.radSm, padding: '10px 14px', fontSize: '13px', color: T.error }}>
                  {error}
                </div>
              )}

              <button
                style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}
                onClick={verifyOtp}
                disabled={loading}
                aria-label="Verify OTP and continue"
              >
                {loading ? <><IconSpinner /> Verifying...</> : 'Verify & Continue'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <button
                  onClick={() => { setStep('phone'); setError(''); }}
                  style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: '13px', cursor: 'pointer', padding: '6px 0', minHeight: '44px', display: 'flex', alignItems: 'center', fontWeight: 600 }}
                  aria-label="Change mobile number"
                >
                  ← Change number
                </button>
                <button
                  onClick={sendOtp}
                  disabled={countdown > 0}
                  style={{ background: 'none', border: 'none', color: countdown > 0 ? T.textLight : T.primary, fontSize: '13px', cursor: countdown > 0 ? 'default' : 'pointer', padding: '6px 0', minHeight: '44px', display: 'flex', alignItems: 'center', fontWeight: 700 }}
                  aria-label="Resend OTP"
                >
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

// ─── Offer Detail Modal (BottomSheet Pattern) ────────────────────────────────
function OfferModal({ offer, onClose }: { offer: typeof FEATURED_OFFERS[0]; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '100%', maxWidth: '480px', background: T.surface, borderRadius: `${T.radXl} ${T.radXl} 0 0`, padding: '24px 20px 40px', border: `1px solid ${T.border}`, boxShadow: T.shadowLg, animation: 'nfc-sheetSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {/* Drag handle */}
        <div style={{ width: '40px', height: '4px', background: T.border, borderRadius: T.radPill, margin: '0 auto 20px' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: T.primaryBg, color: T.primaryDark, border: `1px solid ${T.primary}30`, borderRadius: T.radSm, padding: '3px 10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '14px' }}>
          <IconTag size={12} color={T.primaryDark} />
          {offer.tag} EXCLUSIVE
        </div>

        <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {offer.offer}
        </h2>
        <p style={{ fontSize: '15px', fontWeight: 600, color: T.textMuted, margin: '0 0 4px' }}>{offer.brand}</p>
        <p style={{ fontSize: '13px', color: T.textLight, margin: '0 0 20px' }}>{offer.sub}</p>

        <div style={{ background: T.surface2, borderRadius: T.radMd, padding: '16px', marginBottom: '22px', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            HOW TO AVAIL THIS OFFER
          </div>
          <ol style={{ fontSize: '13px', color: T.text, lineHeight: 1.7, paddingLeft: '18px', margin: 0 }}>
            <li>Tap <strong>Avail Offer</strong> below to open the partner reservation portal.</li>
            <li>Present your NFC Gold card or mention your <strong>Metro Cardz membership</strong> at billing.</li>
            <li>Instant discount will be applied directly to your invoice.</li>
          </ol>
        </div>

        <a
          href={offer.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnPrimary, textDecoration: 'none', marginBottom: '10px' }}
          aria-label={`Avail offer for ${offer.brand}`}
        >
          Avail Offer — Visit Partner
        </a>

        <button
          onClick={onClose}
          style={{ width: '100%', minHeight: '44px', padding: '12px', background: 'transparent', border: `1.5px solid ${T.border}`, borderRadius: T.radMd, color: T.textMuted, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}
          aria-label="Close offer details"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function NFCLandingClient({
  categories: _categories,
  featuredDeal: _featuredDeal,
}: {
  categories: unknown[];
  featuredDeal: unknown;
}) {
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

  // NFC Auth gate
  if (!member) {
    return <AuthScreen onSuccess={name => setMember({ name })} />;
  }

  const filteredCats = CATEGORIES.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.brands.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: T.surface2, minHeight: '100dvh', color: T.text, fontFamily: '"Inter", sans-serif', overflowX: 'hidden' }}>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${T.border}`, boxShadow: T.shadowSm }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/logo.png"
              alt="Metro Cardz"
              style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '17px', fontWeight: 800, color: T.text, lineHeight: 1.1 }}>Metro Cardz</div>
              <div style={{ fontSize: '10px', letterSpacing: '0.08em', color: T.primary, fontWeight: 700, textTransform: 'uppercase' }}>GOLD MEMBER PRIVILEGES</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: T.primaryBg, border: `1px solid ${T.primary}25`, borderRadius: T.radPill, padding: '5px 12px', fontSize: '12px', fontWeight: 700, color: T.primaryDark }}>
              {member.name.split(' ')[0]}
            </div>
            <button
              onClick={() => { localStorage.removeItem('mc_member'); setMember(null); }}
              style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: T.radSm, padding: '7px 10px', minHeight: '36px', fontSize: '12px', fontWeight: 600, color: T.textMuted, cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}
              aria-label="Sign out of NFC session"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '0 0 96px' }}>

        {/* NFC Status Banner */}
        <div style={{ margin: '14px 16px 0', background: T.successBg, border: `1px solid ${T.success}30`, borderRadius: T.radMd, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.success, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 0 3px ${T.success}20` }} />
          <IconNFC size={16} color={T.success} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: T.success }}>Gold Card Verified — Active</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: T.textMuted, whiteSpace: 'nowrap' }}>450+ offers</span>
        </div>

        {/* Hero Section */}
        <div style={{ padding: '20px 16px 0' }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', fontWeight: 800, color: T.text, margin: '0 0 4px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Welcome, {member.name.split(' ')[0]}
          </h1>
          <p style={{ fontSize: '14px', color: T.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>
            Explore verified partner discounts across dining, leisure and travel.
          </p>

          {/* Search Bar (Universal Usability: 16px input font, 44px+ tap target) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.radMd, padding: '0 14px', height: '48px', marginBottom: '22px', boxShadow: T.shadowSm }}>
            <IconSearch size={18} color={T.textLight} />
            <input
              type="search"
              placeholder="Search dining, water parks, movies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: '16px', fontFamily: '"Inter", sans-serif' }}
              aria-label="Search deals and brands"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textLight, fontSize: '18px', padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Featured Top Deals (Horizontal Carousel) ────────────────────── */}
        {!search && (
          <div style={{ padding: '0 16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: T.textMuted, textTransform: 'uppercase' }}>
                TODAY'S HIGHLIGHTS
              </span>
              <Link href="/live-offers" style={{ fontSize: '12px', color: T.primary, textDecoration: 'none', fontWeight: 700 }}>
                See all →
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
              {FEATURED_OFFERS.map(deal => (
                <div
                  key={deal.id}
                  onClick={() => setSelectedOffer(deal)}
                  style={{ minWidth: '220px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radLg, padding: '16px', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: T.shadowSm }}
                  className="nfc-card-hover"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: T.primaryBg, borderRadius: T.radSm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: T.primary, fontFamily: '"Syne", sans-serif' }}>
                      {deal.brand.charAt(0)}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', background: T.primaryBg, color: T.primaryDark, border: `1px solid ${T.primary}25`, borderRadius: T.radPill, padding: '2px 8px' }}>
                      {deal.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: T.textMuted, marginBottom: '2px' }}>{deal.brand}</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: T.text, marginBottom: '4px', lineHeight: 1.3 }}>{deal.offer}</div>
                  <div style={{ fontSize: '12px', color: T.textLight, marginBottom: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.sub}</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${T.surface3}` }}>
                    <span style={{ fontSize: '11px', color: T.textLight, fontWeight: 500 }}>Ends in {deal.endHours}h</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: T.primary }}>Avail Offer →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Categories Grid ────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: T.textMuted, textTransform: 'uppercase' }}>
              {search ? `SEARCH RESULTS (${filteredCats.length})` : 'EXPLORE BY CATEGORY'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {filteredCats.map(cat => {
              const IconComp = cat.iconComponent;
              return (
                <button
                  key={cat.id}
                  onClick={() => router.push(`/category/${cat.slug}`)}
                  style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radLg, padding: '16px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', fontFamily: '"Inter", sans-serif', boxShadow: T.shadowSm, minHeight: '130px', display: 'flex', flexDirection: 'column' }}
                  className="nfc-card-hover"
                  aria-label={`Browse ${cat.name} offers`}
                >
                  <div style={{ width: '42px', height: '42px', background: T.primaryBg, borderRadius: T.radMd, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <IconComp size={22} color={T.primary} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: T.text, marginBottom: '3px', lineHeight: 1.3 }}>{cat.name}</div>
                  <div style={{ fontSize: '11px', color: T.textLight, marginBottom: '10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'] }}>{cat.brands}</div>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: T.primaryDark, background: T.primaryBg, border: `1px solid ${T.primary}25`, borderRadius: T.radPill, padding: '2px 8px' }}>{cat.tag}</span>
                    <span style={{ fontSize: '11px', color: T.textLight, fontWeight: 500 }}>{cat.count} offers</span>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredCats.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 16px', background: T.surface, borderRadius: T.radLg, border: `1px solid ${T.border}`, marginTop: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: T.text, marginBottom: '6px' }}>No categories matching &ldquo;{search}&rdquo;</div>
              <p style={{ fontSize: '13px', color: T.textMuted, margin: '0 0 16px' }}>Try searching for a different keyword or partner brand.</p>
              <button
                onClick={() => setSearch('')}
                style={{ background: T.primaryBg, color: T.primaryDark, border: `1px solid ${T.primary}30`, borderRadius: T.radSm, padding: '8px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                aria-label="Clear current search query"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Fixed Bottom Navigation (Rule 1 & 2: SVG Icons + 44px+ targets) ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${T.border}`, boxShadow: '0 -4px 16px rgba(15,23,42,0.05)' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', height: '60px' }}>
          {[
            { id: 'explore', label: 'Explore',     href: '/go',          icon: IconCompass, active: true },
            { id: 'offers',  label: 'Live Offers',  href: '/live-offers', icon: IconTag,     active: false },
            { id: 'card',    label: 'My Card',      href: '/my-card',     icon: IconCard,    active: false },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                style={{ flex: 1, minHeight: '44px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Inter", sans-serif', color: item.active ? T.primary : T.textMuted }}
                aria-label={item.label}
                aria-current={item.active ? 'page' : undefined}
              >
                <Icon size={20} color={item.active ? T.primary : T.textMuted} />
                <span style={{ fontSize: '11px', fontWeight: item.active ? 700 : 500, letterSpacing: '0.01em' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Offer Modal ──────────────────────────────────────────────────── */}
      {selectedOffer && <OfferModal offer={selectedOffer} onClose={() => setSelectedOffer(null)} />}

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        .nfc-card-hover:hover {
          transform: translateY(-2px);
          border-color: ${T.primary} !important;
          box-shadow: ${T.shadowMd} !important;
        }
        @keyframes nfc-spin { to { transform: rotate(360deg); } }
        @keyframes nfc-sheetSlide {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
