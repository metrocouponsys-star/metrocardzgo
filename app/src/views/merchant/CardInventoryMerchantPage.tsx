import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { ConfirmModal } from '../../components/ui/Modal';
import type { CardInventoryItem, Member } from '../../types';
import * as api from '../../api/client';
import { format } from 'date-fns';

const STATUS_CFG = {
  merchant_allocated: { cls: 'bg-primary-container/30 text-primary', label: 'Available', icon: 'check_circle' },
  member_linked:      { cls: 'bg-secondary-container text-secondary', label: 'Linked',    icon: 'person' },
};

export default function CardInventoryMerchantPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const merchantId = user?.merchant_id || '';

  const [cards, setCards] = useState<CardInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'merchant_allocated' | 'member_linked'>('all');

  // Link card modal
  const [linkTarget, setLinkTarget] = useState<CardInventoryItem | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [linking, setLinking] = useState(false);

  // Unlink confirm
  const [unlinkTarget, setUnlinkTarget] = useState<CardInventoryItem | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const data = await api.getMerchantCards(merchantId);
      setCards(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCards(); }, []);

  const stats = {
    total: cards.length,
    available: cards.filter(c => c.status === 'merchant_allocated').length,
    linked: cards.filter(c => c.status === 'member_linked').length,
  };

  const filtered = cards.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.replace(/\s/g, '').toLowerCase();
      return (
        c.card_number.replace(/\s/g, '').includes(q) ||
        (c.linked_member_name || '').toLowerCase().includes(q) ||
        (c.linked_member_phone || '').replace(/\s/g, '').includes(q)
      );
    }
    return true;
  });

  const handleMemberSearch = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    setMemberSearching(true);
    try {
      const results = await api.searchMembers(merchantId, q);
      // Only show members without an existing card
      setMemberResults(results.filter(m => !m.physical_card_number));
    } finally { setMemberSearching(false); }
  };

  const handleLink = async (member: Member) => {
    if (!linkTarget) return;
    setLinking(true);
    try {
      await api.linkCardToMember(merchantId, linkTarget.id, member.id);
      addToast('success', `Card ${linkTarget.card_number} linked to ${member.name}`);
      setLinkTarget(null);
      setMemberSearch('');
      setMemberResults([]);
      fetchCards();
    } catch (e: any) { addToast('error', e.message || 'Failed to link card'); }
    finally { setLinking(false); }
  };

  const handleUnlink = async () => {
    if (!unlinkTarget) return;
    setUnlinking(true);
    try {
      await api.unlinkCard(merchantId, unlinkTarget.id);
      addToast('success', `Card unlinked — returned to your available pool`);
      setUnlinkTarget(null);
      fetchCards();
    } catch (e: any) { addToast('error', e.message || 'Failed to unlink card'); }
    finally { setUnlinking(false); }
  };

  const isOwner = user?.role === 'owner';

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <h2 className="page-title flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
          My Card Inventory
        </h2>
        <p className="page-subtitle">Physical membership cards allocated to your store. Link each card to a member so they can use it for redemption.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-md">
        {[
          { label: 'Total Allocated', value: stats.total, icon: 'credit_card', cls: 'bg-primary-container/20 text-primary' },
          { label: 'Available to Assign', value: stats.available, icon: 'check_circle', cls: 'bg-surface-container text-on-surface-variant' },
          { label: 'Linked to Members', value: stats.linked, icon: 'person_check', cls: 'bg-secondary-container text-secondary' },
        ].map(s => (
          <div key={s.label} className="card p-md flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.cls}`}>
              <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
            </div>
            <div>
              <p className="text-headline-md font-bold">{loading ? '—' : s.value}</p>
              <p className="text-label-sm text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info banner if no cards */}
      {!loading && cards.length === 0 && (
        <div className="card p-lg flex flex-col items-center text-center py-16">
          <div className="w-20 h-20 bg-surface-container rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-on-surface-variant text-[40px]">credit_card_off</span>
          </div>
          <h3 className="text-headline-md font-bold mb-2">No cards allocated yet</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm">Contact your Metro Cardz admin to allocate a batch of physical cards to your store. Once allocated, they'll appear here for you to link to members.</p>
        </div>
      )}

      {cards.length > 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex bg-surface-container rounded-xl p-1 gap-1">
              {[
                { key: 'all', label: 'All Cards' },
                { key: 'merchant_allocated', label: 'Available' },
                { key: 'member_linked', label: 'Linked' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key as typeof filterStatus)}
                  className={`px-3 py-1.5 rounded-lg text-label-md transition-all
                    ${filterStatus === f.key ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex-1 relative min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
              <input
                className="input-field pl-10 w-full"
                placeholder="Search by card number or member..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-md animate-pulse">
                  <div className="h-5 bg-surface-container rounded mb-3 w-2/3" />
                  <div className="h-4 bg-surface-container rounded w-1/2" />
                </div>
              ))
            ) : filtered.map(card => {
              const isLinked = card.status === 'member_linked';
              const cfg = STATUS_CFG[card.status as keyof typeof STATUS_CFG];
              return (
                <div
                  key={card.id}
                  className={`card p-md flex items-center gap-4 group transition-all
                    ${isLinked ? 'border-l-4 border-secondary' : 'border-l-4 border-primary-container/50'}`}
                >
                  {/* Card visual */}
                  <div className={`w-14 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm
                    ${isLinked ? 'bg-secondary' : 'bg-primary'}`}>
                    <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-mono font-bold text-body-md tracking-wider">{card.card_number}</span>
                      {cfg && (
                        <span className={`inline-flex items-center gap-1 text-label-sm px-2 py-0.5 rounded-full ${cfg.cls}`}>
                          <span className="material-symbols-outlined text-[12px]">{cfg.icon}</span>
                          {cfg.label}
                        </span>
                      )}
                    </div>
                    {isLinked ? (
                      <div>
                        <p className="text-label-md font-bold text-on-surface">{card.linked_member_name}</p>
                        <p className="text-label-sm text-on-surface-variant">{card.linked_member_phone}</p>
                        {card.linked_at && (
                          <p className="text-label-sm text-on-surface-variant">Linked {format(new Date(card.linked_at), 'dd MMM yyyy')}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-label-sm text-on-surface-variant">Not yet linked to any member</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {isLinked ? (
                      <>
                        <button
                          onClick={() => navigate(`/members/${card.linked_member_id}`)}
                          className="text-label-sm text-primary hover:bg-primary-container/20 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          View Member
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => setUnlinkTarget(card)}
                            className="text-label-sm text-on-surface-variant hover:bg-error-container hover:text-on-error-container px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Unlink
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => { setLinkTarget(card); setMemberSearch(''); setMemberResults([]); }}
                        className="btn-primary text-label-sm py-1.5 px-3 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Link Card Modal */}
      {linkTarget && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !linking && setLinkTarget(null)} />
          <div className="relative bg-surface rounded-2xl shadow-2xl p-lg w-full max-w-lg mx-4 animate-scale-in space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="text-headline-md font-bold">Assign Card to Member</h3>
              <button onClick={() => !linking && setLinkTarget(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Card preview */}
            <div className="bg-primary rounded-xl p-4 flex items-center gap-3 text-white">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
              <div>
                <p className="text-label-sm opacity-70">Assigning card</p>
                <p className="font-mono font-bold text-headline-md tracking-widest">{linkTarget.card_number}</p>
              </div>
            </div>

            <div>
              <label className="form-label">Search for Member</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
                <input
                  autoFocus
                  className="input-field pl-10"
                  placeholder="Name or mobile number..."
                  value={memberSearch}
                  onChange={e => handleMemberSearch(e.target.value)}
                />
                {memberSearching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
                )}
              </div>
              <p className="text-label-sm text-on-surface-variant mt-1">Only members without an existing card are shown.</p>
            </div>

            {memberResults.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {memberResults.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleLink(m)}
                    disabled={linking}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-all text-left border border-outline-variant/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface">{m.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{m.phone} · #{m.member_code}</p>
                    </div>
                    {linking ? (
                      <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {memberSearch.length >= 2 && !memberSearching && memberResults.length === 0 && (
              <div className="text-center py-6 text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px] block mb-1">person_off</span>
                <p className="text-body-md">No members found — or all members already have a card</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unlink Confirm */}
      <ConfirmModal
        isOpen={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={handleUnlink}
        title="Unlink Card"
        danger
        isLoading={unlinking}
        confirmLabel="Unlink Card"
        description={
          <div className="space-y-3">
            <div className="bg-surface-container rounded-xl p-4">
              <p className="font-mono font-bold text-center tracking-widest">{unlinkTarget?.card_number}</p>
              <p className="text-center text-on-surface-variant text-label-sm mt-1">Currently linked to: <strong>{unlinkTarget?.linked_member_name}</strong></p>
            </div>
            <p className="text-body-md text-on-surface-variant">
              The card will be returned to your available pool. The member can still redeem using their mobile number.
            </p>
          </div>
        }
      />
    </div>
  );
}
