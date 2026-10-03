'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F5F5F5', card: '#FFFFFF', border: '#E8E8E8',
  text: '#1A1A1A', textMuted: '#6B6B6B', textLight: '#9B9B9B',
  orange: '#F97316', orangeLight: '#FFF7F0', orangeDark: '#EA6500',
  inputBg: '#F9F9F9', shadow: '0 1px 4px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.08)',
  green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0',
  blue: '#2563EB', blueBg: '#EFF6FF',
  purple: '#7C3AED', purpleBg: '#F5F3FF',
  amber: '#D97706', amberBg: '#FFFBEB',
};

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

// ─── Admin Header (reused across pages) ──────────────────────────────────────
function AdminHeader({ active }: { active: string }) {
  const router = useRouter();
  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  return (
    <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', height: '56px', position: 'sticky', top: 0, zIndex: 40, boxShadow: C.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '32px' }}>
        <div style={{ width: '30px', height: '30px', background: C.orange, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px', fontFamily: '"Syne", sans-serif' }}>M</span>
        </div>
        <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px', fontWeight: 800, color: C.text }}>Metro Cardz</span>
        <span style={{ fontSize: '11px', color: C.textLight, background: C.orangeLight, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '2px 8px', marginLeft: '4px', fontWeight: 600 }}>ADMIN</span>
      </div>
      <nav style={{ display: 'flex', gap: '2px', flex: 1 }}>
        {[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Deals',     href: '/admin/deals' },
          { label: 'Brands',    href: '/admin/brands' },
          { label: 'Cards',     href: '/admin/cards' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            style={{ padding: '6px 14px', borderRadius: '8px', background: active === item.href ? C.orangeLight : 'transparent', color: active === item.href ? C.orange : C.textMuted, fontSize: '13px', fontWeight: active === item.href ? 700 : 500, textDecoration: 'none', border: `1px solid ${active === item.href ? C.orange : 'transparent'}` }}>
            {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout}
        style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 14px', fontSize: '12px', color: C.textMuted, cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}>
        Sign out
      </button>
    </header>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, bg, color, href }: { label: string; value: number | string; sub?: string; bg: string; color: string; href?: string }) {
  const inner = (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '22px 24px', boxShadow: C.shadow, position: 'relative', overflow: 'hidden', cursor: href ? 'pointer' : 'default', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => href && ((e.currentTarget as HTMLDivElement).style.boxShadow = C.shadowMd)}
      onMouseLeave={e => href && ((e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow)}>
      {/* Color accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />
      <div style={{ width: '42px', height: '42px', background: bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
        <div style={{ width: '18px', height: '18px', background: color, borderRadius: '4px' }} />
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: C.text, fontFamily: '"Syne", sans-serif', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: C.textMuted, marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: C.textLight, marginTop: '4px' }}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

// ─── Quick Action Card ────────────────────────────────────────────────────────
function ActionCard({ title, desc, href, label }: { title: string; desc: string; href: string; label: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px 22px', boxShadow: C.shadow, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>{title}</div>
      <div style={{ fontSize: '13px', color: C.textMuted, lineHeight: 1.5, flex: 1 }}>{desc}</div>
      <Link href={href}
        style={{ display: 'inline-block', padding: '9px 18px', background: C.orange, borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
        {label}
      </Link>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Primary: cookie-based deals admin auth
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (res.ok) {
        setStats(await res.json());
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to load stats.');
      }
    } catch { setError('Network error — check database connection.'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ background: C.bg, minHeight: '100dvh', fontFamily: '"Inter", sans-serif' }}>
      <AdminHeader active="/admin" />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Page heading */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '24px', fontWeight: 800, color: C.text, margin: '0 0 4px' }}>
            {greeting}, Admin
          </h1>
          <p style={{ fontSize: '14px', color: C.textMuted, margin: 0 }}>
            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px 16px', fontSize: '14px', color: '#DC2626', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {/* Stats Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', height: '130px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <StatCard label="Total Members" value={stats.total_members.toLocaleString()} sub="Registered members" bg={C.greenBg} color={C.green} />
            <StatCard label="Active Merchants" value={stats.active_merchants} sub={`${stats.inactive_merchants} inactive`} bg={C.orangeLight} color={C.orange} href="/admin/brands" />
            <StatCard label="Redemptions Today" value={stats.redemptions_today} sub="Since midnight" bg={C.blueBg} color={C.blue} />
            <StatCard label="Active Deals" value={stats.active_deals ?? '—'} sub={stats.total_deals ? `of ${stats.total_deals} total` : undefined} bg={C.purpleBg} color={C.purple} href="/admin/deals" />
            <StatCard label="Cards Linked" value={stats.linked_cards ?? '—'} sub={stats.total_cards ? `of ${stats.total_cards} cards` : undefined} bg={C.amberBg} color={C.amber} href="/admin/cards" />
            <StatCard label="Pending Approvals" value={stats.pending_approvals} sub="Awaiting review" bg="#FEF2F2" color="#DC2626" />
          </div>
        ) : null}

        {/* Divider */}
        <div style={{ fontSize: '12px', fontWeight: 700, color: C.textLight, letterSpacing: '0.08em', marginBottom: '14px' }}>QUICK ACTIONS</div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <ActionCard
            title="Manage Deals"
            desc="Add, edit or deactivate deals. Control featured and active status."
            href="/admin/deals"
            label="Go to Deals"
          />
          <ActionCard
            title="Add Partner Brand"
            desc="Onboard a new partner brand and set up their offers on the platform."
            href="/admin/brands"
            label="Go to Brands"
          />
          <ActionCard
            title="Card Inventory"
            desc="View all NFC cards, assign cards to members, and add new card numbers."
            href="/admin/cards"
            label="Manage Cards"
          />
          <ActionCard
            title="Add New Deal"
            desc="Create a new exclusive offer for a partner brand in any category."
            href="/admin/deals/new"
            label="Add Deal"
          />
        </div>

        {/* DB Fix Notice */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '14px', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ width: '36px', height: '36px', background: '#FEF3C7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400E', marginBottom: '6px' }}>Database Setup Required</div>
              <div style={{ fontSize: '13px', color: '#78350F', lineHeight: 1.6 }}>
                If login is returning a 500 error, you need to run the schema setup SQL in Hostinger phpMyAdmin.
                Go to <strong>hPanel → Databases → phpMyAdmin</strong>, select your database, click the <strong>SQL</strong> tab,
                and paste the contents of <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px' }}>prisma/HOSTINGER_FIX_AND_SEED.sql</code>.
                This will create all required tables and seed the super admin account.
              </div>
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#92400E' }}>
                <strong>Default credentials after seeding:</strong><br />
                Email: <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px' }}>metrocouponsys@gmail.com</code> &nbsp;
                Password: <code style={{ background: '#FEF3C7', padding: '1px 5px', borderRadius: '4px' }}>9029999614</code>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
