'use client';
import React, { useEffect, useState } from 'react';
import { getAdminAllMembers, getAdminMerchantDetail } from '../../api/realClient';
import * as api from '../../api/realClient';

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--clr-success)',
  expiring_soon: 'var(--clr-warning)',
  expired: 'var(--clr-error)',
  deactivated: 'var(--clr-neutral)',
};

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    api.getAdminMerchants().then(setMerchants).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getAdminAllMembers({ search, merchant_id: merchantFilter, status: statusFilter, limit: 200 })
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [search, merchantFilter, statusFilter]);

  const openDetail = async (merchantId: string) => {
    try {
      const d = await getAdminMerchantDetail(merchantId);
      setDetail(d);
      setDetailOpen(true);
    } catch {}
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--clr-text-primary)' }}>
        All Members (Platform-Wide)
      </h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Search name, phone, code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', minWidth: 220 }}
        />
        <select value={merchantFilter} onChange={e => setMerchantFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', minWidth: 180 }}>
          <option value="">All Merchants</option>
          {merchants.map((m: any) => <option key={m.id} value={m.id}>{m.business_name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)' }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <span style={{ alignSelf: 'center', color: 'var(--clr-text-secondary)', fontSize: '0.875rem' }}>
          {members.length} members
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', background: 'var(--clr-surface)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--clr-surface-alt)' }}>
              {['Code', 'Name', 'Phone', 'Merchant', 'Tier', 'Status', 'Points', 'Visits', 'Expiry'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-secondary)' }}>Loading…</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-secondary)' }}>No members found</td></tr>
            ) : members.map(m => (
              <tr key={m.id} style={{ borderTop: '1px solid var(--clr-border)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--clr-surface-alt)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>{m.member_code}</td>
                <td style={{ padding: '0.65rem 1rem', fontWeight: 500 }}>{m.name}</td>
                <td style={{ padding: '0.65rem 1rem' }}>{m.phone}</td>
                <td style={{ padding: '0.65rem 1rem' }}>
                  <button onClick={() => openDetail(m.merchant_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--clr-primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                    {m.merchant_name || m.merchant_id.slice(0, 8)}
                  </button>
                </td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--clr-text-secondary)' }}>{m.membership_type_name || '—'}</td>
                <td style={{ padding: '0.65rem 1rem' }}>
                  <span style={{ background: STATUS_COLORS[m.status] + '22', color: STATUS_COLORS[m.status], padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
                    {m.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--clr-primary)' }}>{Number(m.loyalty_points).toFixed(0)}</td>
                <td style={{ padding: '0.65rem 1rem' }}>{m.total_visits}</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--clr-text-secondary)' }}>{m.expiry_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Merchant Detail Slide-Over */}
      {detailOpen && detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setDetailOpen(false)}>
          <div style={{ width: 420, background: 'var(--clr-surface)', height: '100%', overflowY: 'auto', padding: '1.5rem', boxShadow: '-4px 0 20px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{detail.merchant?.business_name}</h2>
              <button onClick={() => setDetailOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                ['Category', detail.merchant?.category],
                ['Plan', detail.merchant?.plan_tier],
                ['Status', detail.merchant?.status],
                ['Members', detail.stats?.member_count],
                ['Redemptions Today', detail.stats?.redemptions_today],
              ].map(([k, v]) => (
                <div key={k as string} style={{ background: 'var(--clr-surface-alt)', borderRadius: 8, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-secondary)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 600 }}>{v ?? '—'}</div>
                </div>
              ))}
            </div>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Recent Members</h3>
            {(detail.recent_members || []).map((m: any) => (
              <div key={m.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--clr-border)', fontSize: '0.875rem' }}>
                <strong>{m.name}</strong> · {m.phone}
                <span style={{ float: 'right', color: 'var(--clr-text-secondary)' }}>{m.joined_date}</span>
              </div>
            ))}
            <h3 style={{ fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Staff / Owners</h3>
            {(detail.users || []).map((u: any) => (
              <div key={u.id} style={{ padding: '0.4rem 0', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{u.name}</span>
                <span style={{ background: 'var(--clr-primary-light)', color: 'var(--clr-primary)', padding: '1px 8px', borderRadius: 99, fontSize: '0.75rem' }}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
