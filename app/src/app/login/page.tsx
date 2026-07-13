'use client';

import dynamic from 'next/dynamic';

// Mount the full merchant SPA (BrowserRouter + all routes) as a client-only component
const MerchantApp = dynamic(
  () => import('@/views/MerchantApp'),
  {
    ssr: false,
    loading: () => (
      <div style={{ background: '#f9f9ff', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e7eefe', borderTopColor: '#00236f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  }
);

export default function LoginPage() {
  return <MerchantApp />;
}
