'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/go/login');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F7F7F5',
        color: '#18181B',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '3px solid #FDE7D9',
            borderTopColor: '#F97316',
            margin: '0 auto 12px',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Redirecting to Metro Cardz GO…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
