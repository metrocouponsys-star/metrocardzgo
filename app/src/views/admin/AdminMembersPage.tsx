'use client';
import React, { useEffect, useState } from 'react';
import * as api from '../../api';

const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  active: { badge: 'bg-green-100 text-green-800 border-green-200', label: 'Active' },
  expiring_soon: { badge: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Expiring Soon' },
  expired: { badge: 'bg-red-100 text-red-800 border-red-200', label: 'Expired' },
  deactivated: { badge: 'bg-surface-container text-on-surface-variant border-outline-variant/30', label: 'Deactivated' },
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
    api.getAdminAllMembers({ search, merchant_id: merchantFilter, status: statusFilter, limit: 200 })
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [search, merchantFilter, statusFilter]);

  const openDetail = async (merchantId: string) => {
    try {
      const d = await api.getAdminMerchantDetail(merchantId);
      setDetail(d);
      setDetailOpen(true);
    } catch {}
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-7xl mx-auto space-y-xl animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          All Members (Platform-Wide)
        </h2>
        <p className="page-subtitle">Search, filter, and inspect members across all onboarded merchants.</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center bg-surface-container-low p-md rounded-2xl border border-outline-variant/20 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            placeholder="Search name, phone, member code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={merchantFilter}
            onChange={e => setMerchantFilter(e.target.value)}
            className="input-field min-w-[180px]"
          >
            <option value="">All Merchants</option>
            {merchants.map((m: any) => (
              <option key={m.id} value={m.id}>{m.business_name}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field min-w-[150px]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        <div className="text-label-md text-on-surface-variant font-medium whitespace-nowrap bg-surface-container-high px-3 py-2 rounded-xl">
          {members.length} member{members.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Members Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-surface-container-low border-b border-outline-variant/30">
              <tr>
                {['Code', 'Name', 'Phone', 'Merchant', 'Tier', 'Status', 'Points', 'Visits', 'Expiry'].map(h => (
                  <th key={h} className="px-4 py-3 text-label-md font-bold text-on-surface-variant whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-container rounded animate-pulse w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] block mb-2 opacity-40">person_off</span>
                    No members match your current filters.
                  </td>
                </tr>
              ) : (
                members.map(m => {
                  const statusCfg = STATUS_CONFIG[m.status] || { badge: 'bg-surface-container text-on-surface-variant', label: m.status };
                  return (
                    <tr key={m.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-4 py-3 text-body-md font-mono font-bold text-on-surface-variant">{m.member_code}</td>
                      <td className="px-4 py-3 text-body-md font-bold text-on-surface">{m.name}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant whitespace-nowrap">{m.phone}</td>
                      <td className="px-4 py-3 text-body-md">
                        <button
                          onClick={() => openDetail(m.merchant_id)}
                          className="text-primary hover:underline font-semibold text-left transition-colors"
                        >
                          {m.merchant_name || m.merchant_id.slice(0, 8)}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant">{m.membership_type_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-label-sm px-2.5 py-0.5 rounded-full border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body-md font-bold text-primary">{Number(m.loyalty_points).toFixed(0)}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant font-mono">{m.total_visits || 0}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant whitespace-nowrap">{m.expiry_date}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Merchant Detail Slide-Over */}
      {detailOpen && detail && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[900] flex justify-end animate-fade-in"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface h-full shadow-2xl overflow-y-auto flex flex-col animate-slide-in border-l border-outline-variant/30"
            onClick={e => e.stopPropagation()}
          >
            {/* Slide-over Header */}
            <div className="p-lg border-b border-outline-variant/30 flex items-center justify-between">
              <div>
                <span className="text-label-sm font-bold uppercase tracking-widest text-on-surface-variant">Merchant Insights</span>
                <h3 className="text-headline-md font-bold mt-1 text-primary">{detail.merchant?.business_name}</h3>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Slide-over Body */}
            <div className="p-lg flex-1 space-y-lg overflow-y-auto custom-scrollbar">
              {/* Info Cards Grid */}
              <div className="grid grid-cols-2 gap-sm">
                {[
                  { label: 'Category', value: detail.merchant?.category, icon: 'category', color: 'text-primary' },
                  { label: 'Plan Tier', value: detail.merchant?.plan_tier, icon: 'military_tech', color: 'text-amber-500' },
                  { label: 'Status', value: detail.merchant?.status, icon: 'check_circle', color: detail.merchant?.status === 'active' ? 'text-green-600' : 'text-error' },
                  { label: 'Total Members', value: detail.stats?.member_count, icon: 'groups', color: 'text-secondary' },
                  { label: 'Redemptions Today', value: detail.stats?.redemptions_today, icon: 'done_all', color: 'text-tertiary' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`card p-md border border-outline-variant/10 flex flex-col justify-between min-h-[85px]
                      ${item.label === 'Redemptions Today' ? 'col-span-2 bg-primary-container/10 border-primary/10' : ''}`}
                  >
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="text-label-sm font-medium">{item.label}</span>
                      <span className={`material-symbols-outlined text-[16px] ${item.color}`}>{item.icon}</span>
                    </div>
                    <p className="text-body-lg font-bold mt-2 capitalize">{item.value ?? '—'}</p>
                  </div>
                ))}
              </div>

              {/* Recent Members Section */}
              <div className="space-y-md">
                <h4 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Recent Members</h4>
                <div className="divide-y divide-outline-variant/10 border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-lowest">
                  {(detail.recent_members || []).length === 0 ? (
                    <p className="p-4 text-center text-body-sm text-on-surface-variant italic">No members added yet.</p>
                  ) : (
                    detail.recent_members.map((m: any) => (
                      <div key={m.id} className="p-md flex items-center justify-between hover:bg-surface-container-low transition-colors">
                        <div>
                          <p className="font-bold text-on-surface text-body-md">{m.name}</p>
                          <p className="text-label-sm text-on-surface-variant">{m.phone}</p>
                        </div>
                        <span className="text-label-sm text-on-surface-variant font-mono">{m.joined_date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Staff / Owner Accounts Section */}
              <div className="space-y-md">
                <h4 className="text-label-md font-bold text-on-surface uppercase tracking-wider">Staff & Owners</h4>
                <div className="divide-y divide-outline-variant/10 border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-lowest">
                  {(detail.users || []).length === 0 ? (
                    <p className="p-4 text-center text-body-sm text-on-surface-variant italic">No user accounts set up.</p>
                  ) : (
                    detail.users.map((u: any) => (
                      <div key={u.id} className="p-md flex items-center justify-between hover:bg-surface-container-low transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">account_circle</span>
                          <span className="font-bold text-on-surface text-body-md">{u.name}</span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wider">
                          {u.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
