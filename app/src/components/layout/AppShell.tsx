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
  { to: '/members',          icon: 'groups',          label: 'Members List', roles: ['owner', 'staff'] },
  { to: '/members/search',   icon: 'qr_code_scanner', label: 'Scan & Lookup', roles: ['owner', 'staff'] },
  { to: '/cards',            icon: 'credit_card',     label: 'Cards',       roles: ['owner'] },
  { to: '/offers',           icon: 'local_offer',     label: 'Offers',      roles: ['owner'] },
  { to: '/membership-types', icon: 'card_membership', label: 'Memberships', roles: ['owner'] },
  { to: '/rewards',          icon: 'workspace_premium', label: 'Rewards & Loyalty', roles: ['owner'] },
  { to: '/campaigns',        icon: 'campaign',        label: 'Campaigns',   roles: ['owner'] },
  { to: '/reports',          icon: 'bar_chart',       label: 'Reports',     roles: ['owner'] },
  { to: '/settings',         icon: 'settings',        label: 'Settings',    roles: ['owner'] },
];

const ADMIN_NAV = [
  { to: '/admin',           icon: 'dashboard',   label: 'Dashboard',      roles: ['super_admin'] },
  { to: '/admin/merchants', icon: 'storefront',  label: 'Merchants',      roles: ['super_admin'] },
  { to: '/admin/members',   icon: 'groups',      label: 'All Members',    roles: ['super_admin'] },
  { to: '/admin/cards',     icon: 'credit_card', label: 'Card Inventory', roles: ['super_admin'] },
  { to: '/admin/reports',   icon: 'bar_chart',   label: 'Reports',        roles: ['super_admin'] },
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

  // ── Global keyboard shortcut: Ctrl+K / ⌘K → go to Members (search) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/members');
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 w-64 border-r border-outline-variant bg-surface">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-outline-variant">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg overflow-hidden shrink-0">
            {user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            )}
          </div>
          <div>
            <p className="text-headline-md font-headline-md font-bold text-primary leading-tight">
              {user?.role !== 'super_admin' && user?.merchant_name ? `${user.merchant_name} x Metro Cardz` : 'Metro Cardz'}
            </p>
            <p className="text-label-sm font-label-sm text-on-surface-variant mt-0.5">
              {user?.role === 'super_admin' ? 'Super Admin' : user?.merchant_name || 'Loyalty Manager'}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/members' || item.to === '/dashboard' || item.to === '/admin' || item.to === '/members/search'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-label-md text-label-md
                ${isActive
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </>
              )}
            </NavLink>
          ))}
          {/* Quick search hint */}
          <button
            onClick={() => navigate('/members')}
            className="w-full mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors text-label-sm border border-dashed border-outline-variant/50 group"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span className="flex-1 text-left">Search members</span>
            <kbd className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded font-mono text-on-surface-variant/60 group-hover:text-on-surface-variant transition-colors">
              Ctrl K
            </kbd>
          </button>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-outline-variant">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold overflow-hidden shrink-0">
              {user?.logo_url ? (
                <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label-md font-bold text-on-surface truncate">{user?.name}</p>
              <p className="text-label-sm text-secondary capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-surface shadow-sm border-b border-outline-variant">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 overflow-hidden text-on-primary">
            {user?.logo_url ? (
              <img src={user.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-on-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            )}
          </div>
          <span className="text-headline-md font-headline-md font-bold text-primary truncate">
            {user?.role !== 'super_admin' && user?.merchant_name ? `${user.merchant_name} x Metro Cardz` : 'Metro Cardz'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 pb-20 md:pb-0 animate-fade-in flex flex-col min-h-screen">
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[990] flex justify-around items-center px-2 py-2 bg-surface shadow-[0_-2px_12px_0_rgba(0,0,0,0.08)] border-t border-outline-variant select-none" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))', WebkitTapHighlightColor: 'transparent' }}>
        {mobileNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/members' || item.to === '/dashboard' || item.to === '/admin' || item.to === '/members/search'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all active:scale-95 cursor-pointer touch-manipulation min-w-[56px]
              ${isActive ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                <span className="text-label-sm font-label-sm mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {/* Super Admin explicit logout or More drawer toggle for owners */}
        {user?.role === 'super_admin' ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center justify-center px-3 py-1.5 text-on-surface-variant min-w-[56px] cursor-pointer touch-manipulation active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="text-label-sm font-label-sm mt-0.5">Sign Out</span>
          </button>
        ) : navItems.length > 3 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(true);
            }}
            className="flex flex-col items-center justify-center px-3 py-1.5 text-on-surface-variant min-w-[56px] cursor-pointer touch-manipulation active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            <span className="text-label-sm font-label-sm mt-0.5">More</span>
          </button>
        )}
      </nav>

      {/* Mobile Drawer for More items */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[9999] touch-manipulation" style={{ WebkitTapHighlightColor: 'transparent' }}>
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)} 
            onTouchEnd={(e) => { e.preventDefault(); setMobileMenuOpen(false); }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl p-5 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="w-12 h-1.5 bg-outline-variant rounded-full mx-auto mb-4" />
            <div className="space-y-1">
              {navItems.slice(4).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-label-md text-label-md cursor-pointer touch-manipulation active:scale-[0.98]
                    ${isActive ? 'bg-primary-container/10 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`
                  }
                >
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-label-md cursor-pointer touch-manipulation active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[24px]">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
