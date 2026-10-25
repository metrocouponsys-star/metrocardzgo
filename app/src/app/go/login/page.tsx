'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
  getActiveCustomer,
  getCustomerData,
  saveCustomerData,
  logoutCustomer,
  getRemainingOffersCount,
} from '@/lib/goStore';
import { InteractiveFlipCard } from '@/components/cards/InteractiveFlipCard';
import { loadSavedCardDesign } from '@/types/cardDesign';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  primary:     '#FF6B35',
  primaryDark: '#C2410C',
  primaryBg:   '#FFF7ED',
  surface:     '#FFFFFF',
  surface2:    '#F8FAFC',
  surface3:    '#F1F5F9',
  border:      '#E2E8F0',
  text:        '#0F172A',
  textMuted:   '#64748B',
  textLight:   '#94A3B8',
  success:     '#059669',
  successBg:   '#ECFDF5',
  error:       '#DC2626',
  errorBg:     '#FEF2F2',
  errorBorder: '#FEE2E2',
  shadowSm:    '0 1px 3px rgba(15,23,42,.04), 0 2px 6px rgba(15,23,42,.03)',
  shadowMd:    '0 4px 16px rgba(15,23,42,.08)',
  radSm:       '8px',
  radMd:       '12px',
  radLg:       '16px',
  radXl:       '20px',
  radPill:     '999px',
  glowOrange:  '0 8px 24px rgba(234,88,12,.22)',
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IconLock({ size = 18, color = T.textLight }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPerson({ size = 18, color = T.textLight }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconEye({ size = 18, color = T.textLight, off = false }: { size?: number; color?: string; off?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      {off && <path d="M3 3l18 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />}
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

function IconBadge({ size = 18, color = T.textLight }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M3 10h18" stroke={color} strokeWidth="1.8" />
      <rect x="6" y="14" width="4" height="2" rx="1" fill={color} />
    </svg>
  );
}

function IconAdmin({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l7 4v5c0 4.4-3 8.5-7 9.5C8 19.5 5 15.4 5 11V6l7-4z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true"
      style={{ animation: 'login-spin 0.7s linear infinite' }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" strokeDasharray="42 16" strokeLinecap="round" />
    </svg>
  );
}

// ── Input Field ────────────────────────────────────────────────────────────────
function InputField({
  id, label, type = 'text', placeholder, value, onChange, hint,
  leftIcon, rightSlot, error, autoFocus, autoComplete, maxLength,
}: {
  id: string; label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; hint?: string; leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode; error?: string; autoFocus?: boolean;
  autoComplete?: string; maxLength?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, letterSpacing: '0.02em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {leftIcon && (
          <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', zIndex: 1, display: 'flex' }}>
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          maxLength={maxLength}
          style={{
            width: '100%',
            height: 48, // 44px+ tap target
            padding: `0 ${rightSlot ? 42 : 14}px 0 ${leftIcon ? 42 : 14}px`,
            borderRadius: T.radMd,
            background: error ? T.errorBg : T.surface2,
            border: `1.5px solid ${error ? T.error : T.border}`,
            fontSize: 16, // CRITICAL: prevents iOS auto-zoom
            color: T.text,
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            if (!error) e.target.style.borderColor = T.primary;
          }}
          onBlur={(e) => {
            if (!error) e.target.style.borderColor = T.border;
          }}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <div role="alert" style={{ fontSize: 12, fontWeight: 600, color: T.error, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
          {error}
        </div>
      )}
      {hint && !error && (
        <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textLight }}>{hint}</p>
      )}
    </div>
  );
}

// ── Error Banner ───────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" style={{ background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: T.radMd, padding: '11px 14px', fontSize: 13, fontWeight: 600, color: T.error }}>
      {message}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GoLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'member' | 'admin'>('member');
  const [authMethod, setAuthMethod] = useState<'otp' | 'pass'>('otp');

  // OTP flow
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'verified'>('phone');
  const [sessionId, setSessionId] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Pass/Card Lookup flow
  const [memberCode, setMemberCode] = useState('');
  const [last4, setLast4] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [activePass, setActivePass] = useState<any | null>(null);

  // Admin flow
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminShowPassword, setAdminShowPassword] = useState(false);

  // Existing customer
  const [customer, setCustomer] = useState<any | null>(null);

  useEffect(() => {
    try {
      const active = getActiveCustomer();
      if (active) setCustomer(active);
    } catch {}
  }, []);

  // OTP countdown
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminIdentifier.trim() || !adminPassword.trim()) {
      setAdminError('Please enter your email/mobile and password');
      return;
    }
    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: adminIdentifier.trim(), password: adminPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminError(data.message || 'Invalid credentials. Only authorized GO deal managers can access.');
        return;
      }
      router.push('/admin/deals');
      router.refresh();
    } catch {
      setAdminError('Network error. Please check your connection.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Phone validation: numeric only
  const handlePhoneChange = useCallback((v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    setOtpError('');
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'send_otp', phone: digits }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.detail || 'Failed to send OTP. Please try again.');
        return;
      }
      setSessionId(data.session_id);
      setStep('otp');
      setCountdown(30);
    } catch {
      setOtpError('Network error. Please check your connection.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'verify_otp', session_id: sessionId, otp: cleanOtp,
          name: name.trim() || 'GO Member', consent_marketing: true, consent_whatsapp: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.detail || 'Invalid or expired OTP. Please try again.');
        return;
      }
      const digits = phone.replace(/\D/g, '');
      const cust = getCustomerData(digits, {
        id: data.user?.id || `user_${digits}`,
        name: data.user?.name || name.trim() || 'GO Member',
        phone: digits,
        memberCode: data.user?.member_code || `MC-${digits.slice(-4)}`,
        tier: 'Gold Tier',
        points: 500,
      });
      saveCustomerData(cust);
      setCustomer(cust);
      setStep('verified');
      // Let user manually navigate — no auto-redirect (Rule 7: keep users in control)
    } catch {
      setOtpError('Failed to verify OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLookupPass = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimCode = memberCode.trim();
    const trimLast4 = last4.trim();
    if (!trimCode) { setPassError('Please enter your Member Code or Mobile Number'); return; }
    if (!/^\d{4}$/.test(trimLast4)) { setPassError('Please enter exactly 4 digits of your registered mobile number'); return; }
    setPassLoading(true);
    setPassError('');
    try {
      const res = await fetch(`/api/v1/members/lookup?identifier=${encodeURIComponent(trimCode)}&last4=${encodeURIComponent(trimLast4)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setPassError(err.detail || 'No active membership pass found with these details.');
        return;
      }
      const data = await res.json();
      setActivePass(data);
      const cust = getCustomerData(data.phone || trimCode, {
        id: data.id, name: data.name || 'GO Member', phone: data.phone,
        memberCode: data.member_code || trimCode,
        points: data.points_balance || 1250, tier: data.tier_name || 'Gold Member',
      });
      saveCustomerData(cust);
      setCustomer(cust);
    } catch {
      setPassError('Unable to connect to service. Please try again.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    logoutCustomer();
    setCustomer(null);
    setActivePass(null);
    setStep('phone');
    setPhone('');
    setOtp('');
  };

  const primaryBtn = {
    width: '100%', height: 52, border: 'none', borderRadius: T.radMd,
    background: 'linear-gradient(135deg, #FF8A3D 0%, #C2410C 100%)',
    color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: T.glowOrange, transition: 'opacity 0.15s',
  } as const;

  const ghostBtn = {
    width: '100%', height: 48, border: `1.5px solid ${T.border}`,
    borderRadius: T.radMd, background: T.surface, color: T.textMuted,
    fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
  } as const;

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.text, fontFamily: '"Inter", system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes login-spin { to { transform: rotate(360deg); } }
        @keyframes login-fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .login-btn:active { transform: scale(0.98); }
      `}</style>

      {/* Header */}
      <header style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
        <Link href="/go" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }} aria-label="Metro Cardz GO home">
          <img
            src="/logo.png"
            alt="Metro Cardz"
            style={{ height: 36, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: T.text, letterSpacing: '-0.02em' }}>Metro Cardz GO</div>
            <div style={{ fontSize: 10, color: T.textLight, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>Deals Platform</div>
          </div>
        </Link>
        <Link href="/go/discover" style={{ fontSize: 13, color: T.primary, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Explore Deals</span>
          <IconArrowRight size={12} color={T.primary} />
        </Link>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 440, animation: 'login-fadeIn 0.35s ease' }}>
          {/* Hero text */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.03em' }}>
              Access Metro Cardz GO
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: T.textMuted, lineHeight: 1.5 }}>
              Unlock deals, redeem offers, and manage your member privileges
            </p>
          </div>

          {/* Tab Bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: T.surface3, borderRadius: T.radMd, padding: 4, marginBottom: 20, gap: 4,
          }}>
            {([
              { key: 'member', label: 'Member Access' },
              { key: 'admin', label: 'Admin Login' },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-selected={tab === t.key}
                role="tab"
                className="login-btn"
                style={{
                  padding: '11px 16px', borderRadius: T.radSm, border: 'none',
                  background: tab === t.key ? T.surface : 'transparent',
                  color: tab === t.key ? T.text : T.textMuted,
                  fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                  cursor: 'pointer', boxShadow: tab === t.key ? T.shadowSm : 'none',
                  transition: 'all 0.15s', minHeight: 42,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── MEMBER PANEL ────────────────────────────────────────────── */}
          {tab === 'member' && (
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: T.radXl, padding: '24px 20px', boxShadow: T.shadowMd,
            }}>
              {customer ? (
                /* Already logged-in view */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Flip Card */}
                  <InteractiveFlipCard
                    design={loadSavedCardDesign('mer-001', 'go_pass')}
                    memberName={customer.name || 'ACTIVE MEMBER'}
                    cardNumber={`MC-GO-${customer.memberCode || '8842'}`}
                    validThru="12/28"
                    tier={customer.tier || 'Gold Member'}
                    points={customer.points}
                    qrValue={`https://metrocardz.in/go/c/${customer.memberCode}`}
                    interactive={true}
                  />
                  <p style={{ textAlign: 'center', fontSize: 11, color: T.textLight, fontWeight: 600, margin: 0 }}>
                    Tap card to flip · Scannable QR on back
                  </p>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: T.radMd, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Points</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: T.primary, marginTop: 2 }}>{(customer.points || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: T.radMd, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Saved</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: T.success, marginTop: 2 }}>₹{(customer.totalSavedMoney || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textMuted, padding: '0 2px' }}>
                    <span>Claimed: <strong style={{ color: T.text }}>{customer.claimedOffers?.length || 0} passes</strong></span>
                    <span>Available: <strong style={{ color: T.text }}>{getRemainingOffersCount(customer)}</strong></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Link href="/go/discover" style={{ textDecoration: 'none' }}>
                      <button className="login-btn" style={{ ...primaryBtn }}>
                        <span>Explore Deals ({getRemainingOffersCount(customer)} Remaining)</span>
                        <IconArrowRight size={14} color="#fff" />
                      </button>
                    </Link>
                    <button onClick={handleLogout} className="login-btn" style={{ ...ghostBtn }}>
                      Sign Out / Switch Account
                    </button>
                  </div>
                </div>
              ) : (
                /* Auth methods */
                <div>
                  {/* Method toggle */}
                  <div style={{
                    display: 'flex', gap: 8, marginBottom: 20, padding: 4,
                    background: T.surface3, borderRadius: T.radSm, border: `1px solid ${T.border}`,
                  }}>
                    {([
                      { key: 'otp', label: 'Mobile OTP' },
                      { key: 'pass', label: 'Card Lookup' },
                    ] as const).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => { setAuthMethod(m.key); setOtpError(''); setPassError(''); }}
                        aria-selected={authMethod === m.key}
                        className="login-btn"
                        style={{
                          flex: 1, padding: '10px', border: 'none',
                          borderRadius: T.radSm,
                          background: authMethod === m.key ? T.surface : 'transparent',
                          color: authMethod === m.key ? T.primaryDark : T.textMuted,
                          fontWeight: authMethod === m.key ? 700 : 500,
                          fontSize: 13, cursor: 'pointer',
                          boxShadow: authMethod === m.key ? T.shadowSm : 'none',
                          minHeight: 40, transition: 'all 0.15s',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Method A: OTP */}
                  {authMethod === 'otp' && (
                    <div style={{ animation: 'login-fadeIn 0.25s ease' }}>
                      {step === 'phone' && (
                        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
                          <div>
                            <label htmlFor="phone-input" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, letterSpacing: '0.02em' }}>
                              Mobile Number
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <div style={{
                                width: 58, height: 48, borderRadius: T.radMd, background: T.surface2,
                                border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontWeight: 700, fontSize: 14, color: T.textMuted, flexShrink: 0,
                              }}>+91</div>
                              <input
                                id="phone-input"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="10-digit mobile"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                maxLength={10}
                                autoFocus
                                style={{
                                  flex: 1, height: 48, padding: '0 14px', borderRadius: T.radMd,
                                  background: otpError ? T.errorBg : T.surface2,
                                  border: `1.5px solid ${otpError ? T.error : T.border}`,
                                  fontSize: 16, color: T.text, outline: 'none', fontFamily: 'inherit',
                                  boxSizing: 'border-box', letterSpacing: '0.06em', fontWeight: 600,
                                }}
                              />
                            </div>
                            {otpError && <div role="alert" style={{ fontSize: 12, color: T.error, fontWeight: 600, marginTop: 5 }}>{otpError}</div>}
                          </div>

                          <button type="submit" disabled={otpLoading} className="login-btn" style={{ ...primaryBtn, opacity: otpLoading ? 0.75 : 1, cursor: otpLoading ? 'not-allowed' : 'pointer' }}>
                            {otpLoading ? <Spinner size={18} /> : null}
                            {otpLoading ? 'Sending OTP…' : 'Send One-Time Password'}
                          </button>
                        </form>
                      )}

                      {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
                          {/* OTP sent notice */}
                          <div style={{
                            background: T.primaryBg, border: `1px solid #FFEDD5`, borderRadius: T.radMd,
                            padding: '11px 14px', fontSize: 13, color: T.primaryDark,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}>
                            <span>OTP sent to +91 {phone}</span>
                            <button type="button" onClick={() => setStep('phone')}
                              style={{ background: 'transparent', border: 'none', color: T.primary, fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                              Change
                            </button>
                          </div>

                          <InputField
                            id="name-input"
                            label="Your Name (Optional)"
                            placeholder="Full Name"
                            value={name}
                            onChange={(v) => setName(v)}
                          />

                          <div>
                            <label htmlFor="otp-input" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, letterSpacing: '0.02em' }}>
                              Enter 6-Digit OTP
                            </label>
                            <input
                              id="otp-input"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="— — — — — —"
                              value={otp}
                              onChange={(e) => {
                                // Enforce numeric-only and max 6 chars
                                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                setOtpError('');
                              }}
                              maxLength={6}
                              autoFocus
                              style={{
                                width: '100%', height: 56, textAlign: 'center',
                                letterSpacing: '0.5em', fontSize: 24, fontWeight: 800,
                                borderRadius: T.radMd, background: otpError ? T.errorBg : T.surface2,
                                border: `1.5px solid ${otpError ? T.error : T.border}`,
                                color: T.text, outline: 'none', boxSizing: 'border-box',
                              }}
                            />
                            {otpError && <div role="alert" style={{ fontSize: 12, color: T.error, fontWeight: 600, marginTop: 5 }}>{otpError}</div>}
                          </div>

                          <button type="submit" disabled={otpLoading} className="login-btn" style={{ ...primaryBtn, opacity: otpLoading ? 0.75 : 1, cursor: otpLoading ? 'not-allowed' : 'pointer' }}>
                            {otpLoading ? <Spinner size={18} /> : null}
                            {otpLoading ? 'Verifying…' : 'Verify & Enter GO'}
                          </button>

                          <div style={{ textAlign: 'center', fontSize: 12, color: T.textMuted }}>
                            {countdown > 0 ? (
                              <span>Resend OTP in <strong>{countdown}s</strong></span>
                            ) : (
                              <button type="button" onClick={handleSendOtp}
                                style={{ background: 'transparent', border: 'none', color: T.primary, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                                Resend OTP
                              </button>
                            )}
                          </div>
                        </form>
                      )}

                      {step === 'verified' && (
                        <div style={{ textAlign: 'center', padding: '24px 0', animation: 'login-fadeIn 0.3s ease' }}>
                          <div style={{
                            width: 64, height: 64, borderRadius: '50%', background: T.success,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                          }}>
                            <IconCheck size={28} color="#fff" />
                          </div>
                          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
                            Welcome to Metro Cardz GO!
                          </h2>
                          <p style={{ margin: '0 0 24px', fontSize: 14, color: T.textMuted }}>
                            Your membership is verified and active.
                          </p>
                          <Link href="/go/discover" style={{ textDecoration: 'none' }}>
                            <button className="login-btn" style={{ ...primaryBtn }}>
                              <span>Explore Member Deals</span>
                              <IconArrowRight size={14} color="#fff" />
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Method B: Card Lookup */}
                  {authMethod === 'pass' && (
                    <div style={{ animation: 'login-fadeIn 0.25s ease' }}>
                      {!activePass ? (
                        <form onSubmit={handleLookupPass} noValidate autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <InputField
                            id="member-code-input"
                            label="Member Code or Mobile Number"
                            placeholder="e.g. #MC0004 or 9987379000"
                            value={memberCode}
                            onChange={(v) => { setMemberCode(v); setPassError(''); }}
                            leftIcon={<IconBadge size={16} color={T.textLight} />}
                            autoFocus
                            autoComplete="off"
                          />

                          <div>
                            <label htmlFor="last4-input" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, letterSpacing: '0.02em' }}>
                              Last 4 Digits of Registered Phone
                            </label>
                            <input
                              id="last4-input"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="0 0 0 0"
                              value={last4}
                              onChange={(e) => { setLast4(e.target.value.replace(/\D/g, '').slice(0, 4)); setPassError(''); }}
                              maxLength={4}
                              style={{
                                width: '100%', height: 48, textAlign: 'center', letterSpacing: '0.4em',
                                fontSize: 22, fontWeight: 800, borderRadius: T.radMd,
                                background: T.surface2, border: `1.5px solid ${T.border}`,
                                color: T.text, outline: 'none', boxSizing: 'border-box',
                              }}
                            />
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textLight }}>Security check for member pass protection</p>
                          </div>

                          {passError && <ErrorBanner message={passError} />}

                          <button type="submit" disabled={passLoading} className="login-btn"
                            style={{ ...primaryBtn, background: T.text, boxShadow: T.shadowMd, opacity: passLoading ? 0.75 : 1, cursor: passLoading ? 'not-allowed' : 'pointer' }}>
                            {passLoading ? <Spinner size={18} /> : <IconBadge size={18} color="#fff" />}
                            {passLoading ? 'Checking Pass…' : 'Access Digital Pass'}
                          </button>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'login-fadeIn 0.3s ease' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                            borderRadius: T.radLg, padding: '20px 18px', color: '#fff',
                          }}>
                            <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {activePass.store_name || 'Partner Member'}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, margin: '6px 0 2px', letterSpacing: '-0.02em' }}>{activePass.name}</div>
                            <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' }}>{activePass.member_code}</div>
                            <div style={{ marginTop: 14, display: 'flex', gap: 20 }}>
                              <div>
                                <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Points</div>
                                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{activePass.points_balance || 0}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tier</div>
                                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{activePass.tier_name || 'Standard'}</div>
                              </div>
                            </div>
                          </div>

                          <Link href="/go/discover" style={{ textDecoration: 'none' }}>
                            <button className="login-btn" style={{ ...primaryBtn }}>
                              <span>Explore GO Deals with My Pass</span>
                              <IconArrowRight size={14} color="#fff" />
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ADMIN PANEL ─────────────────────────────────────────────── */}
          {tab === 'admin' && (
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: T.radXl, padding: '24px 20px', boxShadow: T.shadowMd,
              animation: 'login-fadeIn 0.25s ease',
            }}>
              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
                <InputField
                  id="admin-identifier"
                  label="Email or Mobile Number"
                  placeholder="Enter email or mobile number"
                  value={adminIdentifier}
                  onChange={(v) => { setAdminIdentifier(v); setAdminError(''); }}
                  leftIcon={<IconPerson size={16} color={T.textLight} />}
                  autoComplete="username"
                  autoFocus
                />

                <div>
                  <label htmlFor="admin-password" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 6, letterSpacing: '0.02em' }}>
                    Admin Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                      <IconLock size={16} color={T.textLight} />
                    </div>
                    <input
                      id="admin-password"
                      type={adminShowPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => { setAdminPassword(e.target.value); setAdminError(''); }}
                      placeholder="Enter admin password"
                      autoComplete="current-password"
                      style={{
                        width: '100%', height: 48, padding: '0 46px 0 42px',
                        borderRadius: T.radMd, background: T.surface2,
                        border: `1.5px solid ${T.border}`,
                        fontSize: 16, color: T.text, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setAdminShowPassword(!adminShowPassword)}
                      aria-label={adminShowPassword ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
                    >
                      <IconEye size={16} color={T.textLight} off={adminShowPassword} />
                    </button>
                  </div>
                </div>

                {adminError && <ErrorBanner message={adminError} />}

                <button type="submit" disabled={adminLoading} className="login-btn"
                  style={{ ...primaryBtn, opacity: adminLoading ? 0.75 : 1, cursor: adminLoading ? 'not-allowed' : 'pointer' }}>
                  {adminLoading ? <Spinner size={18} /> : null}
                  {adminLoading ? 'Authenticating…' : 'Login to Manage Deals'}
                </button>
              </form>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: T.textLight }}>
            Metro Cardz GO Platform · Deals & Privileges
          </p>
        </div>
      </main>
    </div>
  );
}
