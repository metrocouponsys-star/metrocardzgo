'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// â”€â”€â”€ Design tokens (shared with /go page) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const C = {
  bg:          '#F5F5F5',
  card:        '#FFFFFF',
  border:      '#E8E8E8',
  text:        '#1A1A1A',
  textMuted:   '#6B6B6B',
  textLight:   '#9B9B9B',
  orange:      '#F97316',
  orangeLight: '#FFF7F0',
  orangeDark:  '#EA6500',
  inputBg:     '#F9F9F9',
  shadow:      '0 4px 24px rgba(0,0,0,0.08)',
  errorBg:     '#FEF2F2',
  errorBorder: '#FECACA',
  errorText:   '#DC2626',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError(data.message ?? 'Login failed');
      }
    } catch {
      setError('Network error â€” please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '42px', height: '42px', background: C.orange, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '18px', fontFamily: '"Syne", sans-serif' }}>M</span>
            </div>
            <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 800, color: C.text }}>Metro Cardz</span>
          </div>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: C.textLight, fontWeight: 600 }}>ADMIN PANEL</div>
        </div>

        {/* Login card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '36px 32px', boxShadow: C.shadow }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>
            Sign In
          </h1>
          <p style={{ fontSize: '13px', color: C.textMuted, margin: '0 0 28px' }}>
            Deals platform â€” authorised staff only
          </p>

          {error && (
            <div style={{ background: C.errorBg, border: `1px solid ${C.errorBorder}`, borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: C.errorText, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700 }}>!</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="admin-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.textMuted, marginBottom: '6px', letterSpacing: '0.02em' }}>
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@metrocardz.in"
                style={{ width: '100%', height: '48px', background: C.inputBg, border: `1.5px solid ${C.border}`, borderRadius: '10px', padding: '0 14px', color: C.text, fontSize: '15px', outline: 'none', fontFamily: '"Inter", sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = C.orange)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label htmlFor="admin-password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.textMuted, marginBottom: '6px', letterSpacing: '0.02em' }}>
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                style={{ width: '100%', height: '48px', background: C.inputBg, border: `1.5px solid ${C.border}`, borderRadius: '10px', padding: '0 14px', color: C.text, fontSize: '15px', outline: 'none', fontFamily: '"Inter", sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => (e.target.style.borderColor = C.orange)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: '50px', background: loading ? '#E5E5E5' : C.orange, border: 'none', borderRadius: '10px', color: loading ? C.textLight : '#fff', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: '"Inter", sans-serif', transition: 'background 0.2s' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = C.orangeDark); }}
              onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = C.orange); }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Security notice */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${C.border}`, fontSize: '12px', color: C.textLight, lineHeight: 1.6, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path d="M12 2L4 7v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7l-8-5z" stroke={C.textLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>This panel is restricted to authorised Metro Cardz administrators only. All actions are logged and audited.</span>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: C.textLight }}>
          Metro Cardz Admin v1.0
        </p>
      </div>
    </div>
  );
}
