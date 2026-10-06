import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { Member } from '../../types';
import * as api from '../../api';
import { cached, invalidateContaining } from '../../api/cache';

// ─── Tokens ──────────────────────────────────────────────────────────────────
const T = {
  bg: '#F6F3EE', white: '#FFFFFF', border: '#EAE3DD',
  panel: '#FFFDFB', soft: '#F9F7F5',
  text: '#111827', textMuted: '#6B7280', textLight: '#9CA3AF',
  orange: '#FF6B35', orangeLight: '#FFF4EF', orangeDark: '#EA580C',
  teal: '#00B894', tealLight: '#EAFBF6',
  violet: '#7C3AED', violetLight: '#F5F3FF',
  shadow: '0 10px 22px rgba(17,24,39,0.05)',
  shadowMd: '0 16px 30px rgba(17,24,39,0.06)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#FF6B35', '#FFF4EF'], ['#00D4AA', '#E0FFF6'], ['#2563EB', '#EFF6FF'],
  ['#7C3AED', '#F5F3FF'], ['#E11D48', '#FFF1F2'], ['#D97706', '#FEF3C7'],
];
function avatarColors(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active:      ['#16A34A', '#F0FDF4'],
    expired:     ['#D97706', '#FEF3C7'],
    deactivated: ['#DC2626', '#FEF2F2'],
  };
  const [color, bg] = map[status] ?? ['#64748B', '#F1F5F9'];
  return (
    <span style={{ fontSize: '11px', fontWeight: 700, color, background: bg, padding: '3px 10px', borderRadius: '9999px', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const [color, bg] = avatarColors(name);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, border: `2px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color, flexShrink: 0, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MembersListPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'deactivated'>('all');

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const cacheKey = `members/${user?.merchant_id}`;
    try {
      const data = await cached(cacheKey, () => api.getMembers(user?.merchant_id || ''), (fresh) => setMembers(fresh));
      setMembers(data);
    } catch { addToast('error', 'Failed to load customer list'); }
    finally { setLoading(false); }
  };

  const filteredMembers = useMemo(() => members.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.phone.includes(q) || (m.member_code || '').toLowerCase().includes(q) || (m.physical_card_number || '').includes(q);
    }
    return true;
  }), [members, statusFilter, searchQuery]);

  const counts = useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    expired: members.filter(m => m.status === 'expired').length,
    deactivated: members.filter(m => m.status === 'deactivated').length,
    totalPoints: members.reduce((s, m) => s + Number(m.loyalty_points || 0), 0),
  }), [members]);

  const exportCsv = () => {
    if (!filteredMembers.length) { addToast('error', 'No members to export'); return; }
    const headers = ['Member Code', 'Name', 'Phone', 'Email', 'Membership', 'Points', 'Visits', 'Status', 'Expiry', 'Card#'];
    const rows = filteredMembers.map(m => [
      `"${m.member_code || ''}"`, `"${m.name || ''}"`, `"${m.phone || ''}"`, `"${m.email || ''}"`,
      `"${m.membership_type?.name || ''}"`, m.loyalty_points || 0, m.total_visits || 0,
      `"${m.status || ''}"`, `"${m.expiry_date || ''}"`, `"${m.physical_card_number || ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    addToast('success', `Exported ${filteredMembers.length} members`);
  };

  const STATUS_TABS = [
    { key: 'all',         label: 'All',      count: counts.total },
    { key: 'active',      label: 'Active',   count: counts.active },
    { key: 'expired',     label: 'Expired',  count: counts.expired },
    { key: 'deactivated', label: 'Inactive', count: counts.deactivated },
  ] as const;

  const Btn = ({ label, icon, onClick, variant = 'ghost', disabled = false }: any) => (
    <button disabled={disabled} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px',
      borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
      border: variant === 'primary' ? 'none' : `1px solid ${T.border}`,
      background: variant === 'primary' ? `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})` : T.white,
      color: variant === 'primary' ? '#fff' : T.textMuted,
      boxShadow: variant === 'primary' ? `0 3px 12px rgba(255,107,53,0.3)` : T.shadow,
      opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
      <span className="btn-label">{label}</span>
    </button>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: T.orangeLight, color: T.orangeDark, border: `1px solid ${T.border}`, borderRadius: '9999px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 10px', marginBottom: '10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>groups</span>
              Membership hub
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: T.text, margin: '0 0 4px', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif', letterSpacing: '-0.05em' }}>Customer Directory</h1>
            <p style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}>Monitor, search and manage every loyalty member in one place.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Btn label="Refresh" icon="refresh" onClick={() => { invalidateContaining('members'); fetchMembers(); }} disabled={loading} />
            <Btn label="Export CSV" icon="download" onClick={exportCsv} disabled={loading || !members.length} />
            <Btn label="Add Member" icon="person_add" onClick={() => navigate('/portal/members/new')} variant="primary" />
          </div>
        </div>

        {/* ── Summary Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
          {[
            { label: 'Total', value: counts.total, icon: 'groups', color: T.orange, bg: T.orangeLight, filter: 'all' as const },
            { label: 'Active', value: counts.active, icon: 'check_circle', color: '#16A34A', bg: '#F0FDF4', filter: 'active' as const },
            { label: 'Expired', value: counts.expired, icon: 'schedule', color: '#D97706', bg: '#FEF3C7', filter: 'expired' as const },
            { label: 'Points', value: counts.totalPoints.toLocaleString(), icon: 'stars', color: T.violet, bg: T.violetLight, filter: 'all' as const },
          ].map(c => (
            <button key={c.label} onClick={() => setStatusFilter(c.filter)} style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fffaf7 100%)', borderRadius: '18px', padding: '16px 18px', border: `1px solid ${statusFilter === c.filter && c.filter !== 'all' ? c.color + '40' : T.border}`,
              boxShadow: T.shadow, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
              outline: statusFilter === c.filter && c.filter !== 'all' ? `2px solid ${c.color}30` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: c.color, fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>{c.label}</p>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: T.text, margin: 0, lineHeight: 1, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>{c.value}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Filter + Search ── */}
        <div style={{ background: T.white, borderRadius: '18px', border: `1px solid ${T.border}`, boxShadow: T.shadow, padding: '12px 14px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: T.soft, padding: '4px', borderRadius: '12px', border: `1px solid ${T.border}` }}>
            {STATUS_TABS.map(tab => (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)} style={{
                padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: statusFilter === tab.key ? T.white : 'transparent',
                color: statusFilter === tab.key ? T.orangeDark : T.textMuted,
                boxShadow: statusFilter === tab.key ? T.shadow : 'none',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                {tab.label}
                <span style={{ fontSize: '10px', background: statusFilter === tab.key ? T.orangeLight : '#E5E7EB', color: statusFilter === tab.key ? T.orangeDark : T.textLight, padding: '1px 6px', borderRadius: '9999px', fontWeight: 700 }}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '17px', color: T.textLight, pointerEvents: 'none' }}>search</span>
            <input
              type="text"
              placeholder="Name, phone, member code…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', height: '42px', paddingLeft: '38px', paddingRight: searchQuery ? '36px' : '12px', border: `1.5px solid ${T.border}`, borderRadius: '12px', fontSize: '13px', background: T.soft, color: T.text, outline: 'none', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: T.textLight }}>close</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={{ background: T.white, borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 40%, #F1F5F9 80%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ height: 13, width: '35%', borderRadius: '6px', background: 'linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 40%, #F1F5F9 80%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }} />
                    <div style={{ height: 10, width: '20%', borderRadius: '6px', background: 'linear-gradient(90deg, #F1F5F9 0%, #E2E8F0 40%, #F1F5F9 80%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: T.textLight, display: 'block', marginBottom: '12px' }}>{searchQuery ? 'search_off' : 'person_off'}</span>
              <p style={{ fontWeight: 700, fontSize: '15px', color: T.text, margin: '0 0 6px' }}>{searchQuery ? 'No results found' : 'No Members Yet'}</p>
              <p style={{ fontSize: '13px', color: T.textMuted, margin: '0 0 16px' }}>{searchQuery ? `No match for "${searchQuery}"` : 'Add your first loyalty member to get started.'}</p>
              {!searchQuery && (
                <button onClick={() => navigate('/portal/members/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span>
                  Add First Member
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="members-table-desktop">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}`, background: '#FAFBFC' }}>
                      {['Customer', 'Member Code', 'Tier', 'Points', 'Visits', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '11px 16px', fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'Points' || h === 'Visits' ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((m, i) => (
                      <tr key={m.id} onClick={() => navigate(`/portal/members/${m.id}`)} style={{ borderBottom: i < filteredMembers.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar name={m.name} size={36} />
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: '0 0 1px' }}>{m.name}</p>
                              <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>{m.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: T.textMuted }}>#{m.member_code || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {m.membership_type ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, background: T.orangeLight, color: T.orangeDark, padding: '3px 10px', borderRadius: '9999px' }}>{m.membership_type.name}</span>
                          ) : <span style={{ fontSize: '12px', color: T.textLight }}>Standard</span>}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: T.orange, fontFamily: 'monospace' }}>{Number(m.loyalty_points || 0).toLocaleString()}<span style={{ fontSize: '10px', color: T.textLight, fontWeight: 400 }}> pts</span></td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: T.text }}>{m.total_visits || 0}</td>
                        <td style={{ padding: '12px 16px' }}><StatusPill status={m.status} /></td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button onClick={e => { e.stopPropagation(); navigate(`/portal/members/${m.id}`); }} style={{ padding: '6px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: T.textMuted, background: T.white, cursor: 'pointer' }}>View →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="members-table-mobile">
                {filteredMembers.map((m, i) => (
                  <div key={m.id} onClick={() => navigate(`/portal/members/${m.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: i < filteredMembers.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <Avatar name={m.name} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: T.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                      <p style={{ fontSize: '12px', color: T.textMuted, margin: '0 0 6px' }}>{m.phone} · #{m.member_code}</p>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <StatusPill status={m.status} />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: T.orange, fontFamily: 'monospace' }}>{Number(m.loyalty_points || 0).toLocaleString()} pts</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: T.textLight, flexShrink: 0 }}>chevron_right</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>
                  Showing <strong style={{ color: T.text }}>{filteredMembers.length}</strong> of <strong style={{ color: T.text }}>{members.length}</strong> members
                </p>
                {searchQuery && <button onClick={() => setSearchQuery('')} style={{ fontSize: '12px', color: T.orange, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Clear filter</button>}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .members-table-desktop { display: block; }
        .members-table-mobile { display: none; }
        .btn-label { display: inline; }
        @media (max-width: 767px) {
          .members-table-desktop { display: none; }
          .members-table-mobile { display: block; }
          .btn-label { display: none; }
        }
        @media (max-width: 640px) {
          div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
