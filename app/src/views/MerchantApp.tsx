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

// Admin views
import AdminDashboardPage from './admin/AdminDashboardPage';
import MerchantManagementPage from './admin/MerchantManagementPage';
import CardInventoryPage from './admin/CardInventoryPage';
import AdminMembersPage from './admin/AdminMembersPage';
import AdminReportsPage from './admin/AdminReportsPage';

// Public views
import PublicMemberPage from './public/PublicMemberPage';

// Route guards
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'super_admin' ? '/admin' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

export default function MerchantApp() {
  const { isAuthenticated, user } = useAuthStore();
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/m/:token" element={<PublicMemberPage />} />

        {/* Auth */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><DashboardPage /></AppShell></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><MembersListPage /></AppShell></ProtectedRoute>} />
        <Route path="/members/search" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><SearchMemberPage /></AppShell></ProtectedRoute>} />
        <Route path="/members/new" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><AddMemberPage /></AppShell></ProtectedRoute>} />
        <Route path="/members/:id" element={<ProtectedRoute roles={['owner', 'staff']}><AppShell><MemberProfilePage /></AppShell></ProtectedRoute>} />
        <Route path="/offers" element={<ProtectedRoute roles={['owner']}><AppShell><OffersPage /></AppShell></ProtectedRoute>} />
        <Route path="/membership-types" element={<ProtectedRoute roles={['owner']}><AppShell><MembershipTypesPage /></AppShell></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={['owner']}><AppShell><ReportsPage /></AppShell></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute roles={['owner']}><AppShell><CampaignsPage /></AppShell></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={['owner']}><AppShell><SettingsPage /></AppShell></ProtectedRoute>} />
        <Route path="/cards" element={<ProtectedRoute roles={['owner']}><AppShell><CardInventoryMerchantPage /></AppShell></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute roles={['owner']}><AppShell><RewardsPage /></AppShell></ProtectedRoute>} />

        {/* Admin Panel */}
        <Route path="/admin" element={<ProtectedRoute roles={['super_admin']}><AppShell><AdminDashboardPage /></AppShell></ProtectedRoute>} />
        <Route path="/admin/merchants" element={<ProtectedRoute roles={['super_admin']}><AppShell><MerchantManagementPage /></AppShell></ProtectedRoute>} />
        <Route path="/admin/members" element={<ProtectedRoute roles={['super_admin']}><AppShell><AdminMembersPage /></AppShell></ProtectedRoute>} />
        <Route path="/admin/cards" element={<ProtectedRoute roles={['super_admin']}><AppShell><CardInventoryPage /></AppShell></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['super_admin']}><AppShell><AdminReportsPage /></AppShell></ProtectedRoute>} />

        {/* Catch-all — redirect unknown paths to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
