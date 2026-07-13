import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import type { DashboardStats } from '../../types';
import * as api from '../../api';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats(user?.merchant_id || '').then(s => {
      setStats(s);
      setLoading(false);
    });
  }, [user?.merchant_id]);

  const OFFER_ICONS: Record<string, string> = {
    percent_off: 'percent', free_service: 'spa', wallet_points: 'account_balance_wallet',
    referral: 'people', birthday: 'cake', unknown: 'star',
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl">
      {/* Hero CTA */}
      <section
        className="relative overflow-hidden rounded-2xl bg-primary shadow-elevated p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer active-scale group"
        onClick={() => navigate('/members')}
      >
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-container/30 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-white mb-1">Scan / Search Customer</h2>
          <p className="text-on-primary-container text-body-md opacity-90">Instantly redeem offers or check member status.</p>
        </div>
        <div className="relative z-10 bg-white/20 p-4 rounded-full group-hover:scale-110 transition-transform self-start md:self-auto">
          <span className="material-symbols-outlined text-[48px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard label="Total Active Members" value={stats.total_active_members.toLocaleString()} trend="+12% this month" icon="groups" />
            <StatCard label="Redemptions Today" value={stats.redemptions_today} trend="All handled" icon="check_circle" />
            <StatCard label="Expiring This Week" value={stats.expiring_this_week} trendUp={false} trend="Action needed" icon="notification_important" iconColor="text-error" />
            <StatCard label="Wallet Points Issued" value={`${(stats.wallet_points_issued_month / 1000).toFixed(1)}K`} trend="High engagement" icon="stars" />
          </>
        ) : null}
      </section>

      {/* Recent Activity */}
      <section className="space-y-md">
        <div className="flex justify-between items-center">
          <h3 className="section-title">Recent Activity</h3>
          <button onClick={() => navigate('/reports')} className="text-primary text-label-md font-bold hover:underline">View All</button>
        </div>

        {loading ? (
          <div className="card divide-y divide-outline-variant animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-surface-container" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container rounded w-1/3" />
                  <div className="h-3 bg-surface-container rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : stats && stats.recent_redemptions.length > 0 ? (
          <div className="bg-white rounded-xl shadow-tonal divide-y divide-outline-variant overflow-hidden">
            {stats.recent_redemptions.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors cursor-pointer"
                onClick={() => navigate(`/members/${r.member_id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-secondary-container text-[18px]">
                      {OFFER_ICONS[r.offer?.offer_type || 'unknown']}
                    </span>
                  </div>
                  <div>
                    <p className="text-body-lg font-bold text-on-surface">{r.member?.name}</p>
                    <p className="text-body-md text-on-surface-variant">{r.offer?.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-label-md text-on-surface-variant">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </p>
                  <span className="text-label-sm bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">Success</span>
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

      {/* Quick Actions FAB */}
      <button
        className="fixed bottom-24 right-4 md:right-12 md:bottom-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-elevated flex items-center justify-center active-scale hover:scale-105 z-40 transition-transform"
        onClick={() => navigate('/members/new')}
        title="Add new member"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>
    </div>
  );
}
