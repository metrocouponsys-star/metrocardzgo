import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { Member } from '../../types';
import * as api from '../../api';
import { cached, invalidateContaining } from '../../api/cache';
import { StatusBadge, MembershipBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';

export default function MembersListPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'deactivated'>('all');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const cacheKey = `members/${user?.merchant_id}`;
    try {
      const data = await cached(
        cacheKey,
        () => api.getMembers(user?.merchant_id || ''),
        (fresh) => setMembers(fresh),
      );
      setMembers(data);
    } catch {
      addToast('error', 'Failed to load customer list');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = m.name.toLowerCase().includes(q);
        const phoneMatch = m.phone.includes(q);
        const codeMatch = (m.member_code || '').toLowerCase().includes(q);
        const cardMatch = (m.physical_card_number || '').includes(q);
        return nameMatch || phoneMatch || codeMatch || cardMatch;
      }
      return true;
    });
  }, [members, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const expired = members.filter(m => m.status === 'expired').length;
    const deactivated = members.filter(m => m.status === 'deactivated').length;
    const totalPointsBalance = members.reduce((sum, m) => sum + Number(m.loyalty_points || 0), 0);
    return { total, active, expired, deactivated, totalPointsBalance };
  }, [members]);

  const exportCsv = () => {
    if (filteredMembers.length === 0) { addToast('error', 'No members to export'); return; }
    const headers = ['Member Code', 'Name', 'Phone', 'Email', 'Membership Type', 'Points Balance', 'Visits', 'Status', 'Expiry Date', 'Card Number'];
    const rows = filteredMembers.map(m => [
      `"${m.member_code || ''}"`, `"${m.name || ''}"`, `"${m.phone || ''}"`, `"${m.email || ''}"`,
      `"${m.membership_type?.name || ''}"`, m.loyalty_points || 0, m.total_visits || 0,
      `"${m.status || ''}"`, `"${m.expiry_date || ''}"`, `"${m.physical_card_number || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metrocardz_members_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', `Exported ${filteredMembers.length} members to CSV`);
  };

  // Avatar initial color — deterministic per name
  function avatarColor(name: string) {
    const colors = [
      'from-accent to-accent-hover', 'from-secondary to-emerald-500',
      'from-tertiary to-amber-600', 'from-purple-500 to-purple-700',
      'from-pink-500 to-rose-600', 'from-blue-500 to-blue-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  const STATUS_TABS = [
    { key: 'all',         label: 'All',         count: counts.total },
    { key: 'active',      label: 'Active',       count: counts.active },
    { key: 'expired',     label: 'Expired',      count: counts.expired },
    { key: 'deactivated', label: 'Inactive',     count: counts.deactivated },
  ] as const;

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-6xl mx-auto space-y-5 animate-fade-in">

      {/* ── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Customer Directory</h1>
          <p className="page-subtitle">View, search, and manage all registered loyalty members.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { invalidateContaining('members'); fetchMembers(); }}
            disabled={loading}
            className="btn-outline flex items-center gap-2"
            title="Refresh member list"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportCsv}
            disabled={loading || members.length === 0}
            className="btn-outline flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/members/new')}
            className="btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Member
          </button>
        </div>
      </div>

      {/* ── Summary Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Members',
            value: counts.total,
            icon: 'groups',
            gradient: 'from-accent/10 to-accent/5',
            iconColor: 'text-accent',
            filter: 'all' as const,
          },
          {
            label: 'Active',
            value: counts.active,
            icon: 'check_circle',
            gradient: 'from-secondary/10 to-secondary/5',
            iconColor: 'text-secondary',
            filter: 'active' as const,
          },
          {
            label: 'Expired',
            value: counts.expired,
            icon: 'schedule',
            gradient: 'from-tertiary/10 to-tertiary/5',
            iconColor: 'text-tertiary',
            filter: 'expired' as const,
          },
          {
            label: 'Points in Circulation',
            value: counts.totalPointsBalance.toLocaleString(),
            icon: 'stars',
            gradient: 'from-purple-500/10 to-purple-500/5',
            iconColor: 'text-purple-600',
            filter: 'all' as const,
          },
        ].map(card => (
          <button
            key={card.label}
            onClick={() => setStatusFilter(card.filter)}
            className="card p-4 flex items-center gap-3 text-left hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center ${card.iconColor} shrink-0`}>
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide truncate">{card.label}</p>
              <p className="text-[20px] font-extrabold text-on-surface font-display leading-tight tabular-nums">{card.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Filter + Search Bar ─── */}
      <div className="card p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Status Tabs */}
        <div className="flex bg-surface-container rounded-xl p-1 gap-0.5">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all capitalize flex items-center gap-1.5
                ${statusFilter === tab.key
                  ? 'bg-white text-accent shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${statusFilter === tab.key ? 'bg-accent/10 text-accent' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 md:min-w-[240px] md:max-w-[320px] md:ml-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Name, phone, or member code…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-9 !h-10 text-[14px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 rounded"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Members Table / List ─── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded-lg w-[35%]" />
                  <div className="h-3 skeleton rounded-lg w-[25%]" />
                </div>
                <div className="hidden md:block w-24 h-5 skeleton rounded-full" />
                <div className="hidden md:block w-16 h-5 skeleton rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <EmptyState
            icon={searchQuery ? 'search_off' : 'person_off'}
            title={searchQuery ? 'No results found' : 'No Members Yet'}
            description={
              searchQuery
                ? `No customer matches "${searchQuery}". Try a different search term.`
                : 'Add your first loyalty member to get started.'
            }
            actionLabel={!searchQuery ? 'Add First Member' : undefined}
            onAction={!searchQuery ? () => navigate('/members/new') : undefined}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low">
                    <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Customer</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Member Code</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Tier</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Points</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Visits</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredMembers.map(m => (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/members/${m.id}`)}
                      className="hover:bg-surface-container-low/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(m.name)} flex items-center justify-center text-white font-bold text-[13px] shrink-0`}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-[14px] group-hover:text-accent transition-colors">
                              {m.name}
                            </p>
                            <p className="text-[12px] text-on-surface-variant">{m.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px] font-bold text-on-surface-variant">
                        #{m.member_code || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {m.membership_type ? (
                          <MembershipBadge name={m.membership_type.name} />
                        ) : (
                          <span className="text-[12px] text-on-surface-variant/60">Standard</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-accent font-mono text-[14px]">
                        {Number(m.loyalty_points || 0).toLocaleString()}
                        <span className="text-[11px] text-on-surface-variant font-normal ml-0.5">pts</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[14px] text-on-surface">
                        {m.total_visits || 0}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/members/${m.id}`); }}
                          className="btn-outline !py-1.5 !px-3 !text-[12px]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-outline-variant/20">
              {filteredMembers.map(m => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/members/${m.id}`)}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-surface-container-low/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColor(m.name)} flex items-center justify-center text-white font-bold text-[15px] shrink-0`}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface text-[14px] truncate group-hover:text-accent transition-colors">{m.name}</p>
                      <p className="text-[12px] text-on-surface-variant">{m.phone} · #{m.member_code}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <StatusBadge status={m.status} />
                        <span className="text-[12px] font-extrabold text-accent font-mono">
                          {Number(m.loyalty_points || 0).toLocaleString()} pts
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/50 text-[20px] shrink-0 group-hover:text-accent transition-colors">chevron_right</span>
                </div>
              ))}
            </div>

            {/* Row count footer */}
            <div className="px-5 py-3 border-t border-outline-variant/20 bg-surface-container-low/30 flex items-center justify-between">
              <p className="text-[12px] text-on-surface-variant">
                Showing <span className="font-bold text-on-surface">{filteredMembers.length}</span> of <span className="font-bold text-on-surface">{members.length}</span> members
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[12px] text-accent font-semibold hover:underline">
                  Clear filter
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
