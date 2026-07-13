import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import type { ReportData } from '../../types';
import * as api from '../../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { format } from 'date-fns';

const OFFER_LABELS: Record<string, string> = {
  percent_off: '% Off', free_service: 'Free Service', wallet_points: 'Wallet',
  referral: 'Referral', birthday: 'Birthday',
};

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeMode, setTimeMode] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    api.getReportData(user?.merchant_id || '').then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Member', 'Offer', 'Staff', 'Date', 'Time'],
      ...data.all_redemptions.map(r => [
        r.member?.name || '', r.offer?.title || '', r.staff_name || '',
        format(new Date(r.created_at), 'dd/MM/yyyy'),
        format(new Date(r.created_at), 'HH:mm'),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redemptions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h2 className="page-title">Reports & Analytics</h2>
          <p className="page-subtitle">Track redemption performance and member engagement.</p>
        </div>
        <button onClick={exportCsv} disabled={loading || !data} className="btn-outline flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-gutter">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : data ? (
          <>
            <StatCard label="Total Redemptions" value={data.summary.total_redemptions} icon="receipt_long" />
            <StatCard label="Active Members" value={data.summary.active_members} icon="groups" />
            <StatCard label="Expiring Soon" value={data.summary.expiring_soon} icon="schedule" iconColor="text-amber-500" trendUp={false} />
            <StatCard label="Top Offer" value={data.summary.most_used_offer} icon="star" iconColor="text-amber-400" />
            {/* Feature 1: loyalty points stats */}
            <StatCard label="Points Earned (Mo.)" value={`${(data.summary.points_issued_month || 0).toLocaleString()} pts`} icon="add_circle" iconColor="text-green-500" />
            <StatCard label="Points Redeemed (Mo.)" value={`${(data.summary.points_redeemed_month || 0).toLocaleString()} pts`} icon="stars" iconColor="text-amber-500" />
          </>
        ) : null}
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Bar chart */}
        <div className="card p-lg">
          <h3 className="section-title mb-4">Redemptions by Offer Type</h3>
          {loading ? (
            <div className="h-48 bg-surface-container rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.redemptions_by_offer.map(d => ({ ...d, name: OFFER_LABELS[d.offer_type] || d.offer_type }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c5c5d3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="count" fill="#006c49" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line chart */}
        <div className="card p-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Redemptions Over Time</h3>
            <div className="flex gap-1 bg-surface-container rounded-lg p-1">
              {(['daily', 'weekly'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setTimeMode(m)}
                  className={`px-3 py-1 rounded-md text-label-md capitalize transition-all ${timeMode === m ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-48 bg-surface-container rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.redemptions_over_time.map(d => ({ ...d, date: format(new Date(d.date), 'dd MMM') }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c5c5d3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="count" stroke="#00236f" strokeWidth={2} dot={{ fill: '#00236f', r: 4 }} name="Redemptions" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Redemptions Table */}
      <div className="card overflow-hidden">
        <div className="p-lg border-b border-outline-variant/30">
          <h3 className="section-title">All Redemptions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low">
              <tr>
                {['Member', 'Offer', 'Staff', 'Date & Time'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-surface-container rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.all_redemptions.map(r => (
                <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-body-md font-bold">{r.member?.name}</p>
                    <p className="text-label-sm text-on-surface-variant">#{r.member?.member_code}</p>
                  </td>
                  <td className="px-4 py-3 text-body-md">{r.offer?.title}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface-variant">{r.staff_name}</td>
                  <td className="px-4 py-3 text-label-sm text-on-surface-variant">
                    {format(new Date(r.created_at), 'dd MMM yyyy, HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
