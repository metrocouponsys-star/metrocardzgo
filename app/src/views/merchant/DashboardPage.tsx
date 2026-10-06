import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { DashboardStats, CelebrationMember } from '../../types';
import * as api from '../../api';
import { cached } from '../../api/cache';
import { format, formatDistanceToNow } from 'date-fns';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const REFRESH_MS = 60_000;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// ─── Inline design tokens (no Tailwind bleed) ────────────────────────────────
const T = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: 'rgba(226,232,240,0.6)',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  orange: '#FF6B35',
  orangeLight: '#FFF4EF',
  orangeDark: '#E85A28',
  teal: '#00D4AA',
  tealLight: '#E0FFF6',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  shadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)',
  shadowMd: '0 4px 16px rgba(15,23,42,0.08)',
  shadowLg: '0 8px 32px rgba(15,23,42,0.1)',
};

// ─── Mini components ─────────────────────────────────────────────────────────
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
      border: `1.5px solid ${active ? T.orange : T.border}`,
      background: active ? T.orangeLight : T.white,
      color: active ? T.orangeDark : T.textMuted,
      cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

function StatBlock({ icon, label, value, sub, color, bg, onClick }: {
  icon: string; label: string; value: string | number; sub?: string;
  color: string; bg: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} style={{
      background: T.white, borderRadius: '16px', padding: '20px 22px',
      border: `1px solid ${T.border}`, boxShadow: T.shadow,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s, box-shadow 0.15s',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { if (onClick) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = T.shadowMd; } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = T.shadow; }}
    >
      {/* Left color stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: color, borderRadius: '0 2px 2px 0' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{ width: '42px', height: '42px', background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{label}</p>
          <p style={{ fontSize: '26px', fontWeight: 800, color: T.text, margin: '0 0 2px', lineHeight: 1, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {sub && <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, color, bg, onClick }: {
  icon: string; label: string; color: string; bg: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={{
      background: T.white, border: `1px solid ${T.border}`, borderRadius: '14px',
      padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '10px', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: T.shadow,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = T.shadowMd; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = T.shadow; }}
    >
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '22px', color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <span style={{ fontSize: '12px', fontWeight: 700, color: T.text, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsSince, setSecondsSince] = useState(0);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [celebrations, setCelebrations] = useState<CelebrationMember[]>([]);
  const [celebrationsLoading, setCelebrationsLoading] = useState(true);
  const [celebFilter, setCelebFilter] = useState<'all' | 'today' | '7days'>('all');

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(false);
    const key = `dashboard/${user?.merchant_id}`;
    try {
      const s = await cached(key, () => api.getDashboardStats(user?.merchant_id || ''), (fresh) => {
        setStats(fresh); setLastUpdated(new Date()); setSecondsSince(0);
      });
      setStats(s); setLastUpdated(new Date()); setSecondsSince(0);
    } catch { setError(true); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.merchant_id]);

  useEffect(() => {
    fetchStats();
    api.getCelebrations(30).then(setCelebrations).catch(() => setCelebrations([]))
      .finally(() => setCelebrationsLoading(false));
  }, [fetchStats]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') fetchStats(true);
    }, REFRESH_MS);
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchStats(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchStats]);

  useEffect(() => {
    tickRef.current = setInterval(() => setSecondsSince(s => s + 1), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const updatedLabel = lastUpdated
    ? secondsSince < 5 ? 'Just updated'
      : secondsSince < 60 ? `${secondsSince}s ago`
      : `${formatDistanceToNow(lastUpdated)} ago`
    : null;

  const filteredCelebs = celebrations.filter(c => {
    if (celebFilter === 'all') return true;
    const targetDate = c.event_date;
    if (!targetDate) return false;
    const today = new Date();
    const d = new Date(targetDate.includes('T') ? targetDate : `${targetDate}T00:00:00`);
    const daysAway = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (celebFilter === 'today') return daysAway <= 0 && daysAway > -1;
    if (celebFilter === '7days') return daysAway >= 0 && daysAway <= 7;
    return true;
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', color: T.orange, fontWeight: 700, margin: '0 0 4px', letterSpacing: '0.02em' }}>
              {greeting()} 👋
            </p>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: T.text, margin: '0 0 4px', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif', letterSpacing: '-0.3px' }}>
              {user?.merchant_name || user?.name || 'Dashboard'}
            </h1>
            <p style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {updatedLabel && !loading && (
              <span style={{ fontSize: '11px', color: T.textLight }}>
                {refreshing ? '⟳ Refreshing…' : `↑ ${updatedLabel}`}
              </span>
            )}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                background: T.white, border: `1px solid ${T.border}`, borderRadius: '10px',
                fontSize: '12px', fontWeight: 700, color: T.textMuted, cursor: 'pointer',
                boxShadow: T.shadow, transition: 'all 0.15s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {/* ── Scan Bar — always-visible primary CTA ── */}
        <button
          onClick={() => navigate('/portal/members/search?tab=qr')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
            padding: '18px 22px', background: T.text, borderRadius: '16px',
            border: 'none', cursor: 'pointer', marginBottom: '24px',
            boxShadow: `0 4px 20px rgba(15,23,42,0.15)`,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(15,23,42,0.2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px rgba(15,23,42,0.15)`; }}
        >
          <div style={{ width: '46px', height: '46px', background: 'rgba(255,107,53,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: T.orange, fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: '0 0 2px', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>Scan / Search Customer</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Verify QR, redeem offers, add points</p>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)' }}>arrow_forward_ios</span>
        </button>

        {/* ── Quick Actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          <QuickAction icon="person_add" label="Add Member" color={T.orange} bg={T.orangeLight} onClick={() => navigate('/portal/members/new')} />
          <QuickAction icon="groups" label="Members" color="#2563EB" bg="#EFF6FF" onClick={() => navigate('/portal/members')} />
          <QuickAction icon="credit_card" label="Cards" color="#7C3AED" bg="#F5F3FF" onClick={() => navigate('/portal/cards')} />
          <QuickAction icon="cake" label="Birthdays" color={T.teal} bg={T.tealLight} onClick={() => navigate('/portal/celebrations')} />
        </div>

        {/* ── Stats ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: T.text, margin: 0, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>Overview</h2>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: '#DC2626', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>error</span>
              Could not load stats. Check your connection.
            </div>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: '100px', background: 'linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 40%, #F1F5F9 80%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite', borderRadius: '16px', border: `1px solid ${T.border}` }} />
              ))}
            </div>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              <StatBlock icon="groups" label="Total Members" value={stats.total_members ?? 0} sub="All time" color={T.orange} bg={T.orangeLight} onClick={() => navigate('/portal/members')} />
              <StatBlock icon="trending_up" label="Active Today" value={stats.active_today ?? stats.new_members_today ?? 0} sub="Checked in today" color="#2563EB" bg="#EFF6FF" />
              <StatBlock icon="redeem" label="Redemptions" value={stats.redemptions_this_month ?? 0} sub="This month" color={T.teal} bg={T.tealLight} />
              <StatBlock icon="workspace_premium" label="Points Issued" value={stats.total_points_issued ?? 0} sub="This month" color={T.amber} bg={T.amberLight} />
            </div>
          ) : null}
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

          {/* Recent Activity */}
          <div>
            <div style={{ background: T.white, borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: T.text, margin: 0, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>Recent Redemptions</h3>
                <button onClick={() => navigate('/portal/reports')} style={{ fontSize: '12px', color: T.orange, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
              </div>
              {stats?.recent_redemptions && stats.recent_redemptions.length > 0 ? (
                <div>
                  {stats.recent_redemptions.slice(0, 6).map((r: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 20px', borderBottom: i < 5 ? `1px solid ${T.border}` : 'none',
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: T.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: T.teal, fontVariationSettings: "'FILL' 1" }}>redeem</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.member_name || 'Customer'}</p>
                        <p style={{ fontSize: '12px', color: T.textLight, margin: 0 }}>{r.offer_name || 'Offer redeemed'}</p>
                      </div>
                      <p style={{ fontSize: '11px', color: T.textLight, flexShrink: 0, margin: 0 }}>
                        {r.redeemed_at ? format(new Date(r.redeemed_at), 'dd MMM, hh:mm a') : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', color: T.textLight, display: 'block', marginBottom: '8px' }}>receipt_long</span>
                  <p style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}>No recent redemptions</p>
                </div>
              )}
            </div>
          </div>

          {/* Celebrations Sidebar */}
          <div>
            <div style={{ background: T.white, borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: T.text, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
                  🎂 Celebrations
                </h3>
                <button onClick={() => navigate('/portal/celebrations')} style={{ fontSize: '12px', color: T.orange, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>All →</button>
              </div>
              {/* Filter pills */}
              <div style={{ padding: '10px 14px', display: 'flex', gap: '6px', overflowX: 'auto', borderBottom: `1px solid ${T.border}` }}>
                {(['all', 'today', '7days'] as const).map(f => (
                  <Pill key={f} label={f === 'all' ? 'All' : f === 'today' ? 'Today' : '7 Days'} active={celebFilter === f} onClick={() => setCelebFilter(f)} />
                ))}
              </div>
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {celebrationsLoading ? (
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ height: '52px', borderRadius: '10px', background: 'linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 40%, #F1F5F9 80%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }} />
                    ))}
                  </div>
                ) : filteredCelebs.length > 0 ? (
                  filteredCelebs.slice(0, 8).map((c, i) => {
                    const isBirthday = c.event_type === 'birthday';
                    return (
                      <div key={`${c.member_id}-${c.event_type}`} style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px',
                        borderBottom: i < filteredCelebs.length - 1 ? `1px solid rgba(226,232,240,0.5)` : 'none',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                        onClick={() => navigate(`/portal/members/${c.member_id}`)}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                      >
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                          background: isBirthday ? '#FFF4EF' : '#F0FDF4',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                        }}>
                          {isBirthday ? '🎂' : '💍'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                          <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>
                            {isBirthday ? 'Birthday' : 'Anniversary'} · {c.phone}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}>No celebrations {celebFilter !== 'all' ? 'in this period' : 'upcoming'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .dash-two-col { grid-template-columns: 1fr !important; }
          .dash-actions { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
