import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import type { AdminDashboardStats } from '../../types';
import * as api from '../../api/client';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">
      <div className="prime-gradient rounded-2xl p-6 text-white">
        <h2 className="text-headline-lg-mobile font-headline-lg text-white mb-1">Platform Overview</h2>
        <p className="opacity-80 text-body-md">Super Admin — Metro Cardz</p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {loading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : stats ? (
          <>
            <StatCard label="Total Merchants" value={stats.total_merchants} icon="storefront" />
            <StatCard label="Total Members" value={stats.total_members.toLocaleString()} icon="groups" />
            <StatCard label="Redemptions Today" value={stats.redemptions_today} icon="receipt_long" />
            <StatCard label="Active Merchants" value={`${stats.active_merchants} / ${stats.total_merchants}`} icon="check_circle" />
          </>
        ) : null}
      </section>

      <section>
        <div className="flex items-center justify-between mb-md">
          <h3 className="section-title">Recent Merchant Activity</h3>
          <button onClick={() => navigate('/admin/merchants')} className="text-primary text-label-md font-bold hover:underline">View All</button>
        </div>
        <div className="card divide-y divide-outline-variant/20">
          {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4 h-16 animate-pulse" />) :
            stats?.recent_merchant_activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-4 hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate('/admin/merchants')}>
                <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                </div>
                <div className="flex-1">
                  <p className="text-body-md font-bold">{a.business_name}</p>
                  <p className="text-label-sm text-on-surface-variant">{a.action}</p>
                </div>
                <p className="text-label-sm text-on-surface-variant">{formatDistanceToNow(new Date(a.at), { addSuffix: true })}</p>
              </div>
            ))
          }
        </div>
      </section>
    </div>
  );
}
