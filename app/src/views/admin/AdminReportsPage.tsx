'use client';
import React, { useEffect, useState } from 'react';
import { getAdminReportStats, getAdminReportsByMerchant } from '../../api/realClient';
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
        getAdminReportStats({ date_from: dateFrom || undefined, date_to: dateTo || undefined }),
        getAdminReportsByMerchant(),
      ]);
      setStats(s);
      setByMerchant(bm.slice(0, 15));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const statCards = stats ? [
    { label: 'Total Redemptions', value: stats.total_redemptions, color: '#6c63ff' },
    { label: 'Total Members', value: stats.total_members, color: '#00b894' },
    { label: 'Active Merchants', value: stats.active_merchants, color: '#00236f' },
    { label: 'New Members This Month', value: stats.new_members_this_month, color: '#fd79a8' },
    { label: 'Points Issued', value: Number(stats.total_points_issued).toFixed(0), color: '#fdcb6e' },
    { label: 'Points Redeemed', value: Number(stats.total_points_redeemed).toFixed(0), color: '#e17055' },
  ] : [];

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--clr-text-primary)' }}>
        Platform-Wide Reports
      </h1>

      {/* Date filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.875rem', color: 'var(--clr-text-secondary)' }}>From:</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)' }} />
        <label style={{ fontSize: '0.875rem', color: 'var(--clr-text-secondary)' }}>To:</label>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)' }} />
        <button onClick={load}
          style={{ padding: '0.4rem 1rem', borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Apply
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.25rem', height: 90, animation: 'pulse 1.5s infinite' }} />
        )) : statCards.map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', borderTop: `3px solid ${color}` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Redemptions by Merchant Chart */}
      <div style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.5rem', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Redemptions by Merchant</h2>
        {byMerchant.length === 0 ? (
          <p style={{ color: 'var(--clr-text-secondary)', textAlign: 'center', padding: '2rem' }}>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byMerchant} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
              <XAxis dataKey="merchant_name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v} redemptions`]} />
              <Bar dataKey="redemption_count" fill="#6c63ff" radius={[4, 4, 0, 0]} name="Redemptions" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Member count by Merchant Table */}
      <div style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Top Merchants by Redemptions</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--clr-surface-alt)' }}>
                {['#', 'Merchant', 'Members', 'Redemptions'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byMerchant.map((m, i) => (
                <tr key={m.merchant_id} style={{ borderTop: '1px solid var(--clr-border)' }}>
                  <td style={{ padding: '0.6rem 1rem', color: 'var(--clr-text-secondary)' }}>{i + 1}</td>
                  <td style={{ padding: '0.6rem 1rem', fontWeight: 500 }}>{m.merchant_name}</td>
                  <td style={{ padding: '0.6rem 1rem' }}>{m.member_count}</td>
                  <td style={{ padding: '0.6rem 1rem', fontWeight: 700, color: 'var(--clr-primary)' }}>{m.redemption_count}</td>
                </tr>
              ))}
              {byMerchant.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--clr-text-secondary)' }}>No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
