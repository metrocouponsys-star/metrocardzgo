import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import type { ReportData } from '../../types';
import * as api from '../../api';
import { cached } from '../../api/cache';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';

const OFFER_LABELS: Record<string, string> = {
  percent_off: '% Off',
  free_service: 'Free Service',
  wallet_points: 'Wallet Points',
  referral: 'Referral Bonus',
  birthday: 'Birthday Special',
  points_redemption: 'Points Redemption',
  visit_milestone: 'Milestone Reward',
};

type TabType = 'redemptions' | 'members' | 'points' | 'leaderboard' | 'retention';

const TABS = [
  { id: 'redemptions' as const, label: 'Redemptions', icon: 'receipt_long' },
  { id: 'members' as const, label: 'Member Growth', icon: 'person_add' },
  { id: 'points' as const, label: 'Points Economy', icon: 'stars' },
  { id: 'leaderboard' as const, label: 'Top Customers', icon: 'leaderboard' },
  { id: 'retention' as const, label: 'Retention', icon: 'sync' },
];

const RANK_BADGES = ['🥇', '🥈', '🥉'];

const REFRESH_INTERVAL_MS = 90_000; // auto-refresh every 90s

// ── Chart theming ────────────────────────────────────────────────────────────
const CHART_COLORS = {
  primary: '#1a56db',
  primaryLight: '#3b82f6',
  green: '#059669',
  greenLight: '#10b981',
  red: '#dc2626',
  amber: '#d97706',
  grid: '#e5e7eb',
};

const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  padding: '12px 16px',
  fontSize: '13px',
};

