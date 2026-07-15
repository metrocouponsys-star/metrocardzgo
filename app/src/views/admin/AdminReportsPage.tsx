'use client';
import React, { useEffect, useState } from 'react';
import * as api from '../../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [byMerchant, setByMerchant] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, bm] = await Promise.all([
        api.getAdminReportStats({ date_from: dateFrom || undefined, date_to: dateTo || undefined }),
        api.getAdminReportsByMerchant(),
      ]);
      setStats(s);
      setByMerchant(bm.slice(0, 15));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const statCards = stats ? [
    { label: 'Total Redemptions', value: stats.total_redemptions, color: 'text-primary', bg: 'bg-primary-container/20', border: 'border-primary/20', icon: 'receipt_long' },
    { label: 'Total Members', value: stats.total_members, color: 'text-secondary', bg: 'bg-secondary-container', border: 'border-secondary/20', icon: 'groups' },
    { label: 'Active Merchants', value: stats.active_merchants, color: 'text-tertiary', bg: 'bg-tertiary-container/30', border: 'border-tertiary/20', icon: 'storefront' },
    { label: 'New Members (Month)', value: stats.new_members_this_month, color: 'text-error', bg: 'bg-error-container', border: 'border-error/20', icon: 'person_add' },
    { label: 'Points Issued', value: Number(stats.total_points_issued).toLocaleString(undefined, { maximumFractionDigits: 0 }), color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bolt' },
    { label: 'Points Redeemed', value: Number(stats.total_points_redeemed).toLocaleString(undefined, { maximumFractionDigits: 0 }), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: 'stars' },
  ] : [];

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-7xl mx-auto space-y-xl animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            Platform-Wide Reports
          </h2>
          <p className="page-subtitle">Cross-merchant aggregated analytics and metrics dashboard.</p>
        </div>

        {/* Date filters */}
        <div className="flex flex-wrap items-center gap-2 bg-surface-container p-2 rounded-xl border border-outline-variant/30">
          <div className="flex items-center gap-1.5">
            <span className="text-label-sm text-on-surface-variant font-medium">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-2 py-1 text-body-sm rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-label-sm text-on-surface-variant font-medium">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2 py-1 text-body-sm rounded-lg border border-outline-variant bg-surface focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="btn-primary py-1 px-3 text-label-sm min-h-0 flex items-center gap-1"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">filter_alt</span>
            )}
            Apply
          </button>
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-md">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-md animate-pulse h-28 bg-surface-container rounded-2xl" />
          ))
        ) : (
          statCards.map((c, i) => (
            <div key={i} className={`card p-md flex flex-col justify-between border ${c.border} hover:shadow-elevated transition-shadow duration-200`}>
              <div className="flex justify-between items-start">
                <span className="text-label-sm text-on-surface-variant font-medium leading-tight">{c.label}</span>
                <span className={`material-symbols-outlined text-[20px] ${c.color}`}>{c.icon}</span>
              </div>
              <div className="mt-4">
                <span className={`text-headline-lg font-bold ${c.color}`}>{c.value}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Redemptions by Merchant Chart */}
      <div className="card p-lg shadow-tonal space-y-md">
        <h3 className="section-title flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed-dim">bar_chart</span>
          Redemptions by Merchant
        </h3>
        {loading ? (
          <div className="h-[280px] bg-surface-container rounded-xl animate-pulse" />
        ) : byMerchant.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant bg-surface-container/20 rounded-xl">
            <span className="material-symbols-outlined text-[48px] block mb-2 opacity-40">bar_chart</span>
            <p className="text-body-md">No platform redemption data found for current filters</p>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMerchant} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="merchant_name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [`${v} redemptions`]} contentStyle={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px' }} />
                <Bar dataKey="redemption_count" fill="var(--md-sys-color-primary, #00236f)" radius={[6, 6, 0, 0]} name="Redemptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Member count by Merchant Table */}
      <div className="card p-lg shadow-tonal space-y-md">
        <h3 className="section-title flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">trending_up</span>
          Top Merchants by Redemptions
        </h3>
        <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
          <table className="w-full border-collapse text-left">
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-container rounded animate-pulse w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : byMerchant.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant italic">No merchant reports compiled.</td>
                </tr>
              ) : (
                byMerchant.map((m, i) => (
                  <tr key={m.merchant_id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 text-body-md text-on-surface-variant font-mono">{i + 1}</td>
                    <td className="px-4 py-3 text-body-md font-bold text-on-surface">{m.merchant_name}</td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{m.member_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-body-md font-bold text-primary">{m.redemption_count.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
