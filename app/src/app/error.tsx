'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console or error service in production
    console.error('Unhandled runtime error in page:', error);
  }, [error]);

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
      <div style={{ maxWidth: 460, width: '100%', margin: '0 auto' }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 18,
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#EF4444',
            fontSize: 28,
          }}
        >
          ⚠️
        </div>

        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 999,
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#DC2626',
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.08em',
            marginBottom: 14,
          }}
        >
          SYSTEM NOTICE
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 10px', color: '#0F172A' }}>
          Something went wrong
        </h1>

        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>
          An unexpected issue occurred while rendering this page. Our team has been notified, or you can try reloading.
        </p>

        {error.digest && (
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: '#94A3B8', marginBottom: 20 }}>
            Error Reference: {error.digest}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              background: '#FF6B35',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.25)',
            }}
          >
            Try Again
          </button>

          <Link
            href="/"
            style={{
              textDecoration: 'none',
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              color: '#334155',
              fontWeight: 700,
              fontSize: 13,
              padding: '12px 20px',
              borderRadius: 12,
              display: 'inline-block',
            }}
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
