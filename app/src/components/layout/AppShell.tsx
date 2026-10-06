import React, { useState, useEffect, Component } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../api';
import { cached } from '../../api/cache';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  sidebar: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  orange: '#FF6B35',
  orangeLight: '#FFF4EF',
  orangeDark: '#E85A28',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  shadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)',
};

// ─── Error Boundary ───────────────────────────────────────────────────────────
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', padding: '24px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#EF4444', fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>error_outline</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '16px', color: T.text, margin: '0 0 6px' }}>Something went wrong</p>
            <p style={{ fontSize: '13px', color: T.textMuted, margin: 0, maxWidth: '300px' }}>{this.state.message}</p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: T.orange, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Navigation config ────────────────────────────────────────────────────────
const MERCHANT_NAV = [
  { to: '/portal/dashboard',             icon: 'dashboard',         label: 'Dashboard',    roles: ['owner', 'staff'], group: 'core' },
  { to: '/portal/members',               icon: 'groups',            label: 'Members',      roles: ['owner', 'staff'], group: 'core' },
  { to: '/portal/members/search?tab=qr', icon: 'qr_code_scanner',   label: 'Scan QR',      roles: ['owner', 'staff'], group: 'core' },
  { to: '/portal/cards',                 icon: 'credit_card',       label: 'Cards',        roles: ['owner'],          group: 'manage' },
  { to: '/portal/celebrations',          icon: 'cake',              label: 'Celebrations', roles: ['owner', 'staff'], group: 'manage' },
  { to: '/portal/offers',                icon: 'local_offer',       label: 'Offers',       roles: ['owner'],          group: 'manage' },
  { to: '/portal/membership-types',      icon: 'card_membership',   label: 'Memberships',  roles: ['owner'],          group: 'manage' },
  { to: '/portal/rewards',               icon: 'workspace_premium', label: 'Rewards',      roles: ['owner'],          group: 'manage' },
  { to: '/portal/campaigns',             icon: 'campaign',          label: 'Campaigns',    roles: ['owner'],          group: 'manage' },
  { to: '/portal/reports',               icon: 'bar_chart',         label: 'Reports',      roles: ['owner'],          group: 'tools' },
  { to: '/portal/settings',              icon: 'settings',          label: 'Settings',     roles: ['owner'],          group: 'tools' },
];

const ADMIN_NAV = [
  { to: '/portal/admin',           icon: 'dashboard',   label: 'Dashboard', roles: ['super_admin'], group: 'core' },
  { to: '/portal/admin/merchants', icon: 'storefront',  label: 'Merchants', roles: ['super_admin'], group: 'core' },
  { to: '/portal/admin/members',   icon: 'groups',      label: 'Members',   roles: ['super_admin'], group: 'core' },
  { to: '/portal/admin/cards',     icon: 'credit_card', label: 'Inventory', roles: ['super_admin'], group: 'core' },
  { to: '/portal/admin/reports',   icon: 'bar_chart',   label: 'Reports',   roles: ['super_admin'], group: 'core' },
];

