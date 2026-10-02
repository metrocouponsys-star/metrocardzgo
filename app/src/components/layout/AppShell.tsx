import React, { useState, useEffect, Component } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../api';
import { cached } from '../../api/cache';

// ─── Error Boundary ────────────────────────────────────────────────────────
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
  { to: '/dashboard',        icon: 'dashboard',       label: 'Dashboard',    roles: ['owner', 'staff'], group: 'core' },
  { to: '/members',          icon: 'groups',          label: 'Members',      roles: ['owner', 'staff'], group: 'core' },
  { to: '/members/search?tab=qr', icon: 'qr_code_scanner', label: 'Scan',   roles: ['owner', 'staff'], group: 'core' },
  { to: '/cards',            icon: 'credit_card',     label: 'Cards',        roles: ['owner'], group: 'manage' },
  { to: '/celebrations',     icon: 'cake',            label: 'Celebrations', roles: ['owner', 'staff'], group: 'manage' },
  { to: '/offers',           icon: 'local_offer',     label: 'Offers',       roles: ['owner'], group: 'manage' },
  { to: '/membership-types', icon: 'card_membership', label: 'Memberships',  roles: ['owner'], group: 'manage' },
  { to: '/rewards',          icon: 'workspace_premium', label: 'Rewards',    roles: ['owner'], group: 'manage' },
  { to: '/campaigns',        icon: 'campaign',        label: 'Campaigns',    roles: ['owner'], group: 'manage' },
  { to: '/reports',          icon: 'bar_chart',       label: 'Reports',      roles: ['owner'], group: 'tools' },
  { to: '/settings',         icon: 'settings',        label: 'Settings',     roles: ['owner'], group: 'tools' },
];

const ADMIN_NAV = [
  { to: '/admin',           icon: 'dashboard',   label: 'Dashboard', roles: ['super_admin'], group: 'core' },
  { to: '/admin/merchants', icon: 'storefront',  label: 'Merchants', roles: ['super_admin'], group: 'core' },
  { to: '/admin/members',   icon: 'groups',      label: 'Members',   roles: ['super_admin'], group: 'core' },
  { to: '/admin/cards',     icon: 'credit_card', label: 'Inventory', roles: ['super_admin'], group: 'core' },
  { to: '/admin/reports',   icon: 'bar_chart',   label: 'Reports',   roles: ['super_admin'], group: 'core' },
];

