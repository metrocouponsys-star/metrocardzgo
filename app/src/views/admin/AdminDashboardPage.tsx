import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import type { AdminDashboardStats } from '../../types';
import * as api from '../../api';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminStats()
      .then(s => {
        setStats(s);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">
      <div className="prime-gradient rounded-2xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
        <div>
          <h2 className="text-headline-lg-mobile font-headline-lg text-white mb-1">Platform Overview</h2>
          <p className="opacity-80 text-body-md">Super Admin Panel — Metro Cardz</p>
        </div>
      </div>

      {/* Pending Approvals Warning Alert */}
      {!loading && stats && (stats.pending_approvals || 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-800">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
            <div>
              <h4 className="text-label-md font-bold text-yellow-900">Merchants Awaiting Review</h4>
              <p className="text-body-sm text-yellow-800">There are {stats.pending_approvals} new merchant registrations pending approval.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/merchants')}
            className="w-full sm:w-auto bg-yellow-800 hover:bg-yellow-900 text-white text-label-md font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            Review Requests
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* Stats Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-gutter">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : stats ? (
          <>
            <StatCard label="Total Merchants" value={stats.total_merchants} icon="storefront" />
            <StatCard label="Pending Approval" value={stats.pending_approvals || 0} icon="pending_actions" iconColor={(stats.pending_approvals || 0) > 0 ? "text-yellow-600" : "text-on-surface-variant"} />
            <StatCard label="Total Members" value={stats.total_members.toLocaleString()} icon="groups" />
            <StatCard label="Redemptions Today" value={stats.redemptions_today} icon="receipt_long" />
            <StatCard label="Active Merchants" value={`${stats.active_merchants} / ${stats.total_merchants}`} icon="check_circle" />
          </>
        ) : null}
      </section>


      {/* Quick Action links */}
      <section className="card p-lg space-y-md">
        <h3 className="section-title">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <button
            onClick={() => navigate('/admin/merchants')}
            className="p-md bg-surface-container-low border border-outline-variant/30 hover:border-primary rounded-xl text-left transition-all group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </div>
            <div>
              <p className="font-bold text-body-md text-on-surface">Manage Merchants</p>
              <p className="text-label-sm text-on-surface-variant">Approve, suspend, or view users.</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/cards')}
            className="p-md bg-surface-container-low border border-outline-variant/30 hover:border-primary rounded-xl text-left transition-all group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">credit_card</span>
            </div>
            <div>
              <p className="font-bold text-body-md text-on-surface">Card Inventory</p>
              <p className="text-label-sm text-on-surface-variant">Batch generate or allocate cards.</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/merchants')}
            className="p-md bg-surface-container-low border border-outline-variant/30 hover:border-primary rounded-xl text-left transition-all group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
            <div>
              <p className="font-bold text-body-md text-on-surface">Pending Requests</p>
              <p className="text-label-sm text-on-surface-variant">Onboard and verify registrations.</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
