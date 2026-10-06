'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  orangeDark: '#EA580C',
  inputBg: '#F9FAFB',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.07)',
  green: '#10B981',
  greenBg: '#ECFDF5',
  blue: '#3B82F6',
  blueBg: '#EFF6FF',
  purple: '#8B5CF6',
  purpleBg: '#F5F3FF',
  red: '#EF4444',
  redBg: '#FEF2F2',
  amber: '#F59E0B',
  amberBg: '#FFFBEB',
};

// ─── Nav config ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/admin', icon: 'dashboard', label: 'Dashboard', exact: true },
  { href: '/admin/deals', icon: 'local_offer', label: 'Deals', exact: false },
  { href: '/admin/brands', icon: 'storefront', label: 'Brands', exact: false },
  { href: '/admin/cards', icon: 'credit_card', label: 'Cards', exact: false },
];

// ─── Shared Sidebar Shell ──────────────────────────────────────────────────────
export function GoAdminShell({ children, pageTitle, pageSubtitle }: {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: T.bg, fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: T.white,
          borderRight: `1px solid ${T.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          boxShadow: T.shadow,
          transition: 'transform 0.25s ease',
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
        className="go-admin-sidebar"
      >
        {/* Brand */}
        <div
          style={{
            padding: '20px 16px 16px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(249,115,22,0.25)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: '#fff', fontSize: 18, fontVariationSettings: "'FILL' 1" }}
            >
              storefront
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>Metro Cardz GO</div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: T.orange,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: T.orangeLight,
                display: 'inline-block',
                padding: '1px 6px',
                borderRadius: 4,
                marginTop: 2,
              }}
            >
              Admin
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.textLight,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '4px 8px 8px',
            }}
          >
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href) && item.href !== '/admin';
            const isAdminRoot = item.href === '/admin' && pathname === '/admin';
            const isActive = isAdminRoot || (!item.exact ? active : pathname === item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 10px',
                    borderRadius: 10,
                    background: isActive ? T.orangeLight : 'transparent',
                    color: isActive ? T.orangeDark : T.textMuted,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? T.orange : 'transparent',
                      flexShrink: 0,
                      transition: 'background 0.15s',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 17,
                        color: isActive ? '#fff' : T.textMuted,
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom — sign out */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '9px 10px',
              borderRadius: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: T.textMuted,
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#FEF2F2')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'none')}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: T.textLight }}>
                logout
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="go-admin-main">
        {/* Top bar */}
        <header
          style={{
            height: 56,
            background: T.white,
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: T.shadow,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="go-admin-hamburger"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                color: T.textMuted,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>menu</span>
            </button>
            <div>
              {pageTitle && (
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{pageTitle}</div>
              )}
              {pageSubtitle && (
                <div style={{ fontSize: 12, color: T.textMuted }}>{pageSubtitle}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/go"
              style={{
                fontSize: 12,
                color: T.textMuted,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
              View GO site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .go-admin-sidebar { transform: translateX(0) !important; }
          .go-admin-main { margin-left: 240px; }
          .go-admin-hamburger { display: none !important; }
        }
        @media (max-width: 767px) {
          .go-admin-sidebar { transform: translateX(-100%); }
          .go-admin-main { margin-left: 0; }
          .go-admin-hamburger { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, bg, color, href,
}: {
  label: string; value: number | string; sub?: string;
  icon: string; bg: string; color: string; href?: string;
}) {
  const inner = (
    <div
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: '20px 22px',
        boxShadow: T.shadow,
        position: 'relative',
        overflow: 'hidden',
        cursor: href ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        if (href) {
          (e.currentTarget as HTMLElement).style.boxShadow = T.shadowMd;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (href) {
          (e.currentTarget as HTMLElement).style.boxShadow = T.shadow;
          (e.currentTarget as HTMLElement).style.transform = 'none';
        }
      }}
    >
      {/* Accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
      <div
        style={{
          width: 42,
          height: 42,
          background: bg,
          borderRadius: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color, fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: T.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: T.textLight, marginTop: 3 }}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

// ─── Quick Action ──────────────────────────────────────────────────────────────
function QuickAction({ title, desc, href, icon }: { title: string; desc: string; href: string; icon: string }) {
  return (
    <div
      style={{
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: T.shadow,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = T.shadowMd)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = T.shadow)}
    >
      <div
        style={{
          width: 38,
          height: 38,
          background: T.orangeLight,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: T.orange, fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{title}</div>
      <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5, flex: 1 }}>{desc}</div>
      <Link
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          background: T.orange,
          borderRadius: 9,
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          alignSelf: 'flex-start',
          boxShadow: '0 4px 12px rgba(249,115,22,0.2)',
        }}
      >
        Open
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
      </Link>
    </div>
  );
}

// ─── Main Dashboard Page ───────────────────────────────────────────────────────
interface Stats {
  total_merchants: number;
  total_members: number;
  redemptions_today: number;
  active_merchants: number;
  inactive_merchants: number;
  pending_approvals: number;
  total_deals?: number;
  active_deals?: number;
  total_cards?: number;
  linked_cards?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (res.ok) {
        setStats(await res.json());
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to load statistics.');
      }
    } catch {
      setError('Network error — check database connection.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <GoAdminShell
      pageTitle="Dashboard"
      pageSubtitle={now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    >
      {/* Page heading */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 4px' }}>
          {greeting}, Admin
        </h1>
        <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>
          Here is an overview of the GO platform today.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: T.redBg,
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '14px 16px',
            fontSize: 13,
            color: T.red,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>error</span>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 14,
            marginBottom: 28,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: 16,
                height: 130,
                animation: 'pulse 1.4s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      ) : stats ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 14,
            marginBottom: 28,
          }}
        >
          <StatCard label="Total Members" value={stats.total_members.toLocaleString()} sub="Registered members" icon="groups" bg={T.greenBg} color={T.green} />
          <StatCard label="Active Merchants" value={stats.active_merchants} sub={`${stats.inactive_merchants} inactive`} icon="storefront" bg={T.orangeLight} color={T.orange} href="/admin/brands" />
          <StatCard label="Redemptions Today" value={stats.redemptions_today} sub="Since midnight" icon="confirmation_number" bg={T.blueBg} color={T.blue} />
          <StatCard label="Active Deals" value={stats.active_deals ?? '—'} sub={stats.total_deals ? `of ${stats.total_deals} total` : undefined} icon="local_offer" bg={T.purpleBg} color={T.purple} href="/admin/deals" />
          <StatCard label="Cards Linked" value={stats.linked_cards ?? '—'} sub={stats.total_cards ? `of ${stats.total_cards} total` : undefined} icon="credit_card" bg={T.amberBg} color={T.amber} href="/admin/cards" />
          <StatCard label="Pending Approvals" value={stats.pending_approvals} sub="Awaiting review" icon="pending_actions" bg={T.redBg} color={T.red} />
        </div>
      ) : null}

      {/* Section label */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.textLight,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Quick Actions
      </div>

      {/* Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 32,
        }}
      >
        <QuickAction title="Manage Deals" desc="Add, edit or deactivate deals. Control featured and active status." href="/admin/deals" icon="local_offer" />
        <QuickAction title="Add Partner Brand" desc="Onboard a new partner brand and configure their profile." href="/admin/brands" icon="storefront" />
        <QuickAction title="Card Inventory" desc="View NFC cards, assign to members, add new card numbers." href="/admin/cards" icon="credit_card" />
        <QuickAction title="Create New Deal" desc="Create an exclusive offer for a partner brand in any category." href="/admin/deals/new" icon="add_circle" />
      </div>

      {/* Setup notice */}
      <div
        style={{
          background: T.amberBg,
          border: '1px solid #FDE68A',
          borderRadius: 14,
          padding: '18px 20px',
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: '#FEF3C7',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: T.amber, fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>Database Setup Required</div>
          <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.65 }}>
            If login returns a 500 error, run the schema setup SQL in Hostinger phpMyAdmin.
            Go to <strong>hPanel → Databases → phpMyAdmin</strong>, select your database, click <strong>SQL</strong> tab,
            and paste the contents of{' '}
            <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 }}>
              prisma/HOSTINGER_FIX_AND_SEED.sql
            </code>.
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: '#92400E' }}>
            <strong>Default credentials after seeding:</strong>
            <br />
            Email: <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 }}>metrocouponsys@gmail.com</code>
            &nbsp; Password: <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 }}>9029999614</code>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </GoAdminShell>
  );
}