const GROUP_LABELS: Record<string, string> = {
  core: 'Main',
  manage: 'Manage',
  tools: 'Tools',
};

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
function SideNavItem({ item, isActive, onClick }: {
  item: typeof MERCHANT_NAV[0]; isActive: boolean; onClick?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      end={
        item.to === '/portal/members' ||
        item.to === '/portal/dashboard' ||
        item.to === '/portal/admin' ||
        item.to.startsWith('/portal/members/search')
      }
      style={{ textDecoration: 'none' }}
    >
      {({ isActive: navActive }) => {
        const active = isActive || navActive;
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 10px', borderRadius: '10px', cursor: 'pointer',
            background: active ? T.orangeLight : 'transparent',
            color: active ? T.orangeDark : T.textMuted,
            transition: 'all 0.15s ease',
            marginBottom: '2px',
          }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F1F5F9'; }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? T.orange : 'transparent',
              transition: 'background 0.15s',
            }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '18px', color: active ? '#fff' : T.textMuted, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, lineHeight: 1 }}>{item.label}</span>
          </div>
        );
      }}
    </NavLink>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, updateUser, logout, originalAdminUser, stopImpersonating } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-sync merchant logo
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
    }, 0);
    return () => clearTimeout(t);
  }, [user?.merchant_id]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/portal/members/search?tab=qr');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const navItems = user?.role === 'super_admin'
    ? ADMIN_NAV
    : MERCHANT_NAV.filter(n => n.roles.includes(user?.role || ''));

  const mobileNavItems = navItems.slice(0, 4);

  const groupedNav = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    const g = (item as any).group || 'core';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: T.bg, fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* ═══ Desktop Sidebar ════════════════════════════════════════════════ */}
      <aside style={{
        display: 'none',
        width: '224px', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
        background: T.white, borderRight: `1px solid ${T.border}`,
        flexDirection: 'column',
      }} className="app-sidebar">

        {/* Brand */}
        <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden',
              background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${T.border}`,
            }}>
              {user?.logo_url ? (
                <img src={user.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: T.orange, fontVariationSettings: "'FILL' 1" }}>credit_card</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
                {user?.role === 'super_admin' ? 'Metro Cardz' : (user?.merchant_name || 'Metro Cardz')}
              </p>
              <p style={{ fontSize: '11px', color: T.textLight, margin: '2px 0 0' }}>
                {user?.role === 'super_admin' ? 'Super Admin' : 'Loyalty Platform'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group} style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', margin: '0 0 4px' }}>
                {GROUP_LABELS[group] || group}
              </p>
              {items.map(item => <SideNavItem key={item.to} item={item} isActive={false} />)}
            </div>
          ))}

          {/* Search hint */}
          <button
            onClick={() => navigate('/portal/members/search?tab=qr')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '8px', marginTop: '4px',
              background: 'none', border: `1px dashed ${T.border}`, cursor: 'pointer',
              fontSize: '12px', color: T.textLight, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.orange; (e.currentTarget as HTMLElement).style.color = T.orange; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.textLight; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>search</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Search members</span>
            <kbd style={{ fontSize: '10px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '5px', border: `1px solid ${T.border}`, fontFamily: 'monospace' }}>⌘K</kbd>
          </button>
        </nav>

        {/* User Footer */}
        <div style={{ padding: '10px 10px 14px', borderTop: `1px solid ${T.border}` }}>
          {originalAdminUser && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', marginBottom: '8px', background: T.amberLight, borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>👁 {user?.merchant_name}</span>
              <button onClick={stopImpersonating} style={{ background: 'none', border: 'none', color: '#92400E', cursor: 'pointer', fontWeight: 700, fontSize: '11px', flexShrink: 0 }}>Exit</button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '4px 6px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: T.orange, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize: '11px', color: T.textLight, margin: 0, textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '8px', background: 'none', border: 'none',
              fontSize: '12px', fontWeight: 600, color: T.textMuted, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2'; (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = T.textMuted; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ═══ Mobile Header ══════════════════════════════════════════════════ */}
      <header style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '54px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`, alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px', boxShadow: T.shadow,
      }} className="app-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {user?.logo_url ? (
              <img src={user.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: T.orange, fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            )}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
            {user?.role === 'super_admin' ? 'Metro Cardz' : (user?.merchant_name || 'Metro Cardz')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: T.orange }}>
            {initials}
          </div>
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: '#F1F5F9', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: T.textMuted, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>logout</span>
          </button>
        </div>
      </header>

      {/* ═══ Main Content ═══════════════════════════════════════════════════ */}
      <main style={{ flex: 1, minWidth: 0, paddingTop: 0, paddingBottom: 0 }} className="app-main">
        {originalAdminUser && (
          <div style={{ background: T.amber, color: '#451A03', fontWeight: 700, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
              Impersonating {user?.merchant_name}
            </div>
            <button onClick={stopImpersonating} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '6px', padding: '4px 12px', fontWeight: 700, cursor: 'pointer', fontSize: '12px', color: '#451A03' }}>Exit</button>
          </div>
        )}
        <PageErrorBoundary>
          {children}
        </PageErrorBoundary>
      </main>

      {/* ═══ Mobile Bottom Nav ══════════════════════════════════════════════ */}
      <nav style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${T.border}`, padding: '6px 8px',
        paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 0px))',
        justifyContent: 'space-around', alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(15,23,42,0.05)',
      }} className="app-mobile-nav">
        {mobileNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/portal/members' || item.to === '/portal/dashboard' || item.to.startsWith('/portal/members/search')}
            style={{ textDecoration: 'none', flex: 1 }}
          >
            {({ isActive }) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '4px 0' }}>
                {item.icon === 'qr_code_scanner' ? (
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: isActive ? T.orange : '#F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isActive ? `0 4px 14px rgba(255,107,53,0.35)` : 'none',
                    marginTop: '-8px',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: isActive ? '#fff' : T.textMuted, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  </div>
                ) : (
                  <div style={{ width: '36px', height: '24px', borderRadius: '12px', background: isActive ? T.orangeLight : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? T.orange : T.textMuted, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                  </div>
                )}
                <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 500, color: isActive ? T.orange : T.textMuted }}>{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
        {navItems.length > 4 && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ width: '36px', height: '24px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: T.textMuted }}>more_horiz</span>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 500, color: T.textMuted }}>More</span>
          </button>
        )}
      </nav>

      {/* ═══ Mobile Drawer ══════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)' }} onClick={() => setMobileMenuOpen(false)} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: T.white, borderRadius: '20px 20px 0 0', padding: '16px 16px 32px',
            maxHeight: '85vh', overflowY: 'auto',
          }}>
            <div style={{ width: '36px', height: '4px', background: T.border, borderRadius: '99px', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 4px 12px' }}>All Options</p>
            {navItems.slice(4).map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                style={{ textDecoration: 'none' }}
              >
                {({ isActive }) => (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 12px',
                    borderRadius: '12px', marginBottom: '4px',
                    background: isActive ? T.orangeLight : 'transparent',
                    color: isActive ? T.orangeDark : T.textMuted,
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isActive ? T.orange : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: isActive ? '#fff' : T.textMuted, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: isActive ? 700 : 600 }}>{item.label}</span>
                  </div>
                )}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 12px', borderRadius: '12px', background: 'none',
                border: 'none', cursor: 'pointer', marginTop: '8px',
                color: '#EF4444',
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#EF4444' }}>logout</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .app-sidebar { display: flex !important; }
          .app-main { margin-left: 224px; padding-top: 0 !important; padding-bottom: 0 !important; }
        }
        @media (max-width: 767px) {
          .app-mobile-header { display: flex !important; }
          .app-mobile-nav { display: flex !important; }
          .app-main { padding-top: 54px !important; padding-bottom: 72px !important; }
        }
        .app-amber-light { background: #FEF3C7; }
      `}</style>
    </div>
  );
}

// small alias used in amber impersonation banner
const T_amber = '#F59E0B';
const amberLight = '#FEF3C7';
