'use client';

// ─── MerchantApp ─────────────────────────────────────────────────────────────
// Full React Router SPA for the merchant dashboard.
// This replaces the old App.tsx entry point when running inside Next.js.
// It is dynamically imported with ssr:false so react-router-dom works correctly.

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ToastContainer } from '../components/ui/ToastContainer';
import { AppShell } from '../components/layout/AppShell';

// Auth views
import LoginPage from './auth/LoginPage';

// Merchant views
import DashboardPage from './merchant/DashboardPage';
import QrScanPage from './merchant/QrScanPage';
import SearchMemberPage from './merchant/SearchMemberPage';
import MembersListPage from './merchant/MembersListPage';
import MemberProfilePage from './merchant/MemberProfilePage';
import AddMemberPage from './merchant/AddMemberPage';
import OffersPage from './merchant/OffersPage';
import MembershipTypesPage from './merchant/MembershipTypesPage';
import ReportsPage from './merchant/ReportsPage';
import CampaignsPage from './merchant/CampaignsPage';
import SettingsPage from './merchant/SettingsPage';
import CardInventoryMerchantPage from './merchant/CardInventoryMerchantPage';
import RewardsPage from './merchant/RewardsPage';
import CelebrationsPage from './merchant/CelebrationsPage';

// Admin views
import AdminDashboardPage from './admin/AdminDashboardPage';
import MerchantManagementPage from './admin/MerchantManagementPage';
import CardInventoryPage from './admin/CardInventoryPage';
import AdminMembersPage from './admin/AdminMembersPage';
import AdminReportsPage from './admin/AdminReportsPage';

// Public views
import PublicMemberPage from './public/PublicMemberPage';
import CheckMembershipPage from './public/CheckMembershipPage';

// ── Shared loading spinner shown while Zustand hydrates from localStorage ──
function HydrationSpinner() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #FFE8DF', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: '#64748B', fontFamily: 'Inter, system-ui, sans-serif' }}>Loading…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Route guards
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  // Wait for Zustand to rehydrate from localStorage before making routing decisions.
  // Without this, the store briefly shows isAuthenticated=false → redirect loop.
  if (!_hasHydrated) return <HydrationSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    const fallback = user.role === 'staff' ? '/portal/members/search?tab=qr' : '/portal/dashboard';
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  // Same hydration guard — don't redirect to dashboard before we know if auth exists.
  if (!_hasHydrated) return <HydrationSpinner />;
  if (isAuthenticated) {
    const target =
      user?.role === 'super_admin' ? '/portal/admin'
      : user?.role === 'staff'       ? '/portal/members/search?tab=qr'
      : '/portal/dashboard';
    return <Navigate to={target} replace />;
  }
  return <>{children}</>;
}

export default function MerchantApp() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* ── Public routes (no auth needed) ─────────────────────────────── */}
        <Route path="/m/:token" element={<PublicMemberPage />} />
        <Route path="/check-membership" element={<CheckMembershipPage />} />

        {/* ── Auth ────────────────────────────────────────────────────────── */}
        {/* /login is the entry; after login BrowserRouter navigates internally */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />

        {/* ── Merchant Portal ─────────────────────────────────────────────── */}
        {/* All merchant routes moved under /portal/* to avoid clashing      */}
        {/* with the GO platform's own Next.js /admin pages                  */}
        <Route path="/portal/dashboard" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/scan" element={<ProtectedRoute roles={['owner', 'staff']}><QrScanPage /></ProtectedRoute>} />
        <Route path="/portal/members" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><MembersListPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/members/search" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><SearchMemberPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/members/new" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><AddMemberPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/members/:id" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><MemberProfilePage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/offers" element={<ProtectedRoute roles={['owner']}><AppShell><OffersPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/membership-types" element={<ProtectedRoute roles={['owner']}><AppShell><MembershipTypesPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/reports" element={<ProtectedRoute roles={['owner']}><AppShell><ReportsPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/campaigns" element={<ProtectedRoute roles={['owner']}><AppShell><CampaignsPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/settings" element={<ProtectedRoute roles={['owner']}><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/cards" element={<ProtectedRoute roles={['owner']}><AppShell><CardInventoryMerchantPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/rewards" element={<ProtectedRoute roles={['owner']}><AppShell><RewardsPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/celebrations" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><CelebrationsPage /></AppShell></ProtectedRoute>} />

        {/* ── Loyalty Platform Admin (separate from GO /admin) ─────────────── */}
        <Route path="/portal/admin" element={<ProtectedRoute roles={['super_admin']}><AppShell><AdminDashboardPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/admin/merchants" element={<ProtectedRoute roles={['super_admin']}><AppShell><MerchantManagementPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/admin/members" element={<ProtectedRoute roles={['super_admin']}><AppShell><AdminMembersPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/admin/cards" element={<ProtectedRoute roles={['super_admin']}><AppShell><CardInventoryPage /></AppShell></ProtectedRoute>} />
        <Route path="/portal/admin/reports" element={<ProtectedRoute roles={['super_admin']}><AppShell><AdminReportsPage /></AppShell></ProtectedRoute>} />

        {/* ── Legacy redirects — old /dashboard, /members etc. → /portal/* ── */}
        <Route path="/dashboard" element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="/dashboard/scan" element={<Navigate to="/portal/scan" replace />} />
        <Route path="/members" element={<Navigate to="/portal/members" replace />} />
        <Route path="/members/search" element={<Navigate to="/portal/members/search" replace />} />
        <Route path="/members/new" element={<Navigate to="/portal/members/new" replace />} />
        <Route path="/offers" element={<Navigate to="/portal/offers" replace />} />
        <Route path="/membership-types" element={<Navigate to="/portal/membership-types" replace />} />
        <Route path="/reports" element={<Navigate to="/portal/reports" replace />} />
        <Route path="/campaigns" element={<Navigate to="/portal/campaigns" replace />} />
        <Route path="/settings" element={<Navigate to="/portal/settings" replace />} />
        <Route path="/cards" element={<Navigate to="/portal/cards" replace />} />
        <Route path="/rewards" element={<Navigate to="/portal/rewards" replace />} />
        <Route path="/celebrations" element={<Navigate to="/portal/celebrations" replace />} />

        {/* ── Catch-all — unauthenticated → login ─────────────────────────── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
