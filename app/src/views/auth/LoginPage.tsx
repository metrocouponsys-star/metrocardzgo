'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import * as api from '../../api';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = email.trim();
    if (!val || !password) return;
    setLoading(true);
    setError('');
    try {
      const authResult = await api.login(val, password);
      setAuth(authResult.user, authResult.token);
      addToast('success', `Welcome back, ${authResult.user.name}! 👋`);
      const targetRoute =
        authResult.user.role === 'super_admin'
          ? '/portal/admin'
          : authResult.user.role === 'staff'
          ? '/portal/members/search?tab=qr'
          : '/portal/dashboard';
      navigate(targetRoute);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      fontFamily: '"Inter", system-ui, sans-serif',
      background: '#F8FAFC',
    }}>

      {/* ── Left Brand Panel ─────────────────────────────────────────── */}
      <div style={{
        display: 'none',
        width: '44%',
        background: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
      }} className="login-left-panel">

        {/* Subtle grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Warm glow accents */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '80px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)' }} />

        {/* Brand */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '60px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(255,107,53,0.4)',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: '16px', margin: 0, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>Metro Cardz</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>Merchant Platform</p>
            </div>
          </div>

          <h1 style={{
            color: '#fff', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
            fontSize: '36px', fontWeight: 800, lineHeight: 1.2,
            margin: '0 0 16px',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}>
            India's smartest<br />
            <span style={{ color: '#FF6B35' }}>loyalty platform</span>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.55)', fontSize: '15px', lineHeight: 1.65, margin: 0,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(12px)',
            transition: 'opacity 0.6s 0.1s ease, transform 0.6s 0.1s ease',
          }}>
            Manage your members, rewards, QR scans<br />and campaigns — all in one place.
          </p>
        </div>

        {/* Feature Chips */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { icon: 'qr_code_scanner', label: 'Instant QR Scan & Verify', color: '#FF6B35' },
            { icon: 'trending_up',     label: 'Real-time Redemption Analytics', color: '#00D4AA' },
            { icon: 'campaign',        label: 'Birthday & Campaign Automation', color: '#F59E0B' },
            { icon: 'groups',          label: 'Full Member Lifecycle View', color: '#818CF8' },
          ].map((f, i) => (
            <div key={f.icon} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '8px',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'none' : 'translateX(-16px)',
              transition: `opacity 0.5s ${0.2 + i * 0.08}s ease, transform 0.5s ${0.2 + i * 0.08}s ease`,
            }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
                background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: f.color, fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500 }}>{f.label}</span>
            </div>
          ))}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {[{ n: '500+', l: 'Businesses' }, { n: '10K+', l: 'Members' }, { n: '99.9%', l: 'Uptime' }].map(s => (
              <div key={s.l}>
                <p style={{ color: '#FF6B35', fontWeight: 800, fontSize: '20px', margin: '0 0 2px', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>{s.n}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Login Panel ────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 20px',
        background: '#F8FAFC',
      }}>
        <div style={{
          width: '100%', maxWidth: '400px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>

          {/* Mobile logo (hidden on desktop) */}
          <div className="login-mobile-logo" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px', margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(255,107,53,0.35)',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '26px', fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>Metro Cardz</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Merchant Loyalty Platform</p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif', letterSpacing: '-0.3px' }}>
              Sign in to your account
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
              Enter your credentials to access the merchant dashboard.
            </p>
          </div>

          {/* Form Card */}
          <div style={{
            background: '#FFFFFF', borderRadius: '20px', padding: '28px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 24px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
          }}>
            <form onSubmit={handleLogin} noValidate>

              {/* Email field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email or Mobile
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '18px', color: focused === 'email' ? '#FF6B35' : '#94A3B8', pointerEvents: 'none',
                    transition: 'color 0.2s',
                  }}>person</span>
                  <input
                    id="login-email"
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    disabled={loading}
                    placeholder="e.g. 9876543210 or email@domain.com"
                    style={{
                      width: '100%', height: '48px', paddingLeft: '44px', paddingRight: '16px',
                      border: `1.5px solid ${focused === 'email' ? '#FF6B35' : '#E2E8F0'}`,
                      borderRadius: '12px', fontSize: '14px', background: '#F8FAFC',
                      color: '#0F172A', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxShadow: focused === 'email' ? '0 0 0 3px rgba(255,107,53,0.12)' : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '18px', color: focused === 'password' ? '#FF6B35' : '#94A3B8', pointerEvents: 'none',
                    transition: 'color 0.2s',
                  }}>lock</span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    disabled={loading}
                    placeholder="Enter your password"
                    style={{
                      width: '100%', height: '48px', paddingLeft: '44px', paddingRight: '48px',
                      border: `1.5px solid ${focused === 'password' ? '#FF6B35' : '#E2E8F0'}`,
                      borderRadius: '12px', fontSize: '14px', background: '#F8FAFC',
                      color: '#0F172A', outline: 'none', boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxShadow: focused === 'password' ? '0 0 0 3px rgba(255,107,53,0.12)' : 'none',
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: '#94A3B8', display: 'flex', alignItems: 'center', borderRadius: '6px',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginBottom: '16px', padding: '12px 14px',
                  background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#EF4444', flexShrink: 0, marginTop: '1px', fontVariationSettings: "'FILL' 1" }}>error</span>
                  <p style={{ fontSize: '13px', color: '#991B1B', margin: 0, lineHeight: 1.5 }}>{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                id="email-login-btn"
                type="submit"
                disabled={loading || !email.trim() || !password}
                style={{
                  width: '100%', height: '50px', borderRadius: '12px', border: 'none',
                  background: loading || !email.trim() || !password
                    ? '#E2E8F0'
                    : 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)',
                  color: loading || !email.trim() || !password ? '#94A3B8' : '#fff',
                  fontSize: '15px', fontWeight: 700, cursor: loading || !email.trim() || !password ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
                  boxShadow: loading || !email.trim() || !password ? 'none' : '0 4px 14px rgba(255,107,53,0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '20px', marginBottom: 0 }}>
              Not a merchant?{' '}
              <a href="/#contact" style={{ color: '#FF6B35', fontWeight: 700, textDecoration: 'none' }}>Get started →</a>
            </p>
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', marginTop: '24px', lineHeight: 1.6 }}>
            © {new Date().getFullYear()} Metro Cardz · Secure Login · v2.0
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (min-width: 1024px) {
          .login-left-panel { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }

        input::placeholder { color: #94A3B8; }
        input:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
