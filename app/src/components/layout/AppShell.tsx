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
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-error-container text-[32px]">error_outline</span>
          </div>
          <div>
            <p className="text-body-lg font-bold text-on-surface mb-1">Something went wrong</p>
            <p className="text-body-md text-on-surface-variant max-w-xs">{this.state.message}</p>
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
  { to: '/dashboard',        icon: 'dashboard',       label: 'Dashboard',   roles: ['owner', 'staff'] },
  { to: '/members',          icon: 'groups',          label: 'Members',     roles: ['owner', 'staff'] },
  { to: '/members/search?tab=qr', icon: 'qr_code_scanner', label: 'Scan',   roles: ['owner', 'staff'] },
  { to: '/cards',            icon: 'credit_card',     label: 'Cards',       roles: ['owner'] },
  { to: '/offers',           icon: 'local_offer',     label: 'Offers',      roles: ['owner'] },
  { to: '/membership-types', icon: 'card_membership', label: 'Memberships', roles: ['owner'] },
  { to: '/rewards',          icon: 'workspace_premium', label: 'Rewards',   roles: ['owner'] },
  { to: '/campaigns',        icon: 'campaign',        label: 'Campaigns',   roles: ['owner'] },
  { to: '/reports',          icon: 'bar_chart',       label: 'Reports',     roles: ['owner'] },
  { to: '/settings',         icon: 'settings',        label: 'Settings',    roles: ['owner'] },
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
    <div className="min-h-screen bg-background flex">
      {/* ═══════════════════════════════════════════════════════════════════════
          Desktop Sidebar — Frosted Glass
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 w-[260px] glass-surface border-r border-primary/[0.06]">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shadow-lg overflow-hidden shrink-0 ring-2 ring-primary/10">
            {user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-on-surface leading-tight truncate">
              {user?.role !== 'super_admin' && user?.merchant_name ? user.merchant_name : 'Metro Cardz'}
            </p>
            <p className="text-[11px] font-medium text-on-surface-variant mt-0.5 truncate">
              {user?.role === 'super_admin' ? 'Super Admin Panel' : 'Loyalty Manager'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

        {/* Nav Links */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/members' || item.to === '/dashboard' || item.to === '/admin' || item.to.startsWith('/members/search')}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-semibold
                ${isActive
                  ? 'bg-primary/[0.08] text-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-primary/[0.04] hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {isActive && <div className="w-1.5 h-5 rounded-full bg-primary/40" />}
                </>
              )}
            </NavLink>
          ))}

          {/* Quick search hint */}
          <button
            onClick={() => navigate('/members/search?tab=qr')}
            className="w-full mt-4 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors text-[12px] border border-dashed border-outline-variant/40 group"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span className="flex-1 text-left">Search members</span>
            <kbd className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded-md font-mono text-on-surface-variant/50 group-hover:text-on-surface-variant transition-colors">
              ⌘K
            </kbd>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-4">
          {/* Divider */}
          <div className="mb-3 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0 ring-1 ring-primary/10">
              {user?.logo_url ? (
                <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-on-surface truncate">{user?.name}</p>
              <p className="text-[11px] text-on-surface-variant capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-error/5 hover:text-error text-[13px] font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          Mobile Header
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 glass-surface border-b border-primary/[0.06]">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0 overflow-hidden text-on-primary shadow-sm">
            {user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            )}
          </div>
          <span className="text-[15px] font-bold text-on-surface truncate">
            {user?.role !== 'super_admin' && user?.merchant_name ? user.merchant_name : 'Metro Cardz'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary/[0.08] flex items-center justify-center text-primary font-bold text-[13px]">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] text-error/80 bg-error/5 hover:bg-error/10 px-2.5 py-1.5 rounded-lg border border-error/10 transition-colors font-semibold"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          Main Content
          ═══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 pb-20 md:pb-0 animate-fade-in flex flex-col min-h-screen">
        {originalAdminUser && (
          <div className="bg-amber-600 text-white font-bold px-4 py-3 flex items-center justify-between shadow-md relative z-30 shrink-0">
            <div className="flex items-center gap-2 text-body-md">
              <span className="material-symbols-outlined animate-pulse text-[20px]">admin_panel_settings</span>
              <span>Impersonating {user?.merchant_name} (Logged in as Owner)</span>
            </div>
            <button onClick={stopImpersonating} className="bg-white text-amber-800 font-bold px-3 py-1 rounded-lg text-label-sm shadow hover:bg-amber-50 transition-colors">
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

      {/* ═══════════════════════════════════════════════════════════════════════
          Mobile Bottom Navigation — Floating Glass Bar
          ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[990] flex justify-around items-end px-2 pt-2 pb-2 nav-floating select-none"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))', WebkitTapHighlightColor: 'transparent' }}
      >
        {mobileNavItems.map((item, idx) => {
          // Center scan button gets special elevated treatment
          const isScanBtn = item.icon === 'qr_code_scanner';

          if (isScanBtn) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.startsWith('/members/search')}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center -mt-5 cursor-pointer touch-manipulation active:scale-95 transition-all
                  ${isActive ? 'text-primary' : 'text-on-surface-variant'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary scale-105'
                        : 'bg-gradient-to-br from-primary/90 to-primary-container/90 text-on-primary'
                    }`}>
                      <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                    </div>
                    <span className="text-[10px] font-bold mt-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/members' || item.to === '/dashboard' || item.to === '/admin'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all active:scale-95 cursor-pointer touch-manipulation min-w-[52px]
                ${isActive ? 'text-primary' : 'text-on-surface-variant'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-10 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive ? 'bg-primary/[0.12]' : ''
                  }`}>
                    <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                  </div>
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
        {/* Super Admin / Staff logout or More drawer toggle for owners */}
        {user?.role === 'super_admin' || navItems.length <= 3 ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center justify-center px-3 py-1.5 text-on-surface-variant hover:text-error min-w-[52px] cursor-pointer touch-manipulation active:scale-95"
          >
            <div className="w-10 h-7 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </div>
            <span className="text-[10px] font-medium mt-0.5">Sign Out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(true);
            }}
            className="flex flex-col items-center justify-center px-3 py-1.5 text-on-surface-variant min-w-[52px] cursor-pointer touch-manipulation active:scale-95"
          >
            <div className="w-10 h-7 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            </div>
            <span className="text-[10px] font-medium mt-0.5">More</span>
          </button>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          Mobile Drawer for More Items
          ═══════════════════════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
          {/* FIX C: Use onClick only. e.preventDefault() on touchend was suppressing
              the synthetic click event system-wide on iOS Safari for subsequent interactions. */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl p-5 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full mx-auto mb-4" />
            <div className="space-y-1">
              {navItems.slice(4).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-[13px] cursor-pointer touch-manipulation active:scale-[0.98]
                    ${isActive ? 'bg-primary/[0.08] text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-[20px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                      </div>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-error/5 hover:text-error font-semibold text-[13px] cursor-pointer touch-manipulation active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </div>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
