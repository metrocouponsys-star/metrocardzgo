import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import type { DashboardStats } from '../../types';
import * as api from '../../api';
import { cached } from '../../api/cache';
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
    const cacheKey = `dashboard/${user?.merchant_id}`;
    try {
      const s = await cached(
        cacheKey,
        () => api.getDashboardStats(user?.merchant_id || ''),
        // onUpdate: called when background refresh brings fresh data
        (fresh) => {
          setStats(fresh);
          setLastUpdated(new Date());
          setSecondsSince(0);
        },
      );
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
    <div className="px-4 md:px-10 py-8 max-w-5xl mx-auto space-y-8">

      {/* ── PREMIUM Hero CTA — Option A: white card with gold left border ──── */}
      <section
        className="relative overflow-hidden bg-white rounded-2xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer group transition-all hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]"
        style={{ borderLeft: '4px solid #B8941F' }}
        onClick={() => navigate('/members/search?tab=qr')}
      >
        {/* Subtle gold tint gradient wash on right side */}
        <div className="absolute right-0 top-0 bottom-0 w-40 pointer-events-none"
          style={{ background: 'linear-gradient(to left, rgba(251,247,234,0.6) 0%, transparent 100%)' }} />

        <div className="relative z-10 p-6 md:p-8">
          <p className="text-[11px] font-bold tracking-widest uppercase text-[#B8941F] mb-2">Quick Action</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#111111] mb-1 leading-tight">
            Scan / Search Customer
          </h2>
          <p className="text-[#6B7280] text-sm">
            Instantly redeem offers or check member status.
          </p>
        </div>

        {/* Icon section */}
        <div className="relative z-10 p-6 md:p-8 flex items-center gap-4 md:flex-col md:items-end shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-[#FBF7EA] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#F5EDD0] transition-all">
            <span
              className="material-symbols-outlined text-[36px] text-[#B8941F] animate-float"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              qr_code_scanner
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#B8941F] text-sm font-semibold md:hidden">
            <span>Open Scanner</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </div>
        </div>
      </section>

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">Overview</h3>
          {/* Refresh badge */}
          <div className="flex items-center gap-2">
            {updatedLabel && !loading && (
              <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1 animate-fade-in">
                {refreshing
                  ? <span className="material-symbols-outlined text-[13px] animate-spin-slow text-[#B8941F]">refresh</span>
                  : <span className="material-symbols-outlined text-[13px] text-emerald-500">check_circle</span>
                }
                {refreshing ? 'Refreshing…' : updatedLabel}
              </span>
            )}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing || loading}
              title="Refresh stats"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#6B7280] transition-colors disabled:opacity-40"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin-slow' : ''}`}>refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : error ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-red-400">cloud_off</span>
              </div>
              <p className="text-sm text-[#6B7280]">Failed to load stats.</p>
              <button onClick={() => fetchStats()} className="btn-outline flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Retry
              </button>
            </div>
          ) : stats ? (
            <>
              <StatCard
                label="Total Active Members"
                value={`${stats.total_active_members} / ${stats.total_cards_assigned || stats.total_active_members}`}
                trend={`${stats.total_active_members} Active`}
                trendUp={true}
                icon="groups"
                className="stagger-item"
                onClick={() => navigate('/members')}
              />
              <StatCard
                label="Redemptions Today"
                value={stats.redemptions_today}
                trend="All handled"
                trendUp={true}
                icon="check_circle"
                className="stagger-item"
                onClick={() => navigate('/reports')}
              />
              <StatCard
                label="Expiring This Month"
                value={stats.expiring_this_month ?? stats.expiring_this_week}
                trendUp={false}
                trend="Action needed"
                icon="notification_important"
                iconColor="text-red-400"
                className="stagger-item"
                onClick={() => navigate('/members')}
              />
              <StatCard
                label="Points Issued (Month)"
                value={stats.wallet_points_issued_month}
                trend="High engagement"
                trendUp={true}
                icon="stars"
                iconColor="text-[#B8941F]"
                className="stagger-item"
                onClick={() => navigate('/rewards')}
              />
            </>
          ) : null}
        </div>
      </section>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="section-title">Recent Activity</h3>
          <button
            onClick={() => navigate('/reports')}
            className="text-[#B8941F] text-sm font-semibold hover:text-[#9A7A18] flex items-center gap-1 transition-colors"
          >
            View All
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-[#F3F4F6]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-1/3" />
                  <div className="h-3 skeleton rounded w-1/2" />
                </div>
                <div className="w-16 h-4 skeleton rounded" />
              </div>
            ))}
          </div>
        ) : stats && stats.recent_redemptions.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-card overflow-hidden divide-y divide-[#F3F4F6]">
            {stats.recent_redemptions.map((r, idx) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition-colors cursor-pointer group animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => navigate(`/members/${r.member_id}`)}
              >
                <div className="flex items-center gap-3.5">
                  {/* Offer type icon — gold tint container */}
                  <div className="w-10 h-10 rounded-xl bg-[#FBF7EA] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#B8941F] text-[18px]">
                      {OFFER_ICONS[r.offer?.offer_type || 'unknown']}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">{r.member?.name}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{r.offer?.title}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#9CA3AF] mb-1">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[10px]">check_circle</span>
                    Success
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

      {/* ── FAB — gold accent ─────────────────────────────────────────────── */}
      <button
        className="fixed bottom-24 right-4 md:right-12 md:bottom-8 w-14 h-14 bg-[#B8941F] text-white rounded-full shadow-[0_4px_16px_rgba(184,148,31,0.4)] flex items-center justify-center hover:scale-105 hover:shadow-[0_6px_24px_rgba(184,148,31,0.5)] active:scale-95 z-40 transition-all group"
        onClick={() => navigate('/members/new')}
        title="Add new member"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-[#111111] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Add Member
        </span>
      </button>
    </div>
  );
}

