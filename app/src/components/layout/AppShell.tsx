import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const MERCHANT_NAV = [
  { to: '/dashboard',        icon: 'dashboard',       label: 'Dashboard',   roles: ['owner', 'staff'] },
  { to: '/members',          icon: 'person_search',   label: 'Members',     roles: ['owner', 'staff'] },
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
  const { user, logout, originalAdminUser, stopImpersonating } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
          </div>
          <div>
            <p className="text-headline-md font-headline-md font-bold text-primary">Metro Cardz</p>
            <p className="text-label-sm font-label-sm text-on-surface-variant">
              {user?.role === 'super_admin' ? 'Super Admin' : user?.merchant_name || 'Loyalty Manager'}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-label-md text-label-md
                ${isActive
                  ? 'bg-primary-container/10 text-primary font-bold border-r-4 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-outline-variant">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
              {user?.name?.charAt(0) || 'U'}
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
          </div>
          <span className="text-headline-md font-headline-md font-bold text-primary">Metro Cardz</span>
        </div>
        <div className="flex items-center gap-2">
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
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-2 py-2 pb-safe bg-surface shadow-[0_-2px_12px_0_rgba(0,0,0,0.08)] border-t border-outline-variant">
        {mobileNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard' || item.to === '/admin'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all active-scale min-w-[56px]
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
        {/* Bug fix: Super Admin has exactly 4 items so More never shows → add explicit logout for super_admin */}
        {user?.role === 'super_admin' ? (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center px-3 py-1.5 text-on-surface-variant min-w-[56px]"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="text-label-sm font-label-sm mt-0.5">Sign Out</span>
          </button>
        ) : navItems.length > 3 && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center px-3 py-1.5 text-on-surface-variant min-w-[56px]"
          >
            <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            <span className="text-label-sm font-label-sm mt-0.5">More</span>
          </button>
        )}
      </nav>

      {/* Mobile Drawer for More items */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[800]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl p-4 pb-8 animate-slide-up">
            <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4" />
            <div className="space-y-1">
              {navItems.slice(4).map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-label-md text-label-md
                    ${isActive ? 'bg-primary-container/10 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`
                  }
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-label-md"
              >
                <span className="material-symbols-outlined">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
