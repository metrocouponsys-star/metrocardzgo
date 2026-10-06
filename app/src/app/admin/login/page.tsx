'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push('/admin/deals');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message ?? 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        background: '#FFFFFF',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      {/* Left — Brand panel (desktop only) */}
      <div
        className="go-admin-left-panel"
        style={{
          display: 'none',
          width: '42%',
          background: '#0F172A',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Glow accents */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '-60px',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Brand */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(249,115,22,0.35)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: '#fff', fontSize: 22, fontVariationSettings: "'FILL' 1" }}
              >
                storefront
              </span>
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Metro Cardz GO</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Admin Platform</div>
            </div>
          </div>

          <h1
            style={{
              color: '#fff',
              fontSize: '2.2rem',
              fontWeight: 800,
              lineHeight: 1.2,
              margin: '0 0 14px',
            }}
          >
            Manage deals,<br />
            <span style={{ color: '#F97316' }}>brands and members.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7 }}>
            The GO platform admin gives you full control over partner deals, brand listings, and membership card inventory.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { icon: 'local_offer', label: 'Manage partner deals and offers', color: '#F97316' },
            { icon: 'storefront', label: 'Approve and configure brands', color: '#6366F1' },
            { icon: 'bar_chart', label: 'Track redemptions and analytics', color: '#10B981' },
            { icon: 'credit_card', label: 'NFC card inventory management', color: '#F59E0B' },
          ].map((f) => (
            <div
              key={f.icon}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: `${f.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 17, color: f.color, fontVariationSettings: "'FILL' 1" }}
                >
                  {f.icon}
                </span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          background: '#FFFFFF',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile brand (hidden on desktop) */}
          <div className="go-admin-mobile-brand" style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                margin: '0 auto 12px',
                background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(249,115,22,0.3)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: '#fff', fontSize: 26, fontVariationSettings: "'FILL' 1" }}
              >
                storefront
              </span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>Metro Cardz GO</h1>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Admin Platform</p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Admin sign in
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
              Authorised GO platform staff only.
            </p>
          </div>

          {/* Form card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: '28px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 24px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            {error && (
              <div
                style={{
                  marginBottom: 18,
                  padding: '12px 14px',
                  background: '#FEF2F2',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: '#EF4444', flexShrink: 0, fontVariationSettings: "'FILL' 1" }}
                >
                  error
                </span>
                <p style={{ fontSize: 13, color: '#991B1B', margin: 0, lineHeight: 1.5 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="go-admin-email"
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 18,
                      color: focused === 'email' ? '#F97316' : '#9CA3AF',
                      pointerEvents: 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    person
                  </span>
                  <input
                    id="go-admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    disabled={loading}
                    autoComplete="email"
                    placeholder="admin@metrocardz.in"
                    style={{
                      width: '100%',
                      height: 48,
                      paddingLeft: 44,
                      paddingRight: 16,
                      border: `1.5px solid ${focused === 'email' ? '#F97316' : '#E5E7EB'}`,
                      borderRadius: 12,
                      fontSize: 14,
                      background: '#F9FAFB',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxShadow: focused === 'email' ? '0 0 0 3px rgba(249,115,22,0.1)' : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 24 }}>
                <label
                  htmlFor="go-admin-password"
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 18,
                      color: focused === 'password' ? '#F97316' : '#9CA3AF',
                      pointerEvents: 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    lock
                  </span>
                  <input
                    id="go-admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    style={{
                      width: '100%',
                      height: 48,
                      paddingLeft: 44,
                      paddingRight: 48,
                      border: `1.5px solid ${focused === 'password' ? '#F97316' : '#E5E7EB'}`,
                      borderRadius: 12,
                      fontSize: 14,
                      background: '#F9FAFB',
                      color: '#111827',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxShadow: focused === 'password' ? '0 0 0 3px rgba(249,115,22,0.1)' : 'none',
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      color: '#9CA3AF',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 6,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 13,
                  border: 'none',
                  background:
                    loading || !email.trim() || !password
                      ? '#F3F4F6'
                      : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: loading || !email.trim() || !password ? '#9CA3AF' : '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading || !email.trim() || !password ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow:
                    loading || !email.trim() || !password ? 'none' : '0 6px 18px rgba(249,115,22,0.25)',
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        border: '2px solid rgba(255,255,255,0.35)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Security notice */}
            <div
              style={{
                marginTop: 22,
                paddingTop: 18,
                borderTop: '1px solid #F3F4F6',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14, color: '#D1D5DB', flexShrink: 0, marginTop: 1 }}
              >
                shield
              </span>
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
                This panel is restricted to authorised Metro Cardz GO administrators. All actions are logged and audited.
              </p>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#D1D5DB' }}>
            Metro Cardz GO Admin v1.0
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 1024px) {
          .go-admin-left-panel { display: flex !important; }
          .go-admin-mobile-brand { display: none !important; }
        }
        input::placeholder { color: #9CA3AF; }
        input:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
