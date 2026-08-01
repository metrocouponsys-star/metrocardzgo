import React, { useState, useEffect, Component } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../api';

// ─── Error Boundary ────────────────────────────────────────────────────────
// Catches rendering errors inside any page and shows a recovery UI.
// This prevents a single broken page from crashing the entire app.
interface EBState { hasError: boolean; message: string }
class PageErrorBoundary extends Component<{ children: React.ReactNode }, EBState> {
  state: EBState = { hasError: false, message: '' };
  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, message: err.message };
  }
  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error('[PageErrorBoundary]', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-[32px]">error_outline</span>
          </div>
          <div>
            <p className="text-lg font-bold text-[#111111] mb-1">Something went wrong</p>
            <p className="text-sm text-[#6B7280] max-w-xs">{this.state.message}</p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload(); }}
            className="btn-outline flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MERCHANT_NAV = [
  { to: '/dashboard',        icon: 'dashboard',        label: 'Dashboard',   roles: ['owner', 'staff'] },
  { to: '/members',          icon: 'groups',            label: 'Members',     roles: ['owner', 'staff'] },
  { to: '/members/search?tab=qr', icon: 'qr_code_scanner', label: 'Scan',    roles: ['owner', 'staff'] },
  { to: '/cards',            icon: 'credit_card',       label: 'Cards',       roles: ['owner'] },
  { to: '/offers',           icon: 'local_offer',       label: 'Offers',      roles: ['owner'] },
  { to: '/membership-types', icon: 'card_membership',   label: 'Memberships', roles: ['owner'] },
  { to: '/rewards',          icon: 'workspace_premium', label: 'Rewards',     roles: ['owner'] },
  { to: '/campaigns',        icon: 'campaign',          label: 'Campaigns',   roles: ['owner'] },
  { to: '/reports',          icon: 'bar_chart',         label: 'Reports',     roles: ['owner'] },
  { to: '/settings',         icon: 'settings',          label: 'Settings',    roles: ['owner'] },
];

