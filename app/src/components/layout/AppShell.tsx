import React, { useState, useEffect, Component } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../api';
import { cached } from '../../api/cache';

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
            className="btn-primary flex items-center gap-2"
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
  { to: '/dashboard',        icon: 'dashboard',       label: 'Dashboard',   roles: ['owner', 'staff'], group: 'core' },
  { to: '/members',          icon: 'groups',          label: 'Members',     roles: ['owner', 'staff'], group: 'core' },
  { to: '/members/search?tab=qr', icon: 'qr_code_scanner', label: 'Scan',   roles: ['owner', 'staff'], group: 'core' },
  { to: '/cards',            icon: 'credit_card',     label: 'Cards',       roles: ['owner'], group: 'manage' },
  { to: '/celebrations',     icon: 'cake',            label: 'Celebrations',roles: ['owner', 'staff'], group: 'manage' },
  { to: '/offers',           icon: 'local_offer',     label: 'Offers',      roles: ['owner'], group: 'manage' },
  { to: '/membership-types', icon: 'card_membership', label: 'Memberships', roles: ['owner'], group: 'manage' },
  { to: '/rewards',          icon: 'workspace_premium', label: 'Rewards',   roles: ['owner'], group: 'manage' },
  { to: '/campaigns',        icon: 'campaign',        label: 'Campaigns',   roles: ['owner'], group: 'manage' },
  { to: '/reports',          icon: 'bar_chart',       label: 'Reports',     roles: ['owner'], group: 'tools' },
  { to: '/settings',         icon: 'settings',        label: 'Settings',    roles: ['owner'], group: 'tools' },
];

const ADMIN_NAV = [
  { to: '/admin',           icon: 'dashboard',   label: 'Dashboard', roles: ['super_admin'], group: 'core' },
  { to: '/admin/merchants', icon: 'storefront',  label: 'Merchants', roles: ['super_admin'], group: 'core' },
  { to: '/admin/members',   icon: 'groups',      label: 'Members',   roles: ['super_admin'], group: 'core' },
  { to: '/admin/cards',     icon: 'credit_card', label: 'Inventory', roles: ['super_admin'], group: 'core' },
  { to: '/admin/reports',   icon: 'bar_chart',   label: 'Reports',   roles: ['super_admin'], group: 'core' },
];

const GROUP_LABELS: Record<string, string> = {
  core: 'Overview',
  manage: 'Management',
  tools: 'Tools',
};

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

  // ── Prefetch warmup: load all common data into cache after login ────────────
  // Fires silently in the background so first navigation to any page feels instant.
  useEffect(() => {
    if (!user?.merchant_id || user?.role === 'super_admin') return;
    const mId = user.merchant_id;
    // Use setTimeout(0) so this doesn't block the current critical render
    const t = setTimeout(() => {
      // Dashboard stats — most important, shown on /dashboard
      cached(`dashboard/${mId}`, () => api.getDashboardStats(mId)).catch(() => {});
      // Config data — offers, membership types, rewards, points rules, coupons
      cached(`offers/${mId}`, () => api.getOfferTemplates(mId)).catch(() => {});
      cached(`membership-types/${mId}`, () => api.getMembershipTypes(mId)).catch(() => {});
      cached(`rewards/${mId}`, () => api.getRewards(mId)).catch(() => {});
      cached(`points-rules/${mId}`, () => api.getPointsRules(mId)).catch(() => {});
      cached(`coupons/${mId}`, () => api.getCoupons(mId)).catch(() => {});
    }, 0);
    return () => clearTimeout(t);
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

  // Group nav items for sidebar
  const groupedNav = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    const group = (item as any).group || 'core';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ═══════════════════════════════════════════════════════════════════════
          Desktop Sidebar — Dark Premium
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 w-[260px] bg-sidebar border-r border-white/[0.06]">
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-lg overflow-hidden shrink-0 ring-1 ring-white/10 p-1.5">
            {user?.role !== 'super_admin' && user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <img src="/logo.png" alt="Metro Cardz" className="w-full h-full object-contain brightness-0 invert" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-white leading-tight truncate font-display">
              {user?.role !== 'super_admin' && user?.merchant_name ? user.merchant_name : 'Metro Cardz'}
            </p>
            <p className="text-[11px] font-medium text-sidebar-text mt-0.5 truncate">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Loyalty Platform'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Nav Links — Grouped */}
        <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto custom-scrollbar">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group}>
              {/* Group Label */}
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-sidebar-text/50">
                {GROUP_LABELS[group] || group}
              </p>
              <div className="space-y-0.5">
                {items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/members' || item.to === '/dashboard' || item.to === '/admin' || item.to.startsWith('/members/search')}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-semibold group
                      ${isActive
                        ? 'bg-accent/15 text-accent'
                        : 'text-sidebar-text hover:bg-white/[0.06] hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          isActive
                            ? 'bg-accent text-white shadow-md shadow-accent/30'
                            : 'bg-white/[0.06] text-sidebar-text group-hover:text-white'
                        }`}>
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {item.icon}
                          </span>
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {isActive && <div className="w-1.5 h-5 rounded-full bg-accent/60" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Quick search hint */}
          <button
            onClick={() => navigate('/members/search?tab=qr')}
            className="w-full mt-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sidebar-text/60 hover:text-sidebar-text hover:bg-white/[0.04] transition-all text-[12px] border border-dashed border-white/10 group"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span className="flex-1 text-left">Search members</span>
            <kbd className="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded font-mono text-sidebar-text/40 group-hover:text-sidebar-text/60 transition-colors border border-white/[0.06]">
              ⌘K
            </kbd>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-4">
          {/* Divider */}
          <div className="mb-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center text-accent font-bold text-sm overflow-hidden shrink-0 ring-1 ring-accent/20">
              {user?.logo_url ? (
                <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-sidebar-text capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sidebar-text hover:bg-error/10 hover:text-error text-[13px] font-medium transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          Mobile Header — Compact with blur
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-white/90 backdrop-blur-xl border-b border-outline-variant/40">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shrink-0 overflow-hidden text-on-accent shadow-sm">
            {user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-accent text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            )}
          </div>
          <span className="text-[15px] font-bold text-on-surface truncate font-display">
            {user?.role !== 'super_admin' && user?.merchant_name ? user.merchant_name : 'Metro Cardz'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="avatar avatar--sm avatar--accent text-[11px]">
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
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold px-4 py-3 flex items-center justify-between shadow-md relative z-30 shrink-0">
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
          Mobile Bottom Navigation — Floating Pill Bar
          ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[990] flex justify-around items-end px-2 pt-2 pb-2 nav-floating select-none"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))', WebkitTapHighlightColor: 'transparent' }}
      >
        {mobileNavItems.map((item) => {
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
                  ${isActive ? 'text-accent' : 'text-on-surface-variant'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-accent to-accent-hover text-white scale-105 shadow-accent/30'
                        : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40'
                    }`}>
                      <span className="material-symbols-outlined text-[26px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
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
                ${isActive ? 'text-accent' : 'text-on-surface-variant'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-10 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive ? 'bg-accent/[0.12]' : ''
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
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 shadow-dialog animate-slide-up max-h-[85vh] overflow-y-auto" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full mx-auto mb-4" />
            <p className="px-4 mb-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/50">More Options</p>
            <div className="space-y-1">
              {navItems.slice(4).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-[13px] cursor-pointer touch-manipulation active:scale-[0.98]
                    ${isActive ? 'bg-accent/[0.08] text-accent' : 'text-on-surface-variant hover:bg-surface-container'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-accent text-white' : 'bg-surface-container text-on-surface-variant'
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
