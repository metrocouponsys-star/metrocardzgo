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
    <div className="px-4 md:px-10 py-8 max-w-6xl mx-auto space-y-5 animate-fade-in">
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
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
          <button
            onClick={() => navigate('/members/new')}
            className="btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[17px]">person_add</span>
            Add Member
          </button>
        </div>
      </div>

      {/* Summary Mini-Cards — PREMIUM: large numbers, soft shadows */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FBF7EA] flex items-center justify-center text-[#B8941F] shrink-0">
            <span className="material-symbols-outlined text-[20px]">groups</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Total Members</p>
            <p className="text-2xl font-extrabold text-[#111111]">{counts.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Active</p>
            <p className="text-2xl font-extrabold text-[#111111]">{counts.active}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Expired</p>
            <p className="text-2xl font-extrabold text-[#111111]">{counts.expired}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FBF7EA] flex items-center justify-center text-[#B8941F] shrink-0">
            <span className="material-symbols-outlined text-[20px]">stars</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Total Points</p>
            <p className="text-2xl font-extrabold text-[#B8941F]">{counts.totalPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Filter pills — PREMIUM: white bg + gold active */}
        <div className="flex bg-[#F3F4F6] rounded-xl p-1 w-full md:w-auto gap-0.5">
          {(['all', 'active', 'expired', 'deactivated'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 md:flex-initial px-4 py-2 text-xs rounded-xl font-semibold transition-all capitalize
                ${statusFilter === tab
                  ? 'bg-white text-[#B8941F] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#111111]'}`}
            >
              {tab} {tab === 'all' ? `(${counts.total})` : tab === 'active' ? `(${counts.active})` : ''}
            </button>
          ))}
        </div>

        {/* Search Input — gold focus ring */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, phone, code..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-8 !h-10 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111111]"
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
              <div key={i} className="h-12 bg-[#F3F4F6] animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto text-[#6B7280]">
              <span className="material-symbols-outlined text-[32px]">person_off</span>
            </div>
            <h3 className="text-xl font-bold text-[#111111]">No Members Found</h3>
            <p className="text-sm text-[#6B7280] max-w-sm mx-auto">
              {searchQuery ? `No customer matches "${searchQuery}".` : 'No registered customers found in this category.'}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-outline text-xs">
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
                  <tr className="border-b border-[#E5E7EB]/40 bg-[#F9FAFB] text-sm text-[#6B7280] font-bold">
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
                      className="hover:bg-[#F9FAFB]/60 transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#F5EDD0] flex items-center justify-center text-[#7A5C12] font-bold text-sm shrink-0">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#111111] text-sm group-hover:text-[#B8941F] transition-colors">
                              {m.name}
                            </p>
                            <p className="text-xs text-[#6B7280]">{m.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs font-bold text-[#6B7280]">
                        #{m.member_code || '---'}
                      </td>
                      <td className="p-4">
                        {m.membership_type ? (
                          <MembershipBadge name={m.membership_type.name} />
                        ) : (
                          <span className="text-xs text-[#6B7280]">Standard</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-[#B8941F] font-mono">
                        {Number(m.loyalty_points || 0).toLocaleString()} pts
                      </td>
                      <td className="p-4 text-right text-sm text-[#111111]">
                        {m.total_visits || 0}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/members/${m.id}`); }}
                          className="btn-outline !py-1 !px-3 text-xs"
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
                  className="p-4 flex items-center justify-between gap-3 hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-[#F5EDD0] flex items-center justify-center text-[#7A5C12] font-bold text-base shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#111111] text-sm truncate">{m.name}</p>
                      <p className="text-xs text-[#6B7280]">{m.phone} · #{m.member_code}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={m.status} />
                        <span className="text-xs font-bold text-[#B8941F]">{Number(m.loyalty_points || 0).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#6B7280] text-[20px]">chevron_right</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


