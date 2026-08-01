import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { Member } from '../../types';
import * as api from '../../api';
import { cached, invalidateContaining } from '../../api/cache';
import { StatusBadge, MembershipBadge } from '../../components/ui/StatusBadge';

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
        // onUpdate: silently replace list when background refresh completes
        (fresh) => setMembers(fresh),
      );
      setMembers(data);
    } catch {
      addToast('error', 'Failed to load customer list');
    } finally {
      setLoading(false);
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      // Status filter
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      // Search query filter
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

  // Summary counts
  const counts = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const expired = members.filter(m => m.status === 'expired').length;
    const deactivated = members.filter(m => m.status === 'deactivated').length;
    const totalPoints = members.reduce((sum, m) => sum + Number(m.loyalty_points || 0), 0);
    return { total, active, expired, deactivated, totalPoints };
  }, [members]);

  // CSV Export
  const exportCsv = () => {
    if (filteredMembers.length === 0) {
      addToast('error', 'No members to export');
      return;
    }
    const headers = ['Member Code', 'Name', 'Phone', 'Email', 'Membership Type', 'Points Balance', 'Visits', 'Status', 'Expiry Date', 'Card Number'];
    const rows = filteredMembers.map(m => [
      `"${m.member_code || ''}"`,
      `"${m.name || ''}"`,
      `"${m.phone || ''}"`,
      `"${m.email || ''}"`,
      `"${m.membership_type?.name || ''}"`,
      m.loyalty_points || 0,
      m.total_visits || 0,
      `"${m.status || ''}"`,
      `"${m.expiry_date || ''}"`,
      `"${m.physical_card_number || ''}"`,
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

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-6xl mx-auto space-y-md animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">Customer Directory</h2>
          <p className="page-subtitle">View, search, and manage all registered loyalty members.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            disabled={loading || members.length === 0}
            className="btn-outline flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[22px]">groups</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Total Members</p>
            <p className="text-headline-md font-bold text-on-surface">{counts.total}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Active</p>
            <p className="text-headline-md font-bold text-on-surface">{counts.active}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <span className="material-symbols-outlined text-[22px]">schedule</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Expired</p>
            <p className="text-headline-md font-bold text-on-surface">{counts.expired}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-[22px]">stars</span>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Total Points</p>
            <p className="text-headline-md font-bold text-on-surface">{counts.totalPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Tabs */}
        <div className="flex bg-surface-container rounded-xl p-1 w-full md:w-auto">
          {(['all', 'active', 'expired', 'deactivated'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 md:flex-initial px-4 py-2 text-label-md rounded-lg font-medium transition-all capitalize
                ${statusFilter === tab
                  ? 'bg-surface text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              {tab} {tab === 'all' ? `(${counts.total})` : tab === 'active' ? `(${counts.active})` : ''}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, phone, code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-8 !h-10 text-body-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-container animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px]">person_off</span>
            </div>
            <h3 className="text-headline-md font-bold text-on-surface">No Members Found</h3>
            <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
              {searchQuery ? `No customer matches "${searchQuery}".` : 'No registered customers found in this category.'}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-outline text-label-sm">
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/40 bg-surface-container-low text-label-md text-on-surface-variant font-bold">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Member Code</th>
                    <th className="p-4">Tier</th>
                    <th className="p-4 text-right">Points</th>
                    <th className="p-4 text-right">Visits</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filteredMembers.map(m => (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/members/${m.id}`)}
                      className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-body-md shrink-0">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-body-md group-hover:text-primary transition-colors">
                              {m.name}
                            </p>
                            <p className="text-label-sm text-on-surface-variant">{m.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-body-sm font-bold text-on-surface-variant">
                        #{m.member_code || '---'}
                      </td>
                      <td className="p-4">
                        {m.membership_type ? (
                          <MembershipBadge name={m.membership_type.name} />
                        ) : (
                          <span className="text-label-sm text-on-surface-variant">Standard</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-primary font-mono">
                        {Number(m.loyalty_points || 0).toLocaleString()} pts
                      </td>
                      <td className="p-4 text-right text-body-md text-on-surface">
                        {m.total_visits || 0}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/members/${m.id}`); }}
                          className="btn-outline !py-1 !px-3 text-label-sm"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-outline-variant/30">
              {filteredMembers.map(m => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/members/${m.id}`)}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-body-lg shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface text-body-md truncate">{m.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{m.phone} · #{m.member_code}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={m.status} />
                        <span className="text-label-sm font-bold text-primary">{Number(m.loyalty_points || 0).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