const ADMIN_NAV = [
  { to: '/admin',           icon: 'dashboard',   label: 'Dashboard', roles: ['super_admin'] },
  { to: '/admin/merchants', icon: 'storefront',  label: 'Merchants', roles: ['super_admin'] },
  { to: '/admin/members',   icon: 'groups',      label: 'Members',   roles: ['super_admin'] },
  { to: '/admin/cards',     icon: 'credit_card', label: 'Inventory', roles: ['super_admin'] },
  { to: '/admin/reports',   icon: 'bar_chart',   label: 'Reports',   roles: ['super_admin'] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, updateUser, logout, originalAdminUser, stopImpersonating } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-sync merchant profile logo to sidebar on mount if not already cached in user state
  useEffect(() => {
    if (user?.merchant_id && !user?.logo_url && user?.role !== 'super_admin') {
      api.getMerchantProfile().then(m => {
        if (m?.logo_url) updateUser({ logo_url: m.logo_url });
      }).catch(() => {});
    }
  }, [user?.merchant_id]);

  // ── Global keyboard shortcut: Ctrl+K / ⌘K → go to Members (search/scan) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/members/search?tab=qr');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const navItems = user?.role === 'super_admin' ? ADMIN_NAV :
    MERCHANT_NAV.filter(n => n.roles.includes(user?.role || ''));

  const mobileNavItems = navItems.slice(0, 4);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex">
      {/* ── Desktop Sidebar — pure white, minimal right border ────────────── */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 w-64 border-r border-[#E5E7EB] bg-white shadow-nav">

        {/* Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-[#F3F4F6]">
          {/* Logo container — soft gold tint, not heavy fill */}
          <div className="w-10 h-10 rounded-xl bg-[#F5EDD0] flex items-center justify-center shrink-0 overflow-hidden">
            {user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[#B8941F] text-[22px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                credit_card
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#111111] leading-tight truncate">
              {user?.role !== 'super_admin' && user?.merchant_name ? user.merchant_name : 'Metro Cardz'}
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
              {user?.role === 'super_admin' ? 'Super Admin' : user?.merchant_name ? 'Loyalty Manager' : 'Metro Cardz'}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/members' || item.to === '/dashboard' || item.to === '/admin' || item.to.startsWith('/members/search')}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
                ${isActive
                  // PREMIUM active state: gold left-border + soft gold tint bg + gold text
                  ? 'bg-[#FBF7EA] text-[#B8941F] font-semibold border-l-[3px] border-[#B8941F] pl-[calc(0.75rem-3px)]'
                  : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111111] border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-[20px] shrink-0"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Quick search hint */}
          <button
            onClick={() => navigate('/members/search?tab=qr')}
            className="w-full mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#9CA3AF] hover:bg-[#F9FAFB] hover:text-[#6B7280] transition-colors text-xs border border-dashed border-[#E5E7EB] group"
          >
            <span className="material-symbols-outlined text-[15px]">search</span>
            <span className="flex-1 text-left">Search members</span>
            <kbd className="text-[10px] bg-[#F3F4F6] px-1.5 py-0.5 rounded font-mono text-[#9CA3AF] group-hover:text-[#6B7280] transition-colors">
              Ctrl K
            </kbd>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-[#F3F4F6]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#F5EDD0] flex items-center justify-center text-[#B8941F] font-bold text-sm overflow-hidden shrink-0">
              {user?.logo_url ? (
                <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#111111] truncate">{user?.name}</p>
              <p className="text-[11px] text-[#9CA3AF] capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111111] text-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Header — pure white, minimal shadow ────────────────────── */}
      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-white shadow-nav border-b border-[#F3F4F6]">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
          <div className="w-8 h-8 rounded-xl bg-[#F5EDD0] flex items-center justify-center shrink-0 overflow-hidden">
            {user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[#B8941F] text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                credit_card
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-[#111111] truncate">
            {user?.role !== 'super_admin' && user?.merchant_name ? user.merchant_name : 'Metro Cardz'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#F5EDD0] flex items-center justify-center text-[#B8941F] font-bold text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors font-medium"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[15px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 animate-fade-in flex flex-col min-h-screen">
        {/* Impersonation banner */}
        {originalAdminUser && (
          <div className="bg-amber-500 text-white font-semibold px-4 py-3 flex items-center justify-between shadow-sm relative z-30 shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined animate-pulse text-[18px]">admin_panel_settings</span>
              <span>Impersonating {user?.merchant_name} (Logged in as Owner)</span>
            </div>
            <button
              onClick={stopImpersonating}
              className="bg-white text-amber-700 font-bold px-3 py-1 rounded-lg text-xs shadow hover:bg-amber-50 transition-colors"
            >
              Exit Impersonation
            </button>
          </div>
        )}
        <div className="flex-1">
          <PageErrorBoundary>
            {children}
          </PageErrorBoundary>
        </div>
      </main>

      {/* ── Mobile Bottom Navigation — pure white ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[990] flex justify-around items-center px-2 py-2 bg-white shadow-[0_-1px_0_0_#F3F4F6,0_-4px_16px_rgba(0,0,0,0.06)] border-t border-[#F3F4F6] select-none"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))', WebkitTapHighlightColor: 'transparent' }}
      >
        {mobileNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/members' || item.to === '/dashboard' || item.to === '/admin' || item.to.startsWith('/members/search')}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all active:scale-95 cursor-pointer touch-manipulation min-w-[56px]
              ${isActive ? 'bg-[#FBF7EA] text-[#B8941F]' : 'text-[#9CA3AF]'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* Super Admin / Staff logout or More drawer */}
        {user?.role === 'super_admin' || navItems.length <= 3 ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center justify-center px-3 py-1.5 text-[#9CA3AF] hover:text-red-600 min-w-[56px] cursor-pointer touch-manipulation active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="text-[10px] font-semibold mt-0.5">Sign Out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(true);
            }}
            className="flex flex-col items-center justify-center px-3 py-1.5 text-[#9CA3AF] min-w-[56px] cursor-pointer touch-manipulation active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            <span className="text-[10px] font-semibold mt-0.5">More</span>
          </button>
        )}
      </nav>

      {/* ── Mobile Drawer — pure white ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 shadow-modal animate-slide-up max-h-[85vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="w-10 h-1 bg-[#E5E7EB] rounded-full mx-auto mb-5" />
            <div className="space-y-0.5">
              {navItems.slice(4).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-medium cursor-pointer touch-manipulation active:scale-[0.98]
                    ${isActive
                      ? 'bg-[#FBF7EA] text-[#B8941F] font-semibold border-l-[3px] border-[#B8941F] pl-[calc(1rem-3px)]'
                      : 'text-[#6B7280] hover:bg-[#F9FAFB] border-l-[3px] border-transparent pl-[calc(1rem-3px)]'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[#6B7280] hover:bg-[#F9FAFB] text-sm font-medium cursor-pointer touch-manipulation active:scale-[0.98] border-l-[3px] border-transparent pl-[calc(1rem-3px)]"
              >
                <span className="material-symbols-outlined text-[22px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
