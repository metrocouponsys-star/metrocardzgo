'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F5F5F5', card: '#FFFFFF', border: '#E8E8E8',
  text: '#1A1A1A', textMuted: '#6B6B6B', textLight: '#9B9B9B',
  orange: '#F97316', orangeLight: '#FFF7F0', orangeDark: '#EA6500',
  inputBg: '#F9F9F9', shadow: '0 1px 4px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.08)',
  green: '#16A34A', greenBg: '#F0FDF4', greenBorder: '#BBF7D0',
  red: '#DC2626', redBg: '#FEF2F2', redBorder: '#FECACA',
  blueBg: '#EFF6FF', blue: '#2563EB',
};

type CardStatus = 'unassigned' | 'merchant_allocated' | 'member_linked' | 'deactivated';

interface CardRow {
  id: string;
  cardNumber: string;
  status: CardStatus;
  allocatedAt: string | null;
  linkedAt: string | null;
  merchant: { businessName: string } | null;
  member: { name: string; phone: string } | null;
}

interface MemberResult {
  id: string;
  name: string;
  memberCode: string;
  phone: string;
  merchant: { businessName: string } | null;
}

const STATUS_COLORS: Record<CardStatus, { bg: string; color: string; label: string }> = {
  unassigned:         { bg: C.blueBg,   color: C.blue,    label: 'Unassigned' },
  merchant_allocated: { bg: '#FFF7ED',  color: C.orange,  label: 'Allocated' },
  member_linked:      { bg: C.greenBg,  color: C.green,   label: 'Linked' },
  deactivated:        { bg: '#F4F4F5',  color: '#71717A', label: 'Deactivated' },
};

// ─── Admin shell header ───────────────────────────────────────────────────────
function AdminHeader({ active }: { active: string }) {
  const router = useRouter();
  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  return (
    <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', height: '56px', position: 'sticky', top: 0, zIndex: 40, boxShadow: C.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '32px' }}>
        <div style={{ width: '30px', height: '30px', background: C.orange, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '14px', fontFamily: '"Syne", sans-serif' }}>M</span>
        </div>
        <span style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px', fontWeight: 800, color: C.text }}>Metro Cardz</span>
        <span style={{ fontSize: '11px', color: C.textLight, background: C.orangeLight, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '2px 8px', marginLeft: '4px', fontWeight: 600 }}>ADMIN</span>
      </div>
      <nav style={{ display: 'flex', gap: '2px', flex: 1 }}>
        {[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Deals',     href: '/admin/deals' },
          { label: 'Brands',    href: '/admin/brands' },
          { label: 'Cards',     href: '/admin/cards' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            style={{ padding: '6px 14px', borderRadius: '8px', background: active === item.href ? C.orangeLight : 'transparent', color: active === item.href ? C.orange : C.textMuted, fontSize: '13px', fontWeight: active === item.href ? 700 : 500, textDecoration: 'none', border: `1px solid ${active === item.href ? C.orange : 'transparent'}` }}>
            {item.label}
          </Link>
        ))}
      </nav>
      <button onClick={logout}
        style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 14px', fontSize: '12px', color: C.textMuted, cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}>
        Sign out
      </button>
    </header>
  );
}

