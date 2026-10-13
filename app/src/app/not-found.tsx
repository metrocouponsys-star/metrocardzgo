import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found (404) | Metro Cardz',
  description: 'The requested page could not be found.',
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        color: '#0F172A',
        fontFamily: '"Inter", system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 480, width: '100%', margin: '0 auto' }}>
        {/* Brand Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 12px 24px rgba(232, 90, 40, 0.25)',
          }}
        >
          <span style={{ fontSize: 28, color: '#fff' }}>💳</span>
        </div>

        {/* 404 Tag */}
        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 999,
            background: '#FFF4EF',
            border: '1px solid #FFD9C9',
            color: '#E85A28',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.08em',
            marginBottom: 16,
          }}
        >
          ERROR 404
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 10px', color: '#0F172A' }}>
          Page Not Found
        </h1>

        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, margin: '0 0 32px' }}>
          The page or pass you are looking for doesn't exist, has been moved, or the link may have expired.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              background: '#FF6B35',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 14,
              padding: '14px 24px',
              borderRadius: 14,
              boxShadow: '0 4px 14px rgba(255, 107, 53, 0.3)',
              display: 'inline-block',
            }}
          >
            Return to Homepage
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Link
              href="/go"
              style={{
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#334155',
                fontWeight: 700,
                fontSize: 13,
                padding: '12px 16px',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>⚡</span>
              <span>Metro Cardz GO</span>
            </Link>

            <Link
              href="/check-membership"
              style={{
                textDecoration: 'none',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#334155',
                fontWeight: 700,
                fontSize: 13,
                padding: '12px 16px',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span>🔍</span>
              <span>Check Member Pass</span>
            </Link>
          </div>

          <Link
            href="/login"
            style={{
              textDecoration: 'none',
              color: '#64748B',
              fontSize: 13,
              fontWeight: 600,
              marginTop: 10,
            }}
          >
            Merchant Portal Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
