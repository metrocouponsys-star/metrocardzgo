'use client';

import dynamic from 'next/dynamic';

/**
 * Metro Cardz Loyalty Platform — Portal Entry Point
 * ==================================================
 * ALL /portal/* routes (dashboard, members, settings, admin, etc.)
 * are served by this single Next.js page. React Router (BrowserRouter)
 * inside MerchantApp handles all sub-routing client-side.
 *
 * This is the ONLY page that mounts MerchantApp. Previously /login,
 * /dashboard, /members etc. each mounted their own MerchantApp which
 * caused multiple competing BrowserRouters — now fixed.
 */
const MerchantApp = dynamic(
  () => import('@/views/MerchantApp'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        background: '#F8FAFC',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid #FFE8DF',
          borderTopColor: '#FF6B35',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Loading Metro Cardz…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  }
);

export default function PortalPage() {
  return <MerchantApp />;
}
