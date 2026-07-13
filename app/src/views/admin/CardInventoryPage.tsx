import React, { useEffect, useState } from 'react';
import { useToastStore } from '../../store/toastStore';
import { ConfirmModal } from '../../components/ui/Modal';
import type { CardInventoryItem, Merchant } from '../../types';
import * as api from '../../api/client';
import { format } from 'date-fns';

type FilterStatus = 'all' | 'unassigned' | 'merchant_allocated' | 'member_linked' | 'deactivated';

const STATUS_CONFIG: Record<string, { cls: string; label: string; icon: string }> = {
  unassigned:         { cls: 'bg-surface-container text-on-surface-variant',       label: 'Unassigned',  icon: 'inventory_2' },
  merchant_allocated: { cls: 'bg-primary-container/40 text-primary',               label: 'Allocated',   icon: 'store' },
  member_linked:      { cls: 'bg-secondary-container text-secondary',              label: 'Linked',      icon: 'person' },
  deactivated:        { cls: 'bg-error-container text-on-error-container',         label: 'Deactivated', icon: 'block' },
};

export default function CardInventoryPage() {
  const { addToast } = useToastStore();

  const [cards, setCards] = useState<CardInventoryItem[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMerchant, setFilterMerchant] = useState('');

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const [showAllocatePanel, setShowAllocatePanel] = useState(false);
  const [allocateMerchant, setAllocateMerchant] = useState('');
  const [allocateQty, setAllocateQty] = useState(10);
  const [allocateLoading, setAllocateLoading] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<CardInventoryItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<CardInventoryItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allCards, allMerchants] = await Promise.all([
        api.getCardInventory(),
        api.getAllMerchants(),
      ]);
      setCards(allCards);
      setMerchants(allMerchants);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = {
    total: cards.length,
    unassigned: cards.filter(c => c.status === 'unassigned').length,
    allocated: cards.filter(c => c.status === 'merchant_allocated').length,
    linked: cards.filter(c => c.status === 'member_linked').length,
    deactivated: cards.filter(c => c.status === 'deactivated').length,
  };

  const filtered = cards.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterMerchant && c.allocated_merchant_id !== filterMerchant) return false;
    if (searchQuery) {
      const q = searchQuery.replace(/\s/g, '').toLowerCase();
      return (
        c.card_number.replace(/\s/g, '').includes(q) ||
        (c.linked_member_name || '').toLowerCase().includes(q) ||
        (c.linked_member_phone || '').replace(/\s/g, '').includes(q) ||
        (c.allocated_merchant_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddCards = async () => {
    if (!bulkInput.trim()) return;
    setAddLoading(true);
    try {
      const lines = bulkInput.split(/[\n,]+/).map(l => l.trim()).filter(Boolean);
      const result = await api.addCardsToInventory(lines);
      addToast('success', `Added ${result.added} cards${result.skipped ? `, ${result.skipped} duplicates skipped` : ''}`);
      if (result.errors.length > 0) addToast('error', `${result.errors.length} invalid entries — check format`);
      setBulkInput('');
      setShowAddPanel(false);
      fetchData();
    } catch { addToast('error', 'Failed to add cards'); }
    finally { setAddLoading(false); }
  };

  const handleAllocate = async () => {
    if (!allocateMerchant || allocateQty <= 0) return;
    setAllocateLoading(true);
    try {
      const unassigned = cards.filter(c => c.status === 'unassigned').slice(0, allocateQty);
      if (unassigned.length === 0) { addToast('error', 'No unassigned cards available'); setAllocateLoading(false); return; }
      await api.allocateCardsToMerchant(allocateMerchant, unassigned.map(c => c.id));
      addToast('success', `${unassigned.length} cards allocated to merchant`);
      setShowAllocatePanel(false);
      setAllocateMerchant('');
      setAllocateQty(10);
      fetchData();
    } catch (e: any) { addToast('error', e.message || 'Allocation failed'); }
    finally { setAllocateLoading(false); }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await api.deactivateCard(deactivateTarget.id);
      addToast('success', `Card ${deactivateTarget.card_number} deactivated`);
      setDeactivateTarget(null);
      fetchData();
    } catch { addToast('error', 'Deactivation failed'); }
    finally { setDeactivating(false); }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await api.revokeCardsFromMerchant([revokeTarget.id]);
      addToast('success', 'Card returned to unassigned pool');
      setRevokeTarget(null);
      fetchData();
    } catch { addToast('error', 'Revoke failed'); }
    finally { setRevoking(false); }
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-7xl mx-auto space-y-xl animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <h2 className="page-title flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            Card Inventory
          </h2>
          <p className="page-subtitle">Manage the global pool of pre-printed 16-digit membership cards. Add card numbers, allocate to merchants, track usage.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAllocatePanel(p => !p)} className="btn-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            Allocate to Merchant
          </button>
          <button onClick={() => setShowAddPanel(p => !p)} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add_card</span>
            Add Card Numbers
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
        {[
          { label: 'Total Cards', value: stats.total, icon: 'credit_card', cls: 'bg-primary-container/20 text-primary' },
          { label: 'Unassigned', value: stats.unassigned, icon: 'inventory_2', cls: 'bg-surface-container text-on-surface-variant' },
          { label: 'Allocated', value: stats.allocated, icon: 'store', cls: 'bg-primary-fixed/20 text-primary' },
          { label: 'Linked', value: stats.linked, icon: 'person_check', cls: 'bg-secondary-container text-secondary' },
          { label: 'Deactivated', value: stats.deactivated, icon: 'block', cls: 'bg-error-container text-on-error-container' },
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

      {/* Add Cards Panel */}
      {showAddPanel && (
        <div className="card p-lg space-y-md animate-fade-in border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <h3 className="text-headline-md font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_card</span>
              Add Card Numbers to Inventory
            </h3>
            <button onClick={() => { setShowAddPanel(false); setBulkInput(''); }} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Paste the 16-digit card numbers from the printer's dataset. One per line, or comma-separated.
            Spaces within numbers are automatically handled (e.g. <code className="bg-surface-container px-1 rounded text-sm">4821673900123841</code> and <code className="bg-surface-container px-1 rounded text-sm">4821 6739 0012 3841</code> are the same).
          </p>
          <div className="bg-surface-container rounded-xl p-4 font-mono text-sm text-on-surface-variant leading-7">
            <strong>Example:</strong><br />
            4821673900123841<br />
            4821673900123842<br />
            4821673900123843
          </div>
          <textarea
            value={bulkInput}
            onChange={e => setBulkInput(e.target.value)}
            placeholder="Paste card numbers here..."
            rows={8}
            className="input-field font-mono text-sm resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowAddPanel(false); setBulkInput(''); }} className="btn-secondary">Cancel</button>
            <button
              onClick={handleAddCards}
              disabled={addLoading || !bulkInput.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {addLoading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              {addLoading ? 'Adding...' : 'Add to Inventory'}
            </button>
          </div>
        </div>
      )}

      {/* Allocate Panel */}
      {showAllocatePanel && (
        <div className="card p-lg space-y-md animate-fade-in border-l-4 border-secondary">
          <div className="flex items-center justify-between">
            <h3 className="text-headline-md font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">storefront</span>
              Allocate Cards to Merchant
            </h3>
            <button onClick={() => setShowAllocatePanel(false)} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Select a merchant and specify how many unassigned cards to give them. Cards are pulled from the global pool in order.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="form-label">Merchant *</label>
              <select className="input-field" value={allocateMerchant} onChange={e => setAllocateMerchant(e.target.value)}>
                <option value="">Select merchant...</option>
                {merchants.filter(m => m.status === 'active').map(m => (
                  <option key={m.id} value={m.id}>{m.business_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Number of Cards *</label>
              <input
                type="number" min={1} max={stats.unassigned}
                value={allocateQty}
                onChange={e => setAllocateQty(Number(e.target.value))}
                className="input-field"
              />
              <p className="text-label-sm text-on-surface-variant mt-1">{stats.unassigned} cards available in pool</p>
            </div>
          </div>
          {allocateMerchant && allocateQty > 0 && (
            <div className="bg-primary-container/20 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">info</span>
              <p className="text-body-md">
                This will allocate <strong>{Math.min(allocateQty, stats.unassigned)}</strong> cards to{' '}
                <strong>{merchants.find(m => m.id === allocateMerchant)?.business_name}</strong>.
                Their staff can then link each card to a member.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAllocatePanel(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleAllocate}
              disabled={allocateLoading || !allocateMerchant || allocateQty <= 0 || stats.unassigned === 0}
              className="btn-primary flex items-center gap-2"
            >
              {allocateLoading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              {allocateLoading ? 'Allocating...' : 'Allocate Cards'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-surface-container rounded-xl p-1 gap-1 flex-wrap">
          {(['all', 'unassigned', 'merchant_allocated', 'member_linked', 'deactivated'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-label-md transition-all whitespace-nowrap
                ${filterStatus === s ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              {s === 'all' ? 'All' : s === 'merchant_allocated' ? 'Allocated' : s === 'member_linked' ? 'Linked' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select className="input-field w-auto" value={filterMerchant} onChange={e => setFilterMerchant(e.target.value)}>
          <option value="">All Merchants</option>
          {merchants.map(m => <option key={m.id} value={m.id}>{m.business_name}</option>)}
        </select>
        <div className="flex-1 relative min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
          <input
            className="input-field pl-10 w-full"
            placeholder="Search card number, member, merchant..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low">
              <tr>
                {['Card Number', 'Status', 'Merchant', 'Linked Member', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-container rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] block mb-2">credit_card_off</span>
                  No cards match your filters
                </td></tr>
              ) : filtered.map(card => {
                const cfg = STATUS_CONFIG[card.status];
                return (
                  <tr key={card.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                        </div>
                        <span className="font-mono font-bold text-body-md tracking-widest">{card.card_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-label-sm px-2 py-0.5 rounded-full ${cfg.cls}`}>
                        <span className="material-symbols-outlined text-[13px]">{cfg.icon}</span>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">
                      {card.allocated_merchant_name || <span className="italic text-outline">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {card.linked_member_name ? (
                        <div>
                          <p className="text-body-md font-bold">{card.linked_member_name}</p>
                          <p className="text-label-sm text-on-surface-variant">{card.linked_member_phone}</p>
                        </div>
                      ) : <span className="italic text-outline text-body-md">—</span>}
                    </td>
                    <td className="px-4 py-3 text-label-sm text-on-surface-variant whitespace-nowrap">
                      {card.linked_at
                        ? `Linked ${format(new Date(card.linked_at), 'dd MMM yy')}`
                        : card.allocated_at
                        ? `Allocated ${format(new Date(card.allocated_at), 'dd MMM yy')}`
                        : format(new Date(card.created_at), 'dd MMM yy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {card.status === 'merchant_allocated' && (
                          <button onClick={() => setRevokeTarget(card)} className="text-label-sm text-primary hover:bg-primary-container/20 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                            Revoke
                          </button>
                        )}
                        {card.status !== 'deactivated' && (
                          <button onClick={() => setDeactivateTarget(card)} className="text-error hover:bg-error-container p-1 rounded-lg transition-colors" title="Deactivate">
                            <span className="material-symbols-outlined text-[16px]">block</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-outline-variant/20 text-label-sm text-on-surface-variant">
          Showing {filtered.length} of {cards.length} cards
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Card"
        danger
        isLoading={deactivating}
        confirmLabel="Deactivate"
        description={
          <div className="space-y-3">
            <div className="bg-surface-container rounded-xl p-4 font-mono text-body-md tracking-widest font-bold text-center">{deactivateTarget?.card_number}</div>
            <p className="text-body-md text-on-surface-variant">This card will be permanently deactivated. The member's mobile number will still work for redemption.</p>
          </div>
        }
      />

      <ConfirmModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke Card Allocation"
        danger={false}
        isLoading={revoking}
        confirmLabel="Revoke Allocation"
        description={`Return card "${revokeTarget?.card_number}" from "${revokeTarget?.allocated_merchant_name}" back to the unassigned pool. Only possible if the card is not yet linked to any member.`}
      />
    </div>
  );
}
