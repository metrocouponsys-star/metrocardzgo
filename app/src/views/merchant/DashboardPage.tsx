import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import type { DashboardStats, CelebrationMember } from '../../types';
import * as api from '../../api';
import { cached } from '../../api/cache';
import { formatDistanceToNow, format } from 'date-fns';

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
  // Celebrations
  const [celebrations, setCelebrations] = useState<CelebrationMember[]>([]);
  const [celebrationsLoading, setCelebrationsLoading] = useState(true);

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
    // Load celebrations (birthday/anniversary) on mount
    api.getCelebrations(7).then(setCelebrations).catch(() => setCelebrations([]))
      .finally(() => setCelebrationsLoading(false));
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
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-6">

      {/* ── Scan / Search CTA ─── */}
      <section
        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-primary/[0.08] shadow-sm cursor-pointer active:opacity-80 md:hidden"
        onClick={() => navigate('/members/search?tab=qr')}
      >
        <div className="w-11 h-11 rounded-xl bg-primary/[0.08] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-on-surface">Scan / Search Customer</p>
          <p className="text-[12px] text-on-surface-variant truncate">Redeem offers, add points, check member status</p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
      </section>

      {/* Desktop scan card */}
      <section
        className="hidden md:flex items-center gap-4 p-5 bg-white rounded-2xl border border-primary/[0.08] shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/members/search?tab=qr')}
      >
        <div className="w-12 h-12 rounded-xl bg-primary/[0.08] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-semibold text-on-surface">Scan / Search Customer</p>
          <p className="text-[13px] text-on-surface-variant">Redeem offers, add points, or check member status</p>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant text-[22px]">chevron_right</span>
      </section>

      {/* ── Quick Actions ─── */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { icon: 'person_add', label: 'Add Member', route: '/members/new', color: 'from-primary/10 to-primary/5' },
          { icon: 'local_offer', label: 'Offers', route: '/offers', color: 'from-secondary/10 to-secondary/5' },
          { icon: 'bar_chart', label: 'Reports', route: '/reports', color: 'from-primary-container/20 to-primary-container/10' },
        ].map((action) => (
          <button
            key={action.route}
            onClick={() => navigate(action.route)}
            className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl bg-white border border-primary/[0.06] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{action.icon}</span>
            </div>
            <span className="text-[12px] font-semibold text-on-surface">{action.label}</span>
          </button>
        ))}
      </section>

      {/* ── 🎉 Birthday & Anniversary Notifications ─── */}
      {(() => {
        const todayBirthdays = celebrations.filter(c => c.event_type === 'birthday' && c.days_until === 0);
        const todayAnniversaries = celebrations.filter(c => c.event_type === 'anniversary' && c.days_until === 0);
        const upcomingBirthdays = celebrations.filter(c => c.event_type === 'birthday' && c.days_until > 0);
        const upcomingAnniversaries = celebrations.filter(c => c.event_type === 'anniversary' && c.days_until > 0);
        const todayCount = todayBirthdays.length + todayAnniversaries.length;

        if (celebrationsLoading) return (
          <section className="bg-white rounded-2xl border border-primary/[0.06] shadow-sm p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-surface-container-high" />
                <div className="h-4 w-40 bg-surface-container-high rounded-lg" />
              </div>
              <div className="h-3 w-16 bg-surface-container-high rounded-lg" />
            </div>
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 p-2 bg-surface-container/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-28 bg-surface-container-high rounded" />
                    <div className="h-2 w-20 bg-surface-container-high rounded" />
                  </div>
                  <div className="h-6 w-16 bg-surface-container-high rounded-full" />
                </div>
              ))}
            </div>
          </section>
        );

        return (
          <section className="bg-white rounded-2xl border border-primary/[0.06] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary/[0.04]">
              <div className="flex items-center gap-2">
                <span className="text-[18px]">🎉</span>
                <h3 className="text-[15px] font-bold text-on-surface">Celebrations Today</h3>
                {todayCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse inline-block" />
                    <span className="text-[11px] font-bold text-secondary bg-secondary/[0.1] px-1.5 py-0.5 rounded-full">
                      {todayCount} today
                    </span>
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/campaigns')}
                className="text-primary text-[12px] font-bold hover:underline flex items-center gap-0.5"
              >
                Reminders
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>

            {/* Today's celebrations */}
            {todayCount === 0 && upcomingBirthdays.length === 0 && upcomingAnniversaries.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-[13px] text-on-surface-variant">No celebrations in the next 7 days</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/[0.04]">
                {/* Today's Birthdays */}
                {todayBirthdays.map(m => (
                  <div
                    key={`bd-${m.member_id}`}
                    onClick={() => navigate(`/members/${m.member_id}`)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-pink-50 cursor-pointer transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center shrink-0 text-[18px]">
                      🎂
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-on-surface group-hover:text-pink-700 transition-colors">{m.name}</p>
                      <p className="text-[11px] text-on-surface-variant">{m.member_code} · Birthday Today!</p>
                    </div>
                    <span className="text-[11px] font-bold text-pink-600 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full shrink-0">
                      🎁 Give Gift
                    </span>
                  </div>
                ))}
                {/* Today's Anniversaries */}
                {todayAnniversaries.map(m => (
                  <div
                    key={`ann-${m.member_id}`}
                    onClick={() => navigate(`/members/${m.member_id}`)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 text-[18px]">
                      💍
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-on-surface group-hover:text-purple-700 transition-colors">{m.name}</p>
                      <p className="text-[11px] text-on-surface-variant">{m.member_code} · Anniversary Today!</p>
                    </div>
                    <span className="text-[11px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full shrink-0">
                      🎁 Give Gift
                    </span>
                  </div>
                ))}
                {/* Upcoming section (collapsed, only show if no today or after today rows) */}
                {(upcomingBirthdays.length > 0 || upcomingAnniversaries.length > 0) && (
                  <div className="px-4 py-2 bg-surface-container/30">
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide mb-1.5">Upcoming — Next 7 Days</p>
                    <div className="flex flex-wrap gap-2">
                      {[...upcomingBirthdays, ...upcomingAnniversaries]
                        .sort((a, b) => a.days_until - b.days_until)
                        .slice(0, 6)
                        .map(m => (
                          <button
                            key={`up-${m.event_type}-${m.member_id}`}
                            onClick={() => navigate(`/members/${m.member_id}`)}
                            className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant bg-white border border-primary/[0.08] px-2.5 py-1 rounded-full hover:border-primary/30 hover:text-primary transition-all"
                          >
                            <span>{m.event_type === 'birthday' ? '🎂' : '💍'}</span>
                            <span>{m.name}</span>
                            <span className="text-on-surface-variant/60">in {m.days_until}d</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })()}

      {/* ── Stats Grid ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-bold text-on-surface">Overview</h3>
          {/* Refresh badge */}
          <div className="flex items-center gap-2">
            {updatedLabel && !loading && (
              <span className="text-[11px] text-on-surface-variant flex items-center gap-1 animate-fade-in font-medium">
                {refreshing
                  ? <span className="material-symbols-outlined text-[13px] animate-spin-slow text-primary">refresh</span>
                  : <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
                }
                {refreshing ? 'Refreshing…' : updatedLabel}
              </span>
            )}
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing || loading}
              title="Refresh stats"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-primary/[0.06] hover:text-primary transition-all disabled:opacity-40"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin-slow' : ''}`}>refresh</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : error ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-error/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-error">cloud_off</span>
              </div>
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
                value={`${stats.total_active_members} / ${stats.total_cards_assigned || stats.total_active_members}`}
                trend={`${stats.total_active_members} Active / ${stats.total_cards_assigned || stats.total_active_members} Cards Assigned`}
                icon="groups"
                className="stagger-item"
                onClick={() => navigate('/members')}
              />
              <StatCard
                label="Redemptions Today"
                value={stats.redemptions_today}
                trend="All handled"
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
                iconColor="text-error"
                className="stagger-item"
                onClick={() => navigate('/members')}
              />
              <StatCard
                label="Points Issued (Month)"
                value={stats.wallet_points_issued_month}
                trend="High engagement"
                icon="stars"
                className="stagger-item"
                onClick={() => navigate('/rewards')}
              />
            </>
          ) : null}
        </div>
      </section>

      {/* ── Recent Activity ─── */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[17px] font-bold text-on-surface">Recent Activity</h3>
          <button onClick={() => navigate('/reports')} className="text-primary text-[13px] font-bold hover:underline flex items-center gap-1 transition-colors">
            View All
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-primary/[0.06] shadow-sm divide-y divide-primary/[0.04]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-10 h-10 rounded-xl skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded-lg w-1/3" />
                  <div className="h-3 skeleton rounded-lg w-1/2" />
                </div>
                <div className="w-16 h-4 skeleton rounded-lg" />
              </div>
            ))}
          </div>
        ) : stats && stats.recent_redemptions.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-primary/[0.06] overflow-hidden">
            {stats.recent_redemptions.map((r, idx) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-4 py-3.5 hover:bg-primary/[0.02] transition-colors cursor-pointer group animate-slide-up ${
                  idx > 0 ? 'border-t border-primary/[0.04]' : ''
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => navigate(`/members/${r.member_id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="icon-container w-10 h-10 shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {OFFER_ICONS[r.offer?.offer_type || 'unknown']}
                    </span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-on-surface group-hover:text-primary transition-colors">{r.member?.name}</p>
                    <p className="text-[12px] text-on-surface-variant">{r.offer?.title}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <p className="text-[11px] text-on-surface-variant font-medium">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </p>
                  <span className="text-[11px] bg-secondary/[0.08] text-secondary px-2 py-0.5 rounded-lg font-semibold inline-flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
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

      {/* ── FAB ─── */}
      <button
        className="fixed bottom-24 right-4 md:right-12 md:bottom-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-2xl shadow-lg flex items-center justify-center active-scale hover:scale-105 z-40 transition-all group hover:shadow-xl"
        onClick={() => navigate('/members/new')}
        title="Add new member"
      >
        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
        {/* Tooltip */}
        <span className="absolute right-full mr-3 bg-on-surface text-surface text-[11px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Add Member
        </span>
      </button>
    </div>
  );
}
