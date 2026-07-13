'use client';

import dynamic from 'next/dynamic';

// Dashboard, admin, members — all mount the same merchant SPA shell.
// The SPA itself (react-router-dom BrowserRouter) takes over routing
// for all /dashboard, /admin, /members, /offers etc. paths.
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

export default function DashboardPage() {
  return <MerchantApp />;
}