export default function ReportsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [data, setData] = useState<ReportData | null>(null);
  const [newMembers, setNewMembers] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [pointsData, setPointsData] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TabType>('redemptions');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsSince, setSecondsSince] = useState(0);
  const [redemptionPage, setRedemptionPage] = useState(0);
  const REDEMPTIONS_PER_PAGE = 15;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const mId = user?.merchant_id || '';

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // ── Stale-while-revalidate caching per data set ─────────────────
      const [reportSummary, membersGrowth, leaders, pointsHistory, retention] = await Promise.all([
        cached(
          `reports/summary/${mId}`,
          () => api.getReportData(mId),
          (fresh) => { setData(fresh); setLastUpdated(new Date()); setSecondsSince(0); },
        ),
        cached(
          `reports/new-members/${mId}`,
          () => api.getNewMembersReport(mId, 30),
          (fresh) => setNewMembers(fresh),
        ),
        cached(
          `reports/top-customers/${mId}`,
          () => api.getTopCustomersReport(mId, 10),
          (fresh) => setTopCustomers(fresh),
        ),
        cached(
          `reports/points/${mId}`,
          () => api.getPointsReport(mId, 12),
          (fresh) => setPointsData(fresh),
        ),
        cached(
          `reports/retention/${mId}`,
          () => api.getRetentionReport(mId, 6),
          (fresh) => setRetentionData(fresh),
        ),
      ]);
      setData(reportSummary);
      setNewMembers(membersGrowth);
      setTopCustomers(leaders);
      setPointsData(pointsHistory);
      setRetentionData(retention);
      setLastUpdated(new Date());
      setSecondsSince(0);
    } catch (e: any) {
      addToast('error', e.message || 'Failed to fetch reporting analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mId]);

  // Initial load
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Auto-refresh (pauses when tab hidden)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') fetchReports(true);
    }, REFRESH_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchReports(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchReports]);

  // "Updated X ago" ticker
  useEffect(() => {
    tickRef.current = setInterval(() => setSecondsSince(s => s + 1), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const exportRedemptionsCsv = () => {
    if (!data) return;
    const rows = [
      ['Member Name', 'Member Code', 'Offer Title', 'Offer Type', 'Staff Name', 'Date', 'Time'],
      ...data.all_redemptions.map(r => [
        r.member?.name || '',
        r.member?.member_code || '',
        r.offer?.title || '',
        r.offer?.offer_type || '',
        r.staff_name || '',
        format(new Date(r.created_at), 'dd/MM/yyyy'),
        format(new Date(r.created_at), 'HH:mm'),
      ]),
    ];
    const csvContent = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `redemptions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMembers = () => {
    const token = (() => {
      try {
        const stored = localStorage.getItem('metro-cardz-auth');
        return stored ? JSON.parse(stored)?.state?.token : null;
      } catch {
        return null;
      }
    })();
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

    if (token) {
      fetch(`${baseUrl}/api/v1/reports/export/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.blob())
      .then(blob => {
        const localUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = localUrl;
        link.download = `members-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(localUrl);
      })
      .catch(() => {
        addToast('error', 'CSV export failed');
      });
    }
  };

  // Paginated redemptions
  const paginatedRedemptions = data?.all_redemptions.slice(
    redemptionPage * REDEMPTIONS_PER_PAGE,
    (redemptionPage + 1) * REDEMPTIONS_PER_PAGE
  ) || [];
  const totalRedemptionPages = Math.ceil((data?.all_redemptions.length || 0) / REDEMPTIONS_PER_PAGE);

  const updatedAgo = lastUpdated
    ? secondsSince < 5 ? 'Just now' : `${formatDistanceToNow(lastUpdated)} ago`
    : '';

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-6xl mx-auto space-y-xl animate-fade-in">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-md">
        <div className="page-header mb-0">
          <h2 className="page-title flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
            Reports & Analytics
          </h2>
          <p className="page-subtitle">Track business performance, customer visits, and loyalty economy.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button
              onClick={exportRedemptionsCsv}
              disabled={loading || !data}
              className="btn-outline flex items-center gap-2 py-2 text-label-sm"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Redemptions CSV
            </button>
            <button
              onClick={handleExportMembers}
              disabled={loading}
              className="btn-outline flex items-center gap-2 py-2 text-label-sm"
            >
              <span className="material-symbols-outlined text-[16px]">group</span>
              Export Members
            </button>
            <button
              onClick={() => fetchReports(true)}
              disabled={refreshing}
              className="btn-outline flex items-center gap-1.5 py-2 text-label-sm"
              title="Refresh data"
            >
              <span className={`material-symbols-outlined text-[16px] transition-transform ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>
          {lastUpdated && (
            <p className="text-label-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              Updated {updatedAgo}
            </p>
          )}
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-gutter">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : data ? (
          <>
            <StatCard label="Total Redemptions" value={data.summary.total_redemptions} icon="receipt_long" iconColor="text-primary" />
            <StatCard label="Active Members" value={data.summary.active_members} icon="groups" iconColor="text-green-600" />
            <StatCard label="Expiring Soon" value={data.summary.expiring_soon} icon="schedule" iconColor="text-amber-500" />
            <StatCard
              label="Top Offer"
              value={OFFER_LABELS[data.summary.most_used_offer] || data.summary.most_used_offer || 'None'}
              icon="star"
              iconColor="text-amber-400"
            />
            <StatCard label="Points Issued" value={`${(data.summary.points_issued_month || 0).toLocaleString()} pts`} icon="add_circle" iconColor="text-green-500" />
            <StatCard label="Points Redeemed" value={`${(data.summary.points_redeemed_month || 0).toLocaleString()} pts`} icon="stars" iconColor="text-amber-500" />
          </>
        ) : null}
      </section>

      {/* ── Pill Tabs ─────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5 p-1 bg-surface-container rounded-2xl w-fit min-w-full sm:min-w-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-label-md whitespace-nowrap transition-all duration-200
                ${tab === t.id
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: tab === t.id ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content: Redemptions ──────────────────────────────────────── */}
      {tab === 'redemptions' && (
        <div className="space-y-lg animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            {/* Redemptions by Type */}
            <div className="card p-lg">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>donut_large</span>
                <h3 className="section-title mb-0">Redemptions by Offer Type</h3>
              </div>
              {loading ? (
                <div className="h-[250px] bg-surface-container rounded-xl animate-pulse" />
              ) : data?.redemptions_by_offer.length === 0 ? (
                <div className="h-[250px] flex flex-col items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-30">bar_chart</span>
                  <p className="text-body-sm">No redemptions yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.redemptions_by_offer.map(d => ({ ...d, name: OFFER_LABELS[d.offer_type] || d.offer_type }))}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={CHART_COLORS.primaryLight} stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Redemptions Over Time */}
            <div className="card p-lg">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>show_chart</span>
                <h3 className="section-title mb-0">Redemptions Over Time</h3>
              </div>
              {loading ? (
                <div className="h-[250px] bg-surface-container rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data?.redemptions_over_time.map(d => ({ ...d, date: format(new Date(d.date), 'dd MMM') }))}>
                    <defs>
                      <linearGradient id="areaGradRedemptions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="count" stroke={CHART_COLORS.primary} strokeWidth={2.5}
                      fillOpacity={1} fill="url(#areaGradRedemptions)" name="Redemptions"
                      dot={{ fill: CHART_COLORS.primary, r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, stroke: CHART_COLORS.primary, strokeWidth: 2, fill: '#fff' }}
                      animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Redemptions Table */}
          <div className="card overflow-hidden">
            <div className="p-lg border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>list_alt</span>
                <h3 className="section-title mb-0">All Redemptions</h3>
                {data && (
                  <span className="text-label-sm text-on-surface-variant bg-surface-container-high px-2.5 py-0.5 rounded-full ml-1">
                    {data.all_redemptions.length}
                  </span>
                )}
              </div>
              {totalRedemptionPages > 1 && (
                <div className="flex items-center gap-2 text-label-sm">
                  <button
                    onClick={() => setRedemptionPage(p => Math.max(0, p - 1))}
                    disabled={redemptionPage === 0}
                    className="p-1 rounded-lg hover:bg-surface-container disabled:opacity-30 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  <span className="text-on-surface-variant tabular-nums">
                    {redemptionPage + 1} / {totalRedemptionPages}
                  </span>
                  <button
                    onClick={() => setRedemptionPage(p => Math.min(totalRedemptionPages - 1, p + 1))}
                    disabled={redemptionPage >= totalRedemptionPages - 1}
                    className="p-1 rounded-lg hover:bg-surface-container disabled:opacity-30 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low/60">
                  <tr>
                    {['Member', 'Offer Used', 'Staff Partner', 'Date & Time'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-label-md font-label-md text-on-surface-variant sticky top-0 bg-surface-container-low/60 backdrop-blur-sm">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="px-4 py-3.5">
                            <div className="h-4 bg-surface-container rounded-lg animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedRedemptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 mb-2 block">receipt_long</span>
                        <p className="text-body-sm text-on-surface-variant">No redemptions found</p>
                      </td>
                    </tr>
                  ) : paginatedRedemptions.map((r, idx) => (
                    <tr key={r.id} className={`hover:bg-surface-container-low/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                      <td className="px-4 py-3.5">
                        <p className="text-body-md font-bold">{r.member?.name}</p>
                        <p className="text-label-sm text-on-surface-variant">#{r.member?.member_code}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-body-md font-semibold text-on-surface">
                          {r.offer?.title}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-body-md text-on-surface-variant">{r.staff_name || '—'}</td>
                      <td className="px-4 py-3.5 text-label-sm text-on-surface-variant tabular-nums">
                        {format(new Date(r.created_at), 'dd MMM yyyy, HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content: Member Growth ────────────────────────────────────── */}
      {tab === 'members' && (
        <div className="card p-lg space-y-md animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            <div>
              <h3 className="section-title mb-0">New Member Signups</h3>
              <p className="text-body-sm text-on-surface-variant">Daily member acquisition over the last 30 days.</p>
            </div>
          </div>
          {loading ? (
            <div className="h-[320px] bg-surface-container rounded-xl animate-pulse" />
          ) : newMembers.length === 0 ? (
            <div className="h-[320px] flex flex-col items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-30">person_add</span>
              <p className="text-body-sm">No new members in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={newMembers.map(d => ({ ...d, date: format(new Date(d.date), 'dd MMM') }))}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="count" stroke={CHART_COLORS.green} strokeWidth={2.5}
                  fillOpacity={1} fill="url(#colorMembers)" name="New Enrolments"
                  dot={{ fill: CHART_COLORS.green, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: CHART_COLORS.green, strokeWidth: 2, fill: '#fff' }}
                  animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Tab Content: Points Economy ───────────────────────────────────── */}
      {tab === 'points' && (
        <div className="card p-lg space-y-md animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            <div>
              <h3 className="section-title mb-0">Points Earned vs Redeemed</h3>
              <p className="text-body-sm text-on-surface-variant">Weekly volume of points issued vs. spent on rewards.</p>
            </div>
          </div>
          {loading ? (
            <div className="h-[320px] bg-surface-container rounded-xl animate-pulse" />
          ) : pointsData.length === 0 ? (
            <div className="h-[320px] flex flex-col items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-2 opacity-30">stars</span>
              <p className="text-body-sm">No points activity in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={pointsData} barCategoryGap="20%">
                <defs>
                  <linearGradient id="earnedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={CHART_COLORS.greenLight} stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="redeemedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.red} stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="points_earned" fill="url(#earnedGrad)" name="Points Earned" radius={[6, 6, 0, 0]} animationDuration={800} />
                <Bar dataKey="points_redeemed" fill="url(#redeemedGrad)" name="Points Spent" radius={[6, 6, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* ── Tab Content: Top Customers ────────────────────────────────────── */}
      {tab === 'leaderboard' && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="p-lg border-b border-outline-variant/30 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <div>
              <h3 className="section-title mb-0">Customer Leaderboard</h3>
              <p className="text-body-sm text-on-surface-variant">Your top 10 most loyal customers ranked by total visits.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low/60">
                <tr>
                  {['Rank', 'Customer', 'Mobile Number', 'Total Visits', 'Redemptions', 'Points Balance'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-label-md font-label-md text-on-surface-variant sticky top-0 bg-surface-container-low/60 backdrop-blur-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 bg-surface-container rounded-lg animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : topCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 mb-2 block">leaderboard</span>
                      <p className="text-body-sm text-on-surface-variant">No customer data yet</p>
                    </td>
                  </tr>
                ) : topCustomers.map((c, i) => (
                  <tr key={c.member_id} className={`hover:bg-surface-container-low/50 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                    <td className="px-4 py-3.5">
                      <span className="text-body-lg">
                        {i < 3 ? (
                          <span className="text-xl">{RANK_BADGES[i]}</span>
                        ) : (
                          <span className="font-bold text-on-surface-variant">#{i + 1}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-body-md font-bold">{c.name}</p>
                      <p className="text-label-sm text-on-surface-variant">#{c.member_code}</p>
                    </td>
                    <td className="px-4 py-3.5 text-body-md font-mono text-on-surface-variant">{c.phone}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-body-md font-bold text-on-surface">{c.total_visits}</span>
                    </td>
                    <td className="px-4 py-3.5 text-body-md text-on-surface-variant">{c.redemption_count}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-body-md font-bold text-amber-600">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                        {parseFloat(c.loyalty_points || '0').toLocaleString()} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab Content: Cohort Retention ─────────────────────────────────── */}
      {tab === 'retention' && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="p-lg border-b border-outline-variant/30 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>autorenew</span>
            <div>
              <h3 className="section-title mb-0">Cohort Retention Report</h3>
              <p className="text-body-sm text-on-surface-variant">Track signups by month and the percentage of members active (who redeemed an offer) in the last 30 days.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low/60">
                <tr>
                  {['Signup Month', 'Joined Members', 'Retained (Active 30d)', 'Retention Rate'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-label-md font-label-md text-on-surface-variant sticky top-0 bg-surface-container-low/60 backdrop-blur-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 bg-surface-container rounded-lg animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : retentionData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 mb-2 block">sync</span>
                      <p className="text-body-sm text-on-surface-variant">No retention data yet</p>
                    </td>
                  </tr>
                ) : retentionData.map((c, idx) => (
                  <tr key={c.cohort} className={`hover:bg-surface-container-low/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                    <td className="px-4 py-3.5 text-body-md font-bold">{c.cohort}</td>
                    <td className="px-4 py-3.5 text-body-md font-medium text-on-surface">{c.joined} members</td>
                    <td className="px-4 py-3.5 text-body-md text-on-surface-variant">{c.retained} members</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-surface-container-highest rounded-full h-2.5 max-w-[140px] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              c.retention_rate >= 60 ? 'bg-green-500' : c.retention_rate >= 30 ? 'bg-amber-500' : 'bg-red-400'
                            }`}
                            style={{ width: `${c.retention_rate}%` }}
                          />
                        </div>
                        <span className={`text-body-md font-bold tabular-nums ${
                          c.retention_rate >= 60 ? 'text-green-600' : c.retention_rate >= 30 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {c.retention_rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
