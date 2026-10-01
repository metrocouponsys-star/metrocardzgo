'use client';
/**
 * /join — Customer Self-Registration Page
 * Public, mobile-first, standalone Next.js page (NOT inside merchant SPA).
 *
 * Flow:
 *   Step 1: Enter phone number → Request OTP
 *   Step 2: Enter OTP + Name + DOB (optional) + DPDP Consent → Create account
 *   Step 3: Success — show membership card link + QR
 *
 * DPDP: Consent checkboxes shown before submission (mandatory membership, optional marketing/WA).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Step = 'phone' | 'otp' | 'success';

interface SuccessData {
  name: string;
  memberCode: string;
  publicToken: string;
  merchantId: string;
}

export default function JoinPage() {
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 fields
  const [phone, setPhone] = useState('');
  const [merchantCode, setMerchantCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [merchantId, setMerchantId] = useState('');

  // Step 2 fields
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [consentWhatsapp, setConsentWhatsapp] = useState(false);
  const [consentMembership, setConsentMembership] = useState(false);

  // Step 3
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  // Countdown for OTP resend
  const [resendCountdown, setResendCountdown] = useState(0);
  useEffect(() => {
    if (resendCountdown > 0) {
      const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCountdown]);

  // Pre-fill merchant code from URL ?merchant=XXX
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const m = p.get('merchant') ?? '';
    if (m) setMerchantCode(m);
  }, []);

  async function sendOtp() {
    const digits = phone.replace(/\D/g, '').slice(-10);
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
        body: JSON.stringify({ step: 'send_otp', phone: digits, merchantCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? 'Failed to send OTP');
      setSessionId(data.session_id);
      setMerchantId(data.merchant_id ?? '');
      setStep('otp');
      setResendCountdown(60);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtpAndRegister() {
    if (!consentMembership) {
      setError('Please accept the membership terms to continue');
      return;
    }
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    if (!name.trim()) {
      setError('Enter your full name');
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
          otp,
          name: name.trim(),
          dob: dob || undefined,
          referral_code: referralCode || undefined,
          merchant_id: merchantId,
          consent_marketing: consentMarketing,
          consent_whatsapp: consentWhatsapp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? 'Registration failed');

      // Store JWT
      if (data.token) {
        localStorage.setItem('mc_token', data.token);
        if (data.refresh_token) localStorage.setItem('mc_refresh', data.refresh_token);
      }

      setSuccessData({
        name: data.user?.name ?? name,
        memberCode: data.member_code ?? '',
        publicToken: data.user?.publicToken ?? '',
        merchantId: merchantId,
      });
      setStep('success');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    }}>

      {/* Background glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: '50%', height: '50%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', left: '-10%',
          width: '50%', height: '50%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.3), transparent 70%)',
          filter: 'blur(60px)',
        }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '420px',
        animation: 'slideUp 0.4s ease-out',
      }}>
        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            <span style={{ fontSize: '28px' }}>🎟️</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: 0 }}>
            Metro Cardz GO
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px' }}>
            Join your exclusive membership
          </p>
        </div>

        {/* Progress steps */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {(['phone', 'otp'] as Step[]).map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step === s ? 'linear-gradient(135deg,#6366f1,#a855f7)' : (step === 'otp' && s === 'phone') ? '#4ade80' : 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                  color: (step === 'otp' && s === 'phone') ? '#fff' : step === s ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s',
                  boxShadow: step === s ? '0 4px 16px rgba(99,102,241,0.5)' : 'none',
                }}>
                  {step === 'otp' && s === 'phone' ? '✓' : i + 1}
                </div>
                <span style={{ color: step === s ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>
                  {s === 'phone' ? 'Mobile' : 'Details'}
                </span>
                {i === 0 && <div style={{ width: '24px', height: '2px', background: step === 'otp' ? '#6366f1' : 'rgba(255,255,255,0.15)', borderRadius: '1px' }} />}
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.15)',
          padding: '32px 28px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
        }}>

          {/* ── STEP 1: Phone ─────────────────────────────────────────── */}
          {step === 'phone' && (
            <>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
                Enter your mobile number
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: '0 0 24px' }}>
                We'll send a 6-digit OTP to verify your number.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Mobile Number *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>
                    +91
                  </span>
                  <input
                    id="register-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    placeholder="9876543210"
                    disabled={loading}
                    style={{ ...inputStyle, paddingLeft: '52px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Membership / Merchant Code <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  id="register-merchant-code"
                  type="text"
                  value={merchantCode}
                  onChange={e => setMerchantCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SHOPXYZ"
                  disabled={loading}
                  style={inputStyle}
                />
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '4px' }}>
                  Ask your merchant for their code, or leave blank.
                </p>
              </div>

              {error && <ErrorBox message={error} />}

              <button
                id="send-otp-btn"
                onClick={sendOtp}
                disabled={loading || phone.length !== 10}
                style={primaryBtnStyle(loading || phone.length !== 10)}
              >
                {loading ? '⏳ Sending OTP…' : 'Send OTP →'}
              </button>

              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '16px' }}>
                Already a member?{' '}
                <Link href="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP + Details ─────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
                Verify & Complete Profile
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', margin: '0 0 24px' }}>
                OTP sent to <strong style={{ color: '#c4b5fd' }}>+91-XXXXXX{phone.slice(-4)}</strong>
              </p>

              {/* OTP Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>6-Digit OTP *</label>
                <input
                  id="register-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  disabled={loading}
                  style={{ ...inputStyle, letterSpacing: '8px', fontSize: '22px', textAlign: 'center', fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  disabled={loading}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Date of Birth <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(for birthday offers)</span></label>
                <input
                  id="register-dob"
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Referral Code <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  id="register-referral"
                  type="text"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCD1234"
                  disabled={loading}
                  style={inputStyle}
                />
              </div>

              {/* ── DPDP Consent ─────────────────────────────────────── */}
              <div style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '24px',
              }}>
                <p style={{ color: '#c4b5fd', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>
                  🔒 Privacy & Consent (DPDP Act 2023)
                </p>

                <ConsentCheck
                  id="consent-membership"
                  checked={consentMembership}
                  onChange={setConsentMembership}
                  required
                  label={<>I agree to the <Link href="/terms-and-conditions" target="_blank" style={{ color: '#818cf8' }}>Terms & Conditions</Link> and <Link href="/privacy-policy" target="_blank" style={{ color: '#818cf8' }}>Privacy Policy</Link>. My name, phone and DOB will be stored to manage my membership. <strong style={{ color: '#f87171' }}>(Required)</strong></>}
                />

                <ConsentCheck
                  id="consent-marketing"
                  checked={consentMarketing}
                  onChange={setConsentMarketing}
                  label="I agree to receive promotional SMS/email offers from Metro Cardz partners. (Optional — you can withdraw anytime)"
                />

                <ConsentCheck
                  id="consent-whatsapp"
                  checked={consentWhatsapp}
                  onChange={setConsentWhatsapp}
                  label="I agree to receive WhatsApp messages about my membership, coupons and offers. (Optional)"
                />
              </div>

              {error && <ErrorBox message={error} />}

              <button
                id="register-btn"
                onClick={verifyOtpAndRegister}
                disabled={loading || !consentMembership || otp.length !== 6 || !name.trim()}
                style={primaryBtnStyle(loading || !consentMembership || otp.length !== 6 || !name.trim())}
              >
                {loading ? '⏳ Creating account…' : '🎉 Get My Membership Card'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                {resendCountdown > 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                    Resend OTP in {resendCountdown}s
                  </p>
                ) : (
                  <button
                    onClick={() => { setStep('phone'); setOtp(''); }}
                    style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    ← Change number / Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── STEP 3: Success ───────────────────────────────────────── */}
          {step === 'success' && successData && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎊</div>
              <h2 style={{ color: '#4ade80', fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>
                Welcome, {successData.name}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: '0 0 8px' }}>
                Your membership is active.
              </p>
              <div style={{
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '24px',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 4px' }}>Member Code</p>
                <p style={{ color: '#4ade80', fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '4px' }}>
                  {successData.memberCode}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {successData.publicToken && (
                  <a
                    href={`/m/${successData.publicToken}`}
                    style={{
                      display: 'block', padding: '14px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      color: '#fff', fontSize: '15px', fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                    }}
                  >
                    🎟️ View My Digital Card
                  </a>
                )}
                <a
                  href="/browse"
                  style={{
                    display: 'block', padding: '14px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontSize: '15px', fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  🎁 Browse Offers & Deals
                </a>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '20px' }}>
          Metro Cardz · Protected by DPDP Act 2023
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.25); }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', color: 'rgba(255,255,255,0.7)',
  fontSize: '13px', fontWeight: 600, marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: '48px', padding: '0 14px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.07)',
  color: '#fff', fontSize: '15px',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%', height: '52px', borderRadius: '14px', border: 'none',
    background: disabled ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
    color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
    fontSize: '16px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : '0 8px 24px rgba(99,102,241,0.4)',
    transition: 'all 0.2s',
  };
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      background: 'rgba(248,113,113,0.15)',
      border: '1px solid rgba(248,113,113,0.3)',
      borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
      color: '#fca5a5', fontSize: '13px',
    }}>
      ⚠️ {message}
    </div>
  );
}

function ConsentCheck({
  id, checked, onChange, label, required
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={id} style={{
      display: 'flex', gap: '10px', alignItems: 'flex-start',
      marginBottom: '10px', cursor: 'pointer',
    }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{
          width: '18px', height: '18px', marginTop: '1px',
          accentColor: '#6366f1', flexShrink: 0, cursor: 'pointer',
        }}
      />
      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', lineHeight: 1.5 }}>
        {label}
      </span>
    </label>
  );
}
