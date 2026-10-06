'use client';

import Link from 'next/link';

export default function GoLoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F6F3EE',
        color: '#18181B',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 430 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 24,
              marginBottom: 12,
              boxShadow: '0 16px 26px rgba(234,88,12,0.22)',
            }}
          >
            M
          </div>
          <h1 style={{ margin: 0, fontSize: 30, letterSpacing: '-0.05em', fontWeight: 800 }}>Metro Cardz GO</h1>
          <p style={{ margin: '8px 0 0', color: '#71717A', fontSize: 14 }}>Access your membership benefits and discover member-only experiences.</p>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #EAE3DD',
            borderRadius: 26,
            padding: 22,
            boxShadow: '0 18px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={{ borderRadius: 18, background: 'linear-gradient(135deg, #FFF7ED 0%, #fff 100%)', border: '1px solid #F8D7C0', padding: 14 }}>
              <div style={{ color: '#EA580C', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800 }}>Member access</div>
              <div style={{ marginTop: 6, fontWeight: 700, fontSize: 16 }}>Your card, points and rewards in one place</div>
            </div>

            <p style={{ margin: 0, color: '#6B7280', fontSize: 13, lineHeight: 1.6 }}>
              No separate GO password is needed. Look up your existing membership using your member code or registered mobile number and verify with the last four digits of your phone.
            </p>

            <Link href="/check-membership" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  border: 'none',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: '#fff',
                  height: 48,
                  width: '100%',
                  borderRadius: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 12px 20px rgba(249, 115, 22, 0.22)',
                }}
              >
                View my membership
              </button>
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280', fontSize: 12 }}>
              <Link href="/go" style={{ color: '#EA580C', fontWeight: 700, textDecoration: 'none' }}>Back to home</Link>
              <Link href="/go/discover" style={{ color: '#6B7280', fontWeight: 700, textDecoration: 'none' }}>Browse deals</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
