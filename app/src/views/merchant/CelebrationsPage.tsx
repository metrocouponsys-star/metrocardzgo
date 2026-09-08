import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { CelebrationMember } from '../../types';
import * as api from '../../api';
import { computeCelebrationsFromMembers } from '../../lib/celebrations';

function formatCelebrationDate(isoDateStr?: string) {
  if (!isoDateStr) return '';
  try {
    const parts = isoDateStr.split('-');
    if (parts.length >= 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${monthNames[mIdx] || ''}`;
    }
  } catch {
    // fallback
  }
  return isoDateStr;
}

export default function CelebrationsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [celebrations, setCelebrations] = useState<CelebrationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '1day' | '7days' | '30days'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'birthday' | 'anniversary'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadCelebrations = async () => {
    setLoading(true);
    try {
      // Load up to 60 days ahead
      const list = await api.getCelebrations(60);
      setCelebrations(list || []);
    } catch {
      try {
        const members = await api.getMembers();
        const list = computeCelebrationsFromMembers(members, 60);
        setCelebrations(list);
      } catch {
        setCelebrations([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCelebrations();
  }, []);

  const counts = useMemo(() => {
    const today = celebrations.filter(c => c.days_until === 0).length;
    const tomorrow = celebrations.filter(c => c.days_until === 1).length;
    const week = celebrations.filter(c => c.days_until >= 0 && c.days_until <= 7).length;
    const month = celebrations.filter(c => c.days_until >= 0 && c.days_until <= 30).length;
    const birthdays = celebrations.filter(c => c.event_type === 'birthday').length;
    const anniversaries = celebrations.filter(c => c.event_type === 'anniversary').length;
    return { today, tomorrow, week, month, birthdays, anniversaries, total: celebrations.length };
  }, [celebrations]);

  const filtered = useMemo(() => {
    return celebrations.filter(c => {
      // Time filter
      if (timeFilter === 'today' && c.days_until !== 0) return false;
      if (timeFilter === '1day' && c.days_until !== 1) return false;
      if (timeFilter === '7days' && (c.days_until < 0 || c.days_until > 7)) return false;
      if (timeFilter === '30days' && (c.days_until < 0 || c.days_until > 30)) return false;

      // Event type filter
      if (typeFilter !== 'all' && c.event_type !== typeFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = c.name.toLowerCase().includes(q);
        const phoneMatch = c.phone.includes(q);
        const codeMatch = (c.member_code || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || codeMatch;
      }
      return true;
    });
  }, [celebrations, timeFilter, typeFilter, searchQuery]);

  const sendWhatsAppWish = (c: CelebrationMember) => {
    const cleanPhone = c.phone.replace(/\D/g, '');
    const isBirthday = c.event_type === 'birthday';
    const storeName = user?.merchant_name || 'our store';
    const message = isBirthday
      ? `Dear ${c.name}, wishing you a very Happy Birthday from all of us at ${storeName}! 🎂🎉 Enjoy your special day with exclusive rewards on your membership card (${c.member_code || ''}).`
      : `Dear ${c.name}, Happy Anniversary from all of us at ${storeName}! 💍💐 We wish you continued happiness and invite you to celebrate with your member benefits!`;

    const url = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-6xl mx-auto space-y-md animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title flex items-center gap-2.5">
            <span className="text-[26px]">🎉</span>
            Birthday & Anniversary Celebrations
          </h2>
          <p className="page-subtitle">
            Track and greet upcoming member birthdays and anniversaries to delight customers and boost retention.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/campaigns')}
            className="btn-outline flex items-center gap-2 text-label-md"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            Auto-Reminders
          </button>
          <button
            onClick={loadCelebrations}
            disabled={loading}
            className="btn-outline flex items-center gap-2 text-label-md"
            title="Refresh list"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setTimeFilter('today')}
          className={`card p-4 flex items-center gap-3 cursor-pointer transition-all ${
            timeFilter === 'today' ? 'ring-2 ring-pink-500 bg-pink-50/20' : 'hover:bg-surface-container-low'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-pink-500/10 flex items-center justify-center text-[22px] shrink-0">
            🎂
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant font-medium">Today's Celebrations</p>
            <p className="text-headline-md font-bold text-pink-700">{counts.today}</p>
          </div>
        </div>

        <div
          onClick={() => setTimeFilter('1day')}
          className={`card p-4 flex items-center gap-3 cursor-pointer transition-all ${
            timeFilter === '1day' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-surface-container-low'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-[22px] shrink-0">
            ⏰
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant font-medium">Tomorrow (In 1 Day)</p>
            <p className="text-headline-md font-bold text-on-surface">{counts.tomorrow}</p>
          </div>
        </div>

        <div
          onClick={() => setTimeFilter('7days')}
          className={`card p-4 flex items-center gap-3 cursor-pointer transition-all ${
            timeFilter === '7days' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-surface-container-low'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-[22px] shrink-0">
            📅
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant font-medium">Next 7 Days</p>
            <p className="text-headline-md font-bold text-on-surface">{counts.week}</p>
          </div>
        </div>

        <div
          onClick={() => setTimeFilter('30days')}
          className={`card p-4 flex items-center gap-3 cursor-pointer transition-all ${
            timeFilter === '30days' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-surface-container-low'
          }`}
        >
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-[22px] shrink-0">
            🌟
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant font-medium">This Month (30 Days)</p>
            <p className="text-headline-md font-bold text-on-surface">{counts.month}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Time Filters */}
          <div className="flex bg-surface-container rounded-xl p-1 gap-1">
            {[
              { key: 'all', label: 'All Upcoming' },
              { key: 'today', label: `Today (${counts.today})` },
              { key: '1day', label: 'Tomorrow' },
              { key: '7days', label: '7 Days' },
              { key: '30days', label: '30 Days' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTimeFilter(t.key as any)}
                className={`px-3 py-1.5 text-label-md rounded-lg font-medium transition-all ${
                  timeFilter === t.key
                    ? 'bg-surface text-primary shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex bg-surface-container rounded-xl p-1 gap-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'birthday', label: 'Birthdays 🎂' },
              { key: 'anniversary', label: 'Anniversaries 💍' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key as any)}
                className={`px-2.5 py-1.5 text-label-sm rounded-lg font-medium transition-all ${
                  typeFilter === t.key
                    ? 'bg-primary text-on-primary font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search member, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10 pr-8 !h-10 text-body-sm"
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

      {/* Celebrations Grid / List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-surface-container rounded w-3/4" />
                  <div className="h-3 bg-surface-container rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-[32px]">
            🎉
          </div>
          <h3 className="text-headline-sm font-bold text-on-surface">No celebrations found</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mx-auto">
            {searchQuery
              ? 'No member matches your search.'
              : timeFilter === 'today'
              ? 'No member birthdays or anniversaries today.'
              : 'No upcoming celebrations matching this filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map(c => {
            const isToday = c.days_until === 0;
            const isTomorrow = c.days_until === 1;
            const isBirthday = c.event_type === 'birthday';

            return (
              <div
                key={`${c.member_id}-${c.event_type}`}
                className={`card p-4 transition-all duration-200 flex flex-col justify-between group hover:shadow-md ${
                  isToday
                    ? 'border-2 border-pink-500/50 bg-gradient-to-br from-pink-50/40 via-white to-amber-50/20'
                    : isTomorrow
                    ? 'border border-primary/30 bg-surface'
                    : 'border border-outline-variant/30 bg-surface'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0 ${
                        isBirthday ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {isBirthday ? '🎂' : '💍'}
                      </div>
                      <div>
                        <button
                          onClick={() => navigate(`/members/${c.member_id}`)}
                          className="text-body-md font-bold text-on-surface hover:text-primary transition-colors text-left"
                        >
                          {c.name}
                        </button>
                        <p className="text-label-xs text-on-surface-variant">
                          {c.member_code || 'Member'} · {c.phone}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                      isToday
                        ? 'bg-pink-600 text-white animate-pulse'
                        : isTomorrow
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {isToday
                        ? 'Today!'
                        : isTomorrow
                        ? 'Tomorrow'
                        : `In ${c.days_until} days`}
                    </span>
                  </div>

                  <div className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between text-body-sm mb-3">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">event</span>
                      {isBirthday ? 'Birthday' : 'Anniversary'}: <strong>{formatCelebrationDate(c.event_date)}</strong>
                    </span>
                    <span className="text-label-xs font-semibold text-primary">
                      ★ {c.loyalty_points || 0} pts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                  <button
                    onClick={() => sendWhatsAppWish(c)}
                    className="btn-primary !py-1.5 !px-3 text-label-xs flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    Wish on WhatsApp
                  </button>
                  <button
                    onClick={() => navigate(`/members/${c.member_id}`)}
                    className="btn-outline !py-1.5 !px-2.5 text-label-xs flex items-center justify-center"
                    title="View Profile"
                  >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
