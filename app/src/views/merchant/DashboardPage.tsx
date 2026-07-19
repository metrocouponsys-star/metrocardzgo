import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import type { DashboardStats } from '../../types';
import * as api from '../../api';
import { formatDistanceToNow } from 'date-fns';

const OFFER_ICONS: Record<string, string> = {
  percent_off: 'percent', free_service: 'spa', wallet_points: 'account_balance_wallet',
  referral: 'people', birthday: 'cake', unknown: 'star',
};

const REFRESH_INTERVAL_MS = 60_000; // auto-refresh every 60 s

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

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(false);
    try {
      const s = await api.getDashboardStats(user?.merchant_id || '');
      setStats(s);
      setLastUpdated(new Date());
      setSecondsSince(0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.merchant_id]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh — pauses when tab is hidden (visibility API)
  useEffect(() => {
    const startInterval = () => {
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') fetchStats(true);
      }, REFRESH_INTERVAL_MS);
    };
    startInterval();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchStats(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchStats]);

  // "Updated X seconds ago" ticker
  useEffect(() => {
    tickRef.current = setInterval(() => setSecondsSince(s => s + 1), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const updatedLabel = lastUpdated
    ? secondsSince < 5
      ? 'Just updated'
      : secondsSince < 60
        ? `Updated ${secondsSince}s ago`
        : `Updated ${formatDistanceToNow(lastUpdated)} ago`
    : null;

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl">

      {/* ── Hero CTA ─── */}
      <section
        className="relative overflow-hidden rounded-2xl hero-shimmer shadow-elevated p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer active-scale group"
        onClick={() => navigate('/members')}
      >
        {/* Animated blobs */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-white mb-1">
            Scan / Search Customer
          </h2>
          <p className="text-white/70 text-body-md">
            Instantly redeem offers or check member status.
          </p>
        </div>
        <div className="relative z-10 bg-white/15 p-4 rounded-2xl group-hover:scale-110 group-hover:bg-white/25 transition-all self-start md:self-auto backdrop-blur-sm border border-white/20">
          <span
            className="material-symbols-outlined text-[48px] text-white animate-float"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            qr_code_scanner
          </span>
        </div>
      </section>

      {/* ── Stats Grid ─── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title">Overview</h3>
          {/* Refresh badge */}
          <div className="flex items-center gap-2">
            {updatedLabel && !loading && (
              <span className="text-label-sm text-on-surface-variant flex items-center gap-1 animate-fade-in">
                {refreshing
                  ? <span className="material-symbols-outlined text-[14px] animate-spin-slow text-primary">refresh</span>
                  : <span className="material-symbols-outlined text-[14px] text-secondary">check_circle</span>
                }
                {refreshing ? 'Refreshing…' : updatedLabel}
              </span>
            )}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing || loading}
              title="Refresh stats"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-40"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin-slow' : ''}`}>refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : error ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-error">cloud_off</span>
              <p className="text-body-md text-on-surface-variant">Failed to load stats.</p>
              <button onClick={() => fetchStats()} className="btn-outline flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Retry
              </button>
            </div>
          ) : stats ? (
            <>
              <StatCard
                label="Total Active Members"
                value={stats.total_active_members}
                trend="+12% this month"
                icon="groups"
                className="stagger-item"
              />
              <StatCard
                label="Redemptions Today"
                value={stats.redemptions_today}
                trend="All handled"
                icon="check_circle"
                className="stagger-item"
              />
              <StatCard
                label="Expiring This Week"
                value={stats.expiring_this_week}
                trendUp={false}
                trend="Action needed"
                icon="notification_important"
                iconColor="text-error"
                className="stagger-item"
              />
              <StatCard
                label="Points Issued (Month)"
                value={stats.wallet_points_issued_month}
                trend="High engagement"
                icon="stars"
                className="stagger-item"
              />
            </>
          ) : null}
        </div>
      </section>

      {/* ── Recent Activity ─── */}
      <section className="space-y-md">
        <div className="flex justify-between items-center">
          <h3 className="section-title">Recent Activity</h3>
          <button onClick={() => navigate('/reports')} className="text-primary text-label-md font-bold hover:underline flex items-center gap-1">
            View All
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {loading ? (
          <div className="card divide-y divide-outline-variant">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-10 h-10 rounded-full skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-1/3" />
                  <div className="h-3 skeleton rounded w-1/2" />
                </div>
                <div className="w-16 h-4 skeleton rounded" />
              </div>
            ))}
          </div>
        ) : stats && stats.recent_redemptions.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-[#e7eefe] overflow-hidden divide-y divide-gray-100">
            {stats.recent_redemptions.map((r, idx) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-[#f9f9ff] transition-colors cursor-pointer group animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => navigate(`/members/${r.member_id}`)}
              >
                <div className="flex items-center gap-3">
                  {/* Left accent dot */}
                  <div className="w-1 h-8 rounded-full bg-secondary/30 group-hover:bg-secondary transition-colors" />
                  <div className="w-10 h-10 rounded-xl bg-[#e7eefe] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#00236f] text-[18px]">
                      {OFFER_ICONS[r.offer?.offer_type || 'unknown']}
                    </span>
                  </div>
                  <div>
                    <p className="text-body-md font-bold text-on-surface">{r.member?.name}</p>
                    <p className="text-body-md text-on-surface-variant text-sm">{r.offer?.title}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-label-sm text-on-surface-variant">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </p>
                  <span className="text-label-sm bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    ✓ Success
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="group_add"
            title="Welcome to Metro Cardz!"
            description="Add your first member to start tracking redemptions and loyalty activity."
            actionLabel="Add First Member"
            onAction={() => navigate('/members/new')}
          />
        )}
      </section>

      {/* ── FAB ─── */}
      <button
        className="fixed bottom-24 right-4 md:right-12 md:bottom-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-elevated flex items-center justify-center active-scale hover:scale-105 z-40 transition-transform group"
        onClick={() => navigate('/members/new')}
        title="Add new member"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Add Member
        </span>
      </button>
    </div>
  );
}