const GROUP_LABELS: Record<string, string> = {
  core:   'Overview',
  manage: 'Management',
  tools:  'Tools',
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, updateUser, logout, originalAdminUser, stopImpersonating } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-sync merchant profile logo
  useEffect(() => {
    if (user?.merchant_id && !user?.logo_url && user?.role !== 'super_admin') {
      api.getMerchantProfile().then(m => {
        if (m?.logo_url) updateUser({ logo_url: m.logo_url });
      }).catch(() => {});
    }
  }, [user?.merchant_id]);

  // Prefetch warmup
  useEffect(() => {
    if (!user?.merchant_id || user?.role === 'super_admin') return;
    const mId = user.merchant_id;
    const t = setTimeout(() => {
      cached(`dashboard/${mId}`, () => api.getDashboardStats(mId)).catch(() => {});
      cached(`offers/${mId}`, () => api.getOfferTemplates(mId)).catch(() => {});
      cached(`membership-types/${mId}`, () => api.getMembershipTypes(mId)).catch(() => {});
      cached(`rewards/${mId}`, () => api.getRewards(mId)).catch(() => {});
      cached(`points-rules/${mId}`, () => api.getPointsRules(mId)).catch(() => {});
      cached(`coupons/${mId}`, () => api.getCoupons(mId)).catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [user?.merchant_id]);

  // Keyboard shortcut: Ctrl+K / ⌘K
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

  return (
    <div className="min-h-screen bg-surface flex">

      {/* ═══════════════════════════════════════════════════════════════════════
          Desktop Sidebar — Light Theme
          ═══════════════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 w-[240px] bg-white border-r border-outline-variant/40">
        {/* Brand Header */}
        <div className="p-4 flex items-center gap-3 border-b border-outline-variant/30">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/15 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
            {user?.role !== 'super_admin' && user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="material-symbols-outlined text-accent text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-on-surface leading-tight truncate font-display">
              {user?.role !== 'super_admin' && user?.merchant_name ? user.merchant_name : 'Metro Cardz'}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              {user?.role === 'super_admin' ? 'Super Admin' : 'Loyalty Platform'}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-3 px-2.5 space-y-4 overflow-y-auto custom-scrollbar">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group}>
              <p className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant/40">
                {GROUP_LABELS[group] || group}
              </p>
              <div className="space-y-0.5">
                {items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/members' || item.to === '/dashboard' || item.to === '/admin' || item.to.startsWith('/members/search')}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-200 text-[13px] font-semibold group
                      ${isActive
                        ? 'bg-accent/[0.08] text-accent'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${
                          isActive
                            ? 'bg-accent text-white shadow-sm shadow-accent/20'
                            : 'text-on-surface-variant group-hover:text-on-surface'
                        }`}>
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {item.icon}
                          </span>
                        </div>
                        <span className="flex-1 truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          {/* Search hint */}
          <button
            onClick={() => navigate('/members/search?tab=qr')}
            className="w-full mt-1 flex items-center gap-2 px-2.5 py-2 rounded-xl text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container transition-all text-[12px] border border-dashed border-outline-variant/60 group"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span className="flex-1 text-left">Search members</span>
            <kbd className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded font-mono text-on-surface-variant/50 border border-outline-variant/60">
              ⌘K
            </kbd>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-outline-variant/30">
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center text-accent font-bold text-[12px] shrink-0 ring-1 ring-accent/15">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-on-surface truncate">{user?.name}</p>
              <p className="text-[11px] text-on-surface-variant capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-on-surface-variant hover:bg-error/[0.06] hover:text-error text-[12px] font-semibold transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          Mobile Header — Light
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-white/95 backdrop-blur-xl border-b border-outline-variant/40 shadow-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/15 flex items-center justify-center shrink-0 overflow-hidden">
            {user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-accent text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            )}
          </div>
          <span className="text-[14px] font-bold text-on-surface truncate font-display">
            {user?.role !== 'super_admin' && user?.merchant_name ? user.merchant_name : 'Metro Cardz'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center text-accent font-bold text-[12px] ring-1 ring-accent/15">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-[11px] text-on-surface-variant bg-surface-container hover:bg-error/5 hover:text-error px-2.5 py-1.5 rounded-lg border border-outline-variant/50 transition-colors font-semibold"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            <span className="hidden xs:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          Main Content
          ═══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 md:ml-[240px] pt-14 md:pt-0 pb-20 md:pb-0 animate-fade-in flex flex-col min-h-screen bg-surface">
        {originalAdminUser && (
          <div className="bg-tertiary text-on-tertiary font-bold px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2 text-body-md">
              <span className="material-symbols-outlined animate-pulse text-[20px]">admin_panel_settings</span>
              <span>Impersonating {user?.merchant_name}</span>
            </div>
            <button onClick={stopImpersonating} className="bg-white/20 hover:bg-white/30 font-bold px-3 py-1 rounded-lg text-label-sm transition-colors">
              Exit
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
          Mobile Bottom Navigation — Light Floating Bar
          ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[990] flex justify-around items-end px-2 pt-2 pb-2 bg-white/95 backdrop-blur-xl border-t border-outline-variant/40 shadow-[0_-4px_20px_rgba(15,23,42,0.05)] select-none"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))', WebkitTapHighlightColor: 'transparent' }}
      >
        {mobileNavItems.map((item) => {
          const isScanBtn = item.icon === 'qr_code_scanner';
          if (isScanBtn) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.startsWith('/members/search')}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center -mt-4 cursor-pointer touch-manipulation active:scale-95 transition-all
                  ${isActive ? 'text-accent' : 'text-on-surface-variant'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-elevated transition-all duration-200 border ${
                      isActive
                        ? 'bg-accent text-white border-accent shadow-glow-accent'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/40'
                    }`} style={{ width: 52, height: 52 }}>
                      <span className="material-symbols-outlined text-[24px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
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
                    isActive ? 'bg-accent/[0.10]' : ''
                  }`}>
                    <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                  </div>
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

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
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(true); }}
            className="flex flex-col items-center justify-center px-3 py-1.5 text-on-surface-variant min-w-[52px] cursor-pointer touch-manipulation active:scale-95"
          >
            <div className="w-10 h-7 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            </div>
            <span className="text-[10px] font-medium mt-0.5">More</span>
          </button>
        )}
      </nav>

      {/* Mobile Drawer for More Items */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 shadow-dialog animate-slide-up max-h-[85vh] overflow-y-auto" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="w-10 h-1 bg-outline-variant/50 rounded-full mx-auto mb-4" />
            <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">More Options</p>
            <div className="space-y-1">
              {navItems.slice(4).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-semibold text-[13px] cursor-pointer touch-manipulation active:scale-[0.98]
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
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-on-surface-variant hover:bg-error/5 hover:text-error font-semibold text-[13px] cursor-pointer touch-manipulation active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container">
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