// ─── Link Card Modal ──────────────────────────────────────────────────────────
function LinkModal({ card, onClose, onLinked }: { card: CardRow; onClose: () => void; onLinked: () => void }) {
  const [search, setSearch]     = useState('');
  const [results, setResults]   = useState<MemberResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [linking, setLinking]   = useState(false);
  const [error, setError]       = useState('');

  const searchMembers = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('mc_admin_token') ?? '';
      const res = await fetch(`/api/v1/admin/members?search=${encodeURIComponent(q)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.members ?? []);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchMembers(search), 300);
    return () => clearTimeout(t);
  }, [search, searchMembers]);

  const linkCard = async (member: MemberResult) => {
    if (!confirm(`Link card ${card.cardNumber} to ${member.name}?`)) return;
    setLinking(true); setError('');
    try {
      const token = localStorage.getItem('mc_admin_token') ?? '';
      const res = await fetch('/api/v1/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'link_member', card_id: card.id, member_id: member.id, card_number: card.cardNumber }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || 'Failed to link'); return; }
      onLinked();
    } catch { setError('Network error'); }
    finally { setLinking(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: C.shadowMd, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Assign Card to Member</h2>
            <p style={{ fontSize: '13px', color: C.textMuted, margin: '4px 0 0' }}>Card: <strong>{card.cardNumber}</strong></p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: C.textLight }}>x</button>
        </div>

        <input type="search" placeholder="Search by name, phone or member code..."
          value={search} onChange={e => setSearch(e.target.value)} autoFocus
          style={{ width: '100%', height: '44px', padding: '0 14px', background: C.inputBg, border: `1.5px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', outline: 'none', fontFamily: '"Inter", sans-serif', boxSizing: 'border-box', marginBottom: '12px' }} />

        {error && <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: C.red, marginBottom: '12px' }}>{error}</div>}

        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {loading && <div style={{ textAlign: 'center', padding: '20px', color: C.textLight, fontSize: '13px' }}>Searching...</div>}
          {!loading && results.length === 0 && search.length >= 2 && (
            <div style={{ textAlign: 'center', padding: '20px', color: C.textLight, fontSize: '13px' }}>No members found</div>
          )}
          {results.map(m => (
            <div key={m.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${C.border}`, marginBottom: '8px', background: C.card }}
              onClick={() => linkCard(m)}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{m.name}</div>
                <div style={{ fontSize: '12px', color: C.textMuted }}>{m.memberCode} &bull; {m.phone}</div>
                {m.merchant && <div style={{ fontSize: '11px', color: C.textLight }}>{m.merchant.businessName}</div>}
              </div>
              <button disabled={linking}
                style={{ padding: '7px 16px', background: C.orange, border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: '"Inter", sans-serif', whiteSpace: 'nowrap' }}>
                {linking ? '...' : 'Assign'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Add Cards Modal ──────────────────────────────────────────────────────────
function AddCardsModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [raw, setRaw]       = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError]   = useState('');

  const handleAdd = async () => {
    const nums = raw.split('\n').map(s => s.trim()).filter(Boolean);
    if (nums.length === 0) { setError('Enter at least one card number'); return; }
    setAdding(true); setError('');
    try {
      const token = localStorage.getItem('mc_admin_token') ?? '';
      const res = await fetch('/api/v1/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'add_batch', card_numbers: nums }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || 'Failed'); return; }
      onAdded();
    } catch { setError('Network error'); }
    finally { setAdding(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: C.shadowMd, border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', fontWeight: 800, color: C.text, margin: 0 }}>Add Card Numbers</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: C.textLight }}>x</button>
        </div>
        <p style={{ fontSize: '13px', color: C.textMuted, marginBottom: '14px' }}>Enter one card number per line (e.g. 4821 6739 0001 0006)</p>
        <textarea value={raw} onChange={e => setRaw(e.target.value)} rows={8} placeholder={'4821 6739 0001 0006\n4821 6739 0001 0007\n...'}
          style={{ width: '100%', padding: '12px 14px', background: C.inputBg, border: `1.5px solid ${C.border}`, borderRadius: '10px', color: C.text, fontSize: '14px', outline: 'none', fontFamily: '"Inter", sans-serif', resize: 'vertical', boxSizing: 'border-box', marginBottom: '14px' }} />
        {error && <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: C.red, marginBottom: '12px' }}>{error}</div>}
        <button onClick={handleAdd} disabled={adding}
          style={{ width: '100%', padding: '13px', background: adding ? '#E5E5E5' : C.orange, border: 'none', borderRadius: '10px', color: adding ? C.textLight : '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}>
          {adding ? 'Adding...' : `Add ${raw.split('\n').filter(s => s.trim()).length} Card(s)`}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCardsPage() {
  const router = useRouter();
  const [cards, setCards]         = useState<CardRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<CardStatus | 'all'>('all');
  const [search, setSearch]       = useState('');
  const [linkTarget, setLinkTarget] = useState<CardRow | null>(null);
  const [showAdd, setShowAdd]     = useState(false);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('mc_admin_token') ?? '';
      const res = await fetch('/api/v1/cards?limit=500', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (res.ok) setCards(await res.json());
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const filtered = cards.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.cardNumber.replace(/\s/g, '').includes(q.replace(/\s/g, '')) || c.member?.name.toLowerCase().includes(q) || c.merchant?.businessName.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    all:                cards.length,
    unassigned:         cards.filter(c => c.status === 'unassigned').length,
    merchant_allocated: cards.filter(c => c.status === 'merchant_allocated').length,
    member_linked:      cards.filter(c => c.status === 'member_linked').length,
    deactivated:        cards.filter(c => c.status === 'deactivated').length,
  };

  const inp: React.CSSProperties = { height: '40px', padding: '0 14px', background: C.inputBg, border: `1.5px solid ${C.border}`, borderRadius: '8px', color: C.text, fontSize: '14px', outline: 'none', fontFamily: '"Inter", sans-serif', boxSizing: 'border-box' };

  return (
    <div style={{ background: C.bg, minHeight: '100dvh', fontFamily: '"Inter", sans-serif' }}>
      <AdminHeader active="/admin/cards" />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Page title + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '22px', fontWeight: 800, color: C.text, margin: 0 }}>Card Inventory</h1>
            <p style={{ fontSize: '13px', color: C.textMuted, margin: '4px 0 0' }}>{cards.length} total cards</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ padding: '10px 20px', background: C.orange, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}>
            + Add Cards
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {(['all', 'unassigned', 'merchant_allocated', 'member_linked', 'deactivated'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '7px 16px', borderRadius: '8px', border: `1px solid ${filter === s ? C.orange : C.border}`, background: filter === s ? C.orangeLight : C.card, color: filter === s ? C.orange : C.textMuted, fontSize: '12px', fontWeight: filter === s ? 700 : 500, cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}>
              {s === 'all' ? 'All' : STATUS_COLORS[s].label} ({counts[s]})
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input style={{ ...inp, flex: 1 }} type="search" placeholder="Search by card number, member name, or merchant..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', boxShadow: C.shadow }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1.5fr 1.2fr 100px', gap: '0', padding: '12px 20px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            {['Card Number', 'Status', 'Member', 'Merchant', 'Linked / Allocated', 'Action'].map(h => (
              <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: C.textLight, letterSpacing: '0.06em' }}>{h.toUpperCase()}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: C.textLight, fontSize: '14px' }}>Loading cards...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: C.textLight, fontSize: '14px' }}>No cards found</div>
          ) : (
            filtered.map((card, i) => {
              const s = STATUS_COLORS[card.status];
              return (
                <div key={card.id}
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.5fr 1.5fr 1.2fr 100px', gap: '0', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: C.text, fontFamily: '"Courier New", monospace' }}>{card.cardNumber}</div>
                  <div>
                    <span style={{ display: 'inline-block', background: s.bg, color: s.color, fontSize: '11px', fontWeight: 700, borderRadius: '6px', padding: '3px 9px' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: card.member ? C.text : C.textLight }}>{card.member?.name ?? '—'}</div>
                  <div style={{ fontSize: '13px', color: card.merchant ? C.text : C.textLight }}>{card.merchant?.businessName ?? '—'}</div>
                  <div style={{ fontSize: '12px', color: C.textLight }}>
                    {card.linkedAt ? new Date(card.linkedAt).toLocaleDateString('en-IN') : card.allocatedAt ? new Date(card.allocatedAt).toLocaleDateString('en-IN') : '—'}
                  </div>
                  <div>
                    {card.status === 'unassigned' && (
                      <button onClick={() => setLinkTarget(card)}
                        style={{ padding: '6px 14px', background: C.orange, border: 'none', borderRadius: '7px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: '"Inter", sans-serif' }}>
                        Assign
                      </button>
                    )}
                    {card.status === 'member_linked' && (
                      <span style={{ fontSize: '12px', color: C.green, fontWeight: 600 }}>Active</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {linkTarget && <LinkModal card={linkTarget} onClose={() => setLinkTarget(null)} onLinked={() => { setLinkTarget(null); loadCards(); }} />}
      {showAdd    && <AddCardsModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); loadCards(); }} />}
    </div>
  );
}
