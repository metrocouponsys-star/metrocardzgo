'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function GoLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'member' | 'admin'>('member');
  const [authMethod, setAuthMethod] = useState<'otp' | 'pass'>('otp');

  // Phone / OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'verified'>('phone');
  const [sessionId, setSessionId] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Member Pass / ID Lookup state
  const [memberCode, setMemberCode] = useState('');
  const [last4, setLast4] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [activePass, setActivePass] = useState<any | null>(null);

  // Existing logged-in user check
  const [loggedInMember, setLoggedInMember] = useState<any | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mc_member') || localStorage.getItem('mc_go_member');
      if (raw) {
        setLoggedInMember(JSON.parse(raw));
      }
    } catch {}
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Handle Send OTP
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
      setOtpError('Network error. Please check your connection and try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Verify OTP
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
          step: 'verify_otp',
          session_id: sessionId,
          otp: cleanOtp,
          name: name.trim() || 'GO Member',
          consent_marketing: true,
          consent_whatsapp: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.detail || 'Invalid or expired OTP. Please try again.');
        return;
      }

      const memberObj = {
        name: data.user?.name || name.trim() || 'GO Member',
        token: data.access_token,
        id: data.user?.id,
        phone: phone.replace(/\D/g, ''),
        memberCode: data.user?.member_code,
      };

      localStorage.setItem('mc_member', JSON.stringify(memberObj));
      localStorage.setItem('mc_go_member', JSON.stringify(memberObj));
      setLoggedInMember(memberObj);
      setStep('verified');

      setTimeout(() => {
        router.push('/go/discover');
      }, 1200);
    } catch {
      setOtpError('Failed to verify OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Pass / Card Lookup
  const handleLookupPass = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimCode = memberCode.trim();
    const trimLast4 = last4.trim();
    if (!trimCode) {
      setPassError('Please enter your Member Code or Mobile Number');
      return;
    }
    if (!/^\d{4}$/.test(trimLast4)) {
      setPassError('Please enter the last 4 digits of your registered mobile number');
      return;
    }

    setPassLoading(true);
    setPassError('');
    try {
      const res = await fetch(
        `/api/v1/members/lookup?identifier=${encodeURIComponent(trimCode)}&last4=${encodeURIComponent(trimLast4)}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setPassError(err.detail || 'No active membership pass found with these details.');
        return;
      }
      const data = await res.json();
      setActivePass(data);

      const memberObj = {
        name: data.name || 'GO Member',
        id: data.id,
        memberCode: data.member_code || trimCode,
        points: data.points_balance || 0,
        tier: data.tier_name || 'Active Pass',
      };
      localStorage.setItem('mc_member', JSON.stringify(memberObj));
      localStorage.setItem('mc_go_member', JSON.stringify(memberObj));
      setLoggedInMember(memberObj);
    } catch {
      setPassError('Unable to connect to service. Please try again.');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mc_member');
    localStorage.removeItem('mc_go_member');
    setLoggedInMember(null);
    setActivePass(null);
    setStep('phone');
    setPhone('');
    setOtp('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        color: '#111827',
        fontFamily: '"Inter", system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F1F5F9',
        }}
      >
        <Link href="/go" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
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
              boxShadow: '0 6px 14px rgba(234,88,12,0.2)',
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#111827', letterSpacing: '-0.02em' }}>
              Metro Cardz GO
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Deals Platform
            </div>
          </div>
        </Link>
        <Link
          href="/go/discover"
          style={{
            fontSize: 13,
            color: '#EA580C',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Explore Deals
        </Link>
      </header>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Header text */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>
              Access Metro Cardz GO
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
              Unlock deals, redeem offers, and manage your privileges
            </p>
          </div>

          {/* Tab selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: '#F9FAFB',
              borderRadius: 14,
              padding: 4,
              marginBottom: 20,
              border: '1px solid #F1F5F9',
            }}
          >
            {[
              { key: 'member', label: 'Member Access' },
              { key: 'admin', label: 'Admin Login' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key as 'member' | 'admin')}
                style={{
                  padding: '10px 16px',
                  borderRadius: 11,
                  border: 'none',
                  background: tab === t.key ? '#FFFFFF' : 'transparent',
                  color: tab === t.key ? '#111827' : '#9CA3AF',
                  fontSize: 13,
                  fontWeight: tab === t.key ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Member panel */}
          {tab === 'member' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 20,
                padding: '24px 20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              }}
            >
              {loggedInMember ? (
                /* Already Logged In Card View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                      borderRadius: 16,
                      padding: '20px 18px',
                      color: '#fff',
                      textAlign: 'left',
                      boxShadow: '0 8px 20px rgba(234,88,12,0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.9 }}>
                        Metro Cardz GO Member
                      </span>
                      <span className="material-symbols-outlined" style={{ fontSize: 22, opacity: 0.9 }}>
                        verified
                      </span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                      {loggedInMember.name || 'Active Member'}
                    </div>
                    {loggedInMember.memberCode && (
                      <div style={{ fontSize: 12, fontFamily: 'monospace', opacity: 0.85, letterSpacing: '0.05em' }}>
                        ID: {loggedInMember.memberCode}
                      </div>
                    )}
                    {loggedInMember.points !== undefined && (
                      <div style={{ marginTop: 14, fontSize: 13, fontWeight: 700 }}>
                        Points Balance: <span style={{ fontSize: 16 }}>{loggedInMember.points}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Link href="/go/discover" style={{ textDecoration: 'none' }}>
                      <button
                        style={{
                          width: '100%',
                          height: 48,
                          border: 'none',
                          borderRadius: 12,
                          background: '#111827',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        Explore & Claim Deals →
                      </button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        background: 'transparent',
                        border: '1px solid #E5E7EB',
                        borderRadius: 12,
                        height: 40,
                        color: '#6B7280',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Sign Out / Switch Account
                    </button>
                  </div>
                </div>
              ) : (
                /* Login / Access Methods */
                <div>
                  {/* Method selector toggle */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginBottom: 18,
                      padding: 4,
                      background: '#F9FAFB',
                      borderRadius: 10,
                      border: '1px solid #F3F4F6',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('otp');
                        setOtpError('');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: 8,
                        background: authMethod === 'otp' ? '#FFFFFF' : 'transparent',
                        color: authMethod === 'otp' ? '#EA580C' : '#6B7280',
                        fontWeight: authMethod === 'otp' ? 700 : 500,
                        fontSize: 12,
                        cursor: 'pointer',
                        boxShadow: authMethod === 'otp' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      Mobile + OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('pass');
                        setPassError('');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: 8,
                        background: authMethod === 'pass' ? '#FFFFFF' : 'transparent',
                        color: authMethod === 'pass' ? '#EA580C' : '#6B7280',
                        fontWeight: authMethod === 'pass' ? 700 : 500,
                        fontSize: 12,
                        cursor: 'pointer',
                        boxShadow: authMethod === 'pass' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      }}
                    >
                      Card Code Lookup
                    </button>
                  </div>

                  {/* Method A: Mobile + OTP */}
                  {authMethod === 'otp' && (
                    <div>
                      {step === 'phone' && (
                        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                              Mobile Number
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <div
                                style={{
                                  width: 54,
                                  height: 46,
                                  borderRadius: 10,
                                  background: '#F9FAFB',
                                  border: '1px solid #E5E7EB',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: 14,
                                  color: '#6B7280',
                                  flexShrink: 0,
                                }}
                              >
                                +91
                              </div>
                              <input
                                type="tel"
                                placeholder="10-digit mobile number"
                                value={phone}
                                onChange={(e) => {
                                  setPhone(e.target.value);
                                  setOtpError('');
                                }}
                                maxLength={10}
                                style={{
                                  flex: 1,
                                  height: 46,
                                  padding: '0 14px',
                                  borderRadius: 10,
                                  background: '#F9FAFB',
                                  border: '1px solid #E5E7EB',
                                  fontSize: 15,
                                  color: '#111827',
                                  outline: 'none',
                                  fontFamily: 'inherit',
                                }}
                                autoFocus
                              />
                            </div>
                          </div>

                          {otpError && (
                            <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600 }}>{otpError}</div>
                          )}

                          <button
                            type="submit"
                            disabled={otpLoading}
                            style={{
                              height: 48,
                              border: 'none',
                              borderRadius: 12,
                              background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: otpLoading ? 'not-allowed' : 'pointer',
                              opacity: otpLoading ? 0.7 : 1,
                              boxShadow: '0 6px 16px rgba(234,88,12,0.25)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                            }}
                          >
                            {otpLoading ? 'Sending OTP…' : 'Send One-Time Password'}
                          </button>
                        </form>
                      )}

                      {step === 'otp' && (
                        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div
                            style={{
                              background: '#FFF7ED',
                              border: '1px solid #FFEDD5',
                              borderRadius: 10,
                              padding: '10px 12px',
                              fontSize: 12,
                              color: '#C2410C',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>OTP sent to +91 {phone}</span>
                            <button
                              type="button"
                              onClick={() => setStep('phone')}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EA580C',
                                fontWeight: 700,
                                fontSize: 11,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                              }}
                            >
                              Change
                            </button>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                              Your Name (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              style={{
                                width: '100%',
                                height: 44,
                                padding: '0 14px',
                                borderRadius: 10,
                                background: '#F9FAFB',
                                border: '1px solid #E5E7EB',
                                fontSize: 14,
                                color: '#111827',
                                outline: 'none',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                              Enter 6-Digit OTP
                            </label>
                            <input
                              type="text"
                              placeholder="0 0 0 0 0 0"
                              value={otp}
                              onChange={(e) => {
                                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                setOtpError('');
                              }}
                              maxLength={6}
                              style={{
                                width: '100%',
                                height: 50,
                                textAlign: 'center',
                                letterSpacing: '0.4em',
                                fontSize: 22,
                                fontWeight: 800,
                                borderRadius: 10,
                                background: '#F9FAFB',
                                border: '1px solid #E5E7EB',
                                color: '#111827',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                              autoFocus
                            />
                          </div>

                          {otpError && (
                            <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600 }}>{otpError}</div>
                          )}

                          <button
                            type="submit"
                            disabled={otpLoading}
                            style={{
                              height: 48,
                              border: 'none',
                              borderRadius: 12,
                              background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: otpLoading ? 'not-allowed' : 'pointer',
                              boxShadow: '0 6px 16px rgba(234,88,12,0.25)',
                            }}
                          >
                            {otpLoading ? 'Verifying…' : 'Verify & Enter GO'}
                          </button>

                          <div style={{ textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
                            {countdown > 0 ? (
                              <span>Resend OTP in {countdown}s</span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#EA580C',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                }}
                              >
                                Resend OTP
                              </button>
                            )}
                          </div>
                        </form>
                      )}

                      {step === 'verified' && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#10B981' }}>
                            check_circle
                          </span>
                          <h3 style={{ margin: '8px 0 4px', fontSize: 18, fontWeight: 800, color: '#111827' }}>
                            Welcome to Metro Cardz GO!
                          </h3>
                          <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                            Redirecting you to discover deals…
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Method B: Card Code Lookup (Direct in GO - NO redirect to check-membership!) */}
                  {authMethod === 'pass' && (
                    <div>
                      {!activePass ? (
                        <form onSubmit={handleLookupPass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                              Member Code or Mobile Number
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. #MC0004 or 9987379000"
                              value={memberCode}
                              onChange={(e) => {
                                setMemberCode(e.target.value);
                                setPassError('');
                              }}
                              style={{
                                width: '100%',
                                height: 44,
                                padding: '0 14px',
                                borderRadius: 10,
                                background: '#F9FAFB',
                                border: '1px solid #E5E7EB',
                                fontSize: 14,
                                color: '#111827',
                                outline: 'none',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                              }}
                              autoFocus
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                              Last 4 Digits of Registered Phone
                            </label>
                            <input
                              type="text"
                              placeholder="0 0 0 0"
                              value={last4}
                              onChange={(e) => {
                                setLast4(e.target.value.replace(/\D/g, '').slice(0, 4));
                                setPassError('');
                              }}
                              maxLength={4}
                              style={{
                                width: '100%',
                                height: 44,
                                textAlign: 'center',
                                letterSpacing: '0.3em',
                                fontSize: 18,
                                fontWeight: 700,
                                borderRadius: 10,
                                background: '#F9FAFB',
                                border: '1px solid #E5E7EB',
                                color: '#111827',
                                outline: 'none',
                                boxSizing: 'border-box',
                              }}
                            />
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                              Security check for member pass protection
                            </p>
                          </div>

                          {passError && (
                            <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600 }}>{passError}</div>
                          )}

                          <button
                            type="submit"
                            disabled={passLoading}
                            style={{
                              height: 48,
                              border: 'none',
                              borderRadius: 12,
                              background: '#111827',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 14,
                              cursor: passLoading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                              badge
                            </span>
                            {passLoading ? 'Checking Pass…' : 'Access Digital Pass'}
                          </button>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div
                            style={{
                              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                              borderRadius: 16,
                              padding: '20px 18px',
                              color: '#fff',
                            }}
                          >
                            <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 800, textTransform: 'uppercase' }}>
                              {activePass.store_name || 'Partner Member'}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, margin: '6px 0 2px' }}>
                              {activePass.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace' }}>
                              {activePass.member_code}
                            </div>
                            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                              <div>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>Points</span>
                                <div style={{ fontSize: 16, fontWeight: 800 }}>{activePass.points_balance || 0}</div>
                              </div>
                              <div>
                                <span style={{ fontSize: 11, color: '#94A3B8' }}>Tier</span>
                                <div style={{ fontSize: 16, fontWeight: 800 }}>{activePass.tier_name || 'Standard'}</div>
                              </div>
                            </div>
                          </div>

                          <Link href="/go/discover" style={{ textDecoration: 'none' }}>
                            <button
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
                              }}
                            >
                              Explore GO Deals With My Pass →
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

          {/* Admin panel */}
          {tab === 'admin' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 20,
                padding: 24,
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#EF4444' }}>
                  admin_panel_settings
                </span>
                <span style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>
                  This area is reserved for Metro Cardz GO operations & deal managers.
                </span>
              </div>

              <Link href="/admin/login" style={{ textDecoration: 'none', display: 'block' }}>
                <button
                  style={{
                    width: '100%',
                    height: 50,
                    border: '1.5px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#111827',
                    borderRadius: 13,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    lock_open
                  </span>
                  Continue to Admin Login
                </button>
              </Link>
            </div>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#9CA3AF' }}>
            Metro Cardz GO Platform · Deals & Privileges
          </p>
        </div>
      </main>
    </div>
  );
}
