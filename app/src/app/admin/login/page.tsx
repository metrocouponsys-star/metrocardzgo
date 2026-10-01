'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background:     '#0D0F12',
        minHeight:      '100dvh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '24px',
        fontFamily:     '"Plus Jakarta Sans", sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 700, color: '#D4AF37', marginBottom: '4px' }}>
            Metro Cardz
          </div>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: '#6B7280', fontWeight: 600 }}>
            DEALS ADMIN PANEL
          </div>
        </div>

        {/* Login card */}
        <div
          style={{
            background:   '#14171F',
            border:       '1px solid #2A303C',
            borderRadius: '20px',
            padding:      '32px',
          }}
        >
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
            Admin Sign In
          </h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px' }}>
            Deals Platform Control Center
          </p>

          {error && (
            <div
              style={{
                background:   'rgba(186,26,26,0.1)',
                border:       '1px solid rgba(186,26,26,0.3)',
                borderRadius: '10px',
                padding:      '12px',
                fontSize:     '13px',
                color:        '#FF8A80',
                marginBottom: '16px',
              }}
            >
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="admin-email" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '6px' }}>
                EMAIL ADDRESS
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@metrocardz.in"
                style={{
                  width:        '100%',
                  height:       '48px',
                  background:   '#1C212B',
                  border:       '1px solid #2A303C',
                  borderRadius: '10px',
                  padding:      '0 14px',
                  color:        '#F8FAFC',
                  fontSize:     '15px',
                  outline:      'none',
                  fontFamily:   '"Plus Jakarta Sans", sans-serif',
                  boxSizing:    'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; }}
                onBlur={(e) => { e.target.style.borderColor = '#2A303C'; }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="admin-password" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width:        '100%',
                  height:       '48px',
                  background:   '#1C212B',
                  border:       '1px solid #2A303C',
                  borderRadius: '10px',
                  padding:      '0 14px',
                  color:        '#F8FAFC',
                  fontSize:     '15px',
                  outline:      'none',
                  fontFamily:   '"Plus Jakarta Sans", sans-serif',
                  boxSizing:    'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#D4AF37'; }}
                onBlur={(e) => { e.target.style.borderColor = '#2A303C'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width:          '100%',
                height:         '52px',
                background:     loading ? '#2A303C' : 'linear-gradient(135deg, #E5C158 0%, #D4AF37 100%)',
                border:         'none',
                borderRadius:   '12px',
                color:          loading ? '#9CA3AF' : '#0D0F12',
                fontSize:       '15px',
                fontWeight:     700,
                cursor:         loading ? 'not-allowed' : 'pointer',
                boxShadow:      loading ? 'none' : '0 4px 16px rgba(212,175,55,0.3)',
                fontFamily:     '"Plus Jakarta Sans", sans-serif',
                transition:     'all 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '12px', background: '#1C212B', borderRadius: '10px', fontSize: '12px', color: '#6B7280', lineHeight: '18px' }}>
            🔒 This panel is restricted to authorised Metro Cardz administrators only. All actions are logged.
          </div>
        </div>
      </div>
    </div>
  );
}
