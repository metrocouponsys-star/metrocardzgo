'use client';

import dynamic from 'next/dynamic';

// The /login route is the entry point for the Membership Platform (merchant loyalty SPA).
// It is served by MerchantApp (React Router) which internally handles the /login path
// and shows LoginPage.tsx from views/auth/LoginPage.tsx.
// DO NOT redirect this to /go/login — that is a completely separate platform.

const MerchantApp = dynamic(
  () => import('@/views/MerchantApp'),
  {
    ssr: false,
    loading: () => (
      <div style={{ background: '#F8FAFC', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E2E8F0', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  }
);

export default function LoginPageRoute() {
  return <MerchantApp />;
}
