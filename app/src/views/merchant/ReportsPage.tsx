import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { StatCard } from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import type { ReportData } from '../../types';
import * as api from '../../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';

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

export default function ReportsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [data, setData] = useState<ReportData | null>(null);
  const [newMembers, setNewMembers] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [pointsData, setPointsData] = useState<any[]>([]);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('redemptions');
  const [timeMode, setTimeMode] = useState<'daily' | 'weekly'>('daily');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const mId = user?.merchant_id || '';
      const [reportSummary, membersGrowth, leaders, pointsHistory, retention] = await Promise.all([
        api.getReportData(mId),
        api.getNewMembersReport(mId, 30),
        api.getTopCustomersReport(mId, 10),
        api.getPointsReport(mId, 12),
        api.getRetentionReport(mId, 6),
      ]);
      setData(reportSummary);
      setNewMembers(membersGrowth);
      setTopCustomers(leaders);
      setPointsData(pointsHistory);
      setRetentionData(retention);
    } catch (e: any) {
      addToast('error', e.message || 'Failed to fetch reporting analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
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
    // Call the backend CSV streaming export endpoint directly
    const token = (() => {
      try {
        const stored = localStorage.getItem('metro-cardz-auth');
        return stored ? JSON.parse(stored)?.state?.token : null;
      } catch {
        return null;
      }
    })();
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
    const url = `${baseUrl}/api/v1/reports/export/members${token ? `?token=${token}` : ''}`;
    
    // Create an anchor and click it to download
    const link = document.createElement('a');
    link.href = url;
    if (token) {
      // If we need authorization headers, we fetch it as blob
      fetch(`${baseUrl}/api/v1/reports/export/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.blob())
      .then(blob => {
        const localUrl = URL.createObjectURL(blob);
        link.href = localUrl;
        link.download = `members-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
        URL.revokeObjectURL(localUrl);
      })
      .catch(() => {
        addToast('error', 'CSV export failed');
      });
    } else {
      link.download = `members-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    }
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div className="page-header mb-0">
          <h2 className="page-title">Reports & Analytics</h2>
          <p className="page-subtitle">Track business performance, customer visits, and loyalty economy.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportRedemptionsCsv}
            disabled={loading || !data}
            className="btn-outline flex items-center gap-2 py-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Redemptions CSV
          </button>
          <button
            onClick={handleExportMembers}
            disabled={loading}
            className="btn-outline flex items-center gap-2 py-2"
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Export Members
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-gutter">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : data ? (
          <>
            <StatCard label="Total Redemptions" value={data.summary.total_redemptions} icon="receipt_long" />
            <StatCard label="Active Members" value={data.summary.active_members} icon="groups" />
            <StatCard label="Expiring Soon" value={data.summary.expiring_soon} icon="schedule" iconColor="text-amber-500" />
            <StatCard label="Top Offer" value={OFFER_LABELS[data.summary.most_used_offer] || data.summary.most_used_offer || 'None'} icon="star" iconColor="text-amber-400" />
            <StatCard label="Points Issued" value={`${(data.summary.points_issued_month || 0).toLocaleString()} pts`} icon="add_circle" iconColor="text-green-500" />
            <StatCard label="Points Redeemed" value={`${(data.summary.points_redeemed_month || 0).toLocaleString()} pts`} icon="stars" iconColor="text-amber-500" />
          </>
        ) : null}
      </section>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30">
        {([
          { id: 'redemptions', label: 'Redemptions', icon: 'receipt_long' },
          { id: 'members', label: 'Member Growth', icon: 'person_add' },
          { id: 'points', label: 'Points Economy', icon: 'stars' },
          { id: 'leaderboard', label: 'Top Customers', icon: 'leaderboard' },
          { id: 'retention', label: 'Customer Retention', icon: 'sync' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-label-md font-label-md border-b-2 transition-all flex items-center gap-1.5
              ${tab === t.id ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content: Redemptions */}
      {tab === 'redemptions' && (
        <div className="space-y-lg animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            {/* Redemptions by Type */}
            <div className="card p-lg">
              <h3 className="section-title mb-4">Redemptions by Offer Type</h3>
              {loading ? (
                <div className="h-[220px] bg-surface-container rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.redemptions_by_offer.map(d => ({ ...d, name: OFFER_LABELS[d.offer_type] || d.offer_type }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Redemptions Over Time */}
            <div className="card p-lg">
              <h3 className="section-title mb-4">Redemptions Over Time</h3>
              {loading ? (
                <div className="h-[220px] bg-surface-container rounded-xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data?.redemptions_over_time.map(d => ({ ...d, date: format(new Date(d.date), 'dd MMM') }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                    <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} name="Redemptions" />
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
                    {['Member', 'Offer Used', 'Staff Partner', 'Date & Time'].map(h => (
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
                      <td className="px-4 py-3 text-body-md">
                        <span className="font-semibold text-on-surface">{r.offer?.title}</span>
                      </td>
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
      )}

      {/* Tab content: Member Growth */}
      {tab === 'members' && (
        <div className="card p-lg space-y-md animate-fade-in">
          <div>
            <h3 className="section-title">New Member Signups</h3>
            <p className="text-body-sm text-on-surface-variant">Daily member acquisition over the last 30 days.</p>
          </div>
          {loading ? (
            <div className="h-[300px] bg-surface-container rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={newMembers.map(d => ({ ...d, date: format(new Date(d.date), 'dd MMM') }))}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMembers)" name="New Enrolments" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Tab content: Points Economy */}
      {tab === 'points' && (
        <div className="card p-lg space-y-md animate-fade-in">
          <div>
            <h3 className="section-title">Points Earned vs Redeemed</h3>
            <p className="text-body-sm text-on-surface-variant">Weekly volume of points issued via redemptions vs. points spent on rewards.</p>
          </div>
          {loading ? (
            <div className="h-[300px] bg-surface-container rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pointsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
                <Legend />
                <Bar dataKey="points_earned" fill="#10b981" name="Points Earned" radius={[4, 4, 0, 0]} />
                <Bar dataKey="points_redeemed" fill="#ef4444" name="Points Spent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Tab content: Top Customers */}
      {tab === 'leaderboard' && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="p-lg border-b border-outline-variant/30">
            <h3 className="section-title">Customer Leaderboard</h3>
            <p className="text-body-sm text-on-surface-variant">Your top 10 most loyal customers ranked by total visits.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Rank', 'Customer', 'Mobile Number', 'Total Visits', 'Redemptions', 'Points Balance'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-surface-container rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : topCustomers.map((c, i) => (
                  <tr key={c.member_id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 font-bold text-primary">#{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-body-md font-bold">{c.name}</p>
                      <p className="text-label-sm text-on-surface-variant">#{c.member_code}</p>
                    </td>
                    <td className="px-4 py-3 text-body-md font-mono">{c.phone}</td>
                    <td className="px-4 py-3 text-body-md font-bold text-on-surface">{c.total_visits}</td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{c.redemption_count}</td>
                    <td className="px-4 py-3 text-body-md font-bold text-amber-600">
                      {parseFloat(c.loyalty_points || '0').toLocaleString()} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab content: Cohort Retention */}
      {tab === 'retention' && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="p-lg border-b border-outline-variant/30">
            <h3 className="section-title">Cohort Retention Report</h3>
            <p className="text-body-sm text-on-surface-variant">Track signups by month and the percentage of members active (who redeemed an offer) in the last 30 days.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Signup Month', 'Joined Members', 'Retained (Active 30d)', 'Retention Rate'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-surface-container rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : retentionData.map(c => (
                  <tr key={c.cohort} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3 text-body-md font-bold">{c.cohort}</td>
                    <td className="px-4 py-3 text-body-md font-medium text-on-surface">{c.joined} members</td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{c.retained} members</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-surface-container-highest rounded-full h-2 max-w-[120px] overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${c.retention_rate}%` }} />
                        </div>
                        <span className="text-body-md font-bold text-primary">{c.retention_rate}%</span>
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
