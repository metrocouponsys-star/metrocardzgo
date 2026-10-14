'use client';

import React, { useState, useEffect } from 'react';
import { getCustomerData, saveCustomerData, GoCustomerProfile } from '@/lib/goStore';

interface MemberAuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: GoCustomerProfile) => void;
  title?: string;
  subtitle?: string;
}

export function MemberAuthGateModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Membership Authentication Required',
  subtitle = 'Verify your membership card and identity to unlock exclusive offers, claim coupon passes, and earn points.',
}: MemberAuthGateModalProps) {
  const [tab, setTab] = useState<'pass' | 'otp'>('pass');

  // Pass / Card Lookup state
  const [memberCode, setMemberCode] = useState('');
  const [last4, setLast4] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');

  // Mobile OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp'>('phone');
  const [sessionId, setSessionId] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  if (!isOpen) return null;

  // Handle Member Card / Pass Lookup
  const handlePassLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = memberCode.trim();
    const cleanLast4 = last4.trim();

    if (!cleanCode) {
      setPassError('Please enter your Member Code (e.g. MC0004) or registered mobile number');
      return;
    }
    if (!/^\d{4}$/.test(cleanLast4)) {
      setPassError('Please enter the last 4 digits of your registered mobile number for identity verification');
      return;
    }

    setPassLoading(true);
    setPassError('');

    try {
      const res = await fetch(
        `/api/v1/members/lookup?identifier=${encodeURIComponent(cleanCode)}&last4=${encodeURIComponent(cleanLast4)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setPassError(data.detail || 'No matching active membership found with these credentials.');
        return;
      }

      // Successfully verified right person
      const customer = getCustomerData(data.phone || cleanCode, {
        id: data.id,
        name: data.name,
        phone: data.phone,
        memberCode: data.member_code || cleanCode,
        tier: data.tier_name || 'Gold Member',
        points: data.points_balance || 1250,
      });

      saveCustomerData(customer);
      onSuccess(customer);
      onClose();
    } catch {
      setPassError('Network error. Please try again.');
    } finally {
      setPassLoading(false);
    }
  };

  // Demo auto-fill helper
  const handleDemoFill = (code: string, l4: string) => {
    setMemberCode(code);
    setLast4(l4);
    setPassError('');
  };

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
    setDevOtpHint('');

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'send_otp', phone: digits }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.detail || 'Failed to send OTP.');
        return;
      }

      setSessionId(data.session_id);
      setOtpStep('otp');
      setCountdown(30);

      // In dev mode, check if server returned a hint
      if (data.dev_otp) {
        setDevOtpHint(`Dev Code: ${data.dev_otp}`);
      }
    } catch {
      setOtpError('Network error sending OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP');
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
        setOtpError(data.detail || 'Invalid or expired OTP.');
        return;
      }

      const digits = phone.replace(/\D/g, '');
      const customer = getCustomerData(digits, {
        id: data.user?.id || `user_${digits}`,
        name: data.user?.name || name.trim() || 'Verified Member',
        phone: digits,
        memberCode: data.user?.member_code || `MC-${digits.slice(-4)}`,
        tier: 'Gold Tier',
        points: 500,
      });

      saveCustomerData(customer);
      onSuccess(customer);
      onClose();
    } catch {
      setOtpError('Verification failed. Please check OTP and try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#FFFFFF',
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #F1F5F9',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
            padding: '24px 24px 20px',
            color: '#fff',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.25)',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            <span>Member Exclusive</span>
          </div>

          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {title}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.45 }}>
            {subtitle}
          </p>
        </div>

        {/* Method Toggle Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid #F1F5F9',
            background: '#F8FAFC',
          }}
        >
          <button
            onClick={() => setTab('pass')}
            style={{
              padding: '13px 16px',
              border: 'none',
              background: tab === 'pass' ? '#fff' : 'transparent',
              borderBottom: tab === 'pass' ? '2.5px solid #EA580C' : '2.5px solid transparent',
              color: tab === 'pass' ? '#EA580C' : '#64748B',
              fontWeight: tab === 'pass' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Member Card & ID
          </button>
          <button
            onClick={() => setTab('otp')}
            style={{
              padding: '13px 16px',
              border: 'none',
              background: tab === 'otp' ? '#fff' : 'transparent',
              borderBottom: tab === 'otp' ? '2.5px solid #EA580C' : '2.5px solid transparent',
              color: tab === 'otp' ? '#EA580C' : '#64748B',
              fontWeight: tab === 'otp' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Mobile OTP
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '22px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {tab === 'pass' ? (
            <form onSubmit={handlePassLookup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Membership Code or Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. MC0004 or 9987379000"
                  value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #E2E8F0',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Security Verification: Last 4 digits of registered phone
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="e.g. 9000"
                  value={last4}
                  onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1.5px solid #E2E8F0',
                    fontSize: 18,
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: 700,
                  }}
                />
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                  Verifies that you are the legitimate cardholder (right person check).
                </span>
              </div>

              {passError && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#DC2626',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {passError}
                </div>
              )}

              <button
                type="submit"
                disabled={passLoading}
                style={{
                  padding: '14px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
                }}
              >
                {passLoading ? 'Verifying Identity...' : 'Authenticate & Unlock Offers →'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {otpStep === 'phone' ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      10-Digit Mobile Number
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div
                        style={{
                          padding: '12px 14px',
                          background: '#F1F5F9',
                          borderRadius: 12,
                          fontWeight: 700,
                          fontSize: 14,
                          color: '#475569',
                          border: '1.5px solid #E2E8F0',
                        }}
                      >
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9845012345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: '1.5px solid #E2E8F0',
                          fontSize: 14,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        autoFocus
                      />
                    </div>
                  </div>

                  {otpError && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {otpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={otpLoading}
                    style={{
                      padding: '14px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
                    }}
                  >
                    {otpLoading ? 'Sending OTP...' : 'Send Verification OTP →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rohan Verma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1.5px solid #E2E8F0',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                        6-Digit OTP sent to +91-{phone.slice(-10)}
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpStep('phone')}
                        style={{ background: 'none', border: 'none', color: '#EA580C', fontSize: 12, cursor: 'pointer', padding: 0 }}
                      >
                        Change
                      </button>
                    </div>
                    <input
                      type="number"
                      maxLength={6}
                      placeholder="------"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1.5px solid #E2E8F0',
                        fontSize: 22,
                        letterSpacing: '0.4em',
                        textAlign: 'center',
                        fontWeight: 800,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {devOtpHint && (
                      <span style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 4, display: 'block' }}>
                        {devOtpHint}
                      </span>
                    )}
                  </div>

                  {otpError && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {otpError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={otpLoading}
                    style={{
                      padding: '14px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
                    }}
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP & Unlock →'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
