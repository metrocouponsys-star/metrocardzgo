import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../../components/ui/Modal';
import type { OfferTemplate, MembershipType, PointsRule } from '../../types';
import * as api from '../../api';
import { invalidateContaining } from '../../api/cache';

const OFFER_TYPES = [
  { value: 'percent_off', label: '% Off (Discount)' },
  { value: 'free_service', label: 'Free Service / Reward' },
  { value: 'wallet_points', label: 'Wallet Points Cashback' },
  { value: 'referral', label: 'Referral Bonus' },
  { value: 'birthday', label: 'Birthday Benefit' },
  { value: 'points_redemption', label: '🏆 Points Redemption Reward' },
];

const TYPE_ICONS: Record<string, string> = {
  percent_off: 'percent', free_service: 'spa', wallet_points: 'account_balance_wallet',
  referral: 'people', birthday: 'cake', points_redemption: 'stars',
};

export default function OffersPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [tab, setTab] = useState<'offers' | 'set_points'>('offers');
  const [offers, setOffers] = useState<OfferTemplate[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferTemplate | null>(null);
  const [form, setForm] = useState({ title: '', description: '', offer_type: 'free_service', value: '', applicable_membership_type_ids: [] as string[], loyalty_points_earn: '', is_points_redemption: false, loyalty_points_cost: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getOfferTemplates(user?.merchant_id || ''),
      api.getMembershipTypes(user?.merchant_id || ''),
    ]).then(([o, mt]) => { setOffers(o); setMembershipTypes(mt); setLoading(false); });
  }, []);

  const openCreate = () => { setEditingOffer(null); setForm({ title: '', description: '', offer_type: 'free_service', value: '', applicable_membership_type_ids: [], loyalty_points_earn: '', is_points_redemption: false, loyalty_points_cost: '' }); setShowModal(true); };
  const openEdit = (o: OfferTemplate) => { setEditingOffer(o); setForm({ title: o.title, description: o.description, offer_type: o.offer_type, value: String(o.value), applicable_membership_type_ids: o.applicable_membership_type_ids || [], loyalty_points_earn: o.loyalty_points_earn != null ? String(o.loyalty_points_earn) : '', is_points_redemption: o.is_points_redemption || false, loyalty_points_cost: o.loyalty_points_cost != null ? String(o.loyalty_points_cost) : '' }); setShowModal(true); };

  const toggleMembershipType = (id: string) => {
    setForm(f => ({
      ...f,
      applicable_membership_type_ids: f.applicable_membership_type_ids.includes(id)
        ? f.applicable_membership_type_ids.filter(x => x !== id)
        : [...f.applicable_membership_type_ids, id],
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = {
        title: form.title,
        description: form.description,
        offer_type: form.offer_type as any,
        value: parseFloat(form.value) || 0,
        applicable_membership_type_ids: form.applicable_membership_type_ids,
        // Feature 1: loyalty
        loyalty_points_earn: form.loyalty_points_earn ? parseFloat(form.loyalty_points_earn) : null,
        is_points_redemption: form.is_points_redemption,
        loyalty_points_cost: form.loyalty_points_cost ? parseFloat(form.loyalty_points_cost) : null,
      };
      if (editingOffer) {
        const updated = await api.updateOfferTemplate(user?.merchant_id || '', editingOffer.id, data);
        setOffers(o => o.map(x => x.id === updated.id ? updated : x));
        addToast('success', 'Offer updated');
      } else {
        const newOffer = await api.createOfferTemplate(user?.merchant_id || '', data);
        setOffers(o => [...o, newOffer]);
        addToast('success', 'Offer created');
      }
      invalidateContaining('member');
      invalidateContaining('offer');
      invalidateContaining('membership-types');
      setShowModal(false);
    } catch { addToast('error', 'Failed to save offer'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (offer: OfferTemplate) => {
    const updated = await api.updateOfferTemplate(user?.merchant_id || '', offer.id, { active: !offer.active });
    setOffers(o => o.map(x => x.id === updated.id ? updated : x));
    invalidateContaining('member');
    invalidateContaining('offer');
    invalidateContaining('membership-types');
    addToast('success', `"${offer.title}" ${updated.active ? 'activated' : 'deactivated'}`);
  };

  const active = offers.filter(o => o.active);
  const inactive = offers.filter(o => !o.active);

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-4xl mx-auto space-y-xl animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="page-header mb-0">
          <h2 className="page-title">Offer Management</h2>
          <p className="page-subtitle">Create and manage the benefits bundled into your membership types.</p>
        </div>
        {tab === 'offers' && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Offer
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex bg-surface-container rounded-2xl p-1.5 gap-1">
        <button
          onClick={() => setTab('offers')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-medium transition-all
            ${tab === 'offers' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          <span className="material-symbols-outlined text-[18px]">local_offer</span>
          Offers
        </button>
        <button
          onClick={() => setTab('set_points')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-medium transition-all
            ${tab === 'set_points' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
        >
          <span className="material-symbols-outlined text-[18px]">bolt</span>
          Set Points
        </button>
      </div>

      {tab === 'offers' && (loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-md animate-pulse space-y-3">
              <div className="h-12 w-12 bg-surface-container rounded-lg" />
              <div className="h-5 w-2/3 bg-surface-container rounded" />
              <div className="h-4 w-full bg-surface-container rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h3 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-3">Active Offers ({active.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {active.map(offer => <OfferRow key={offer.id} offer={offer} membershipTypes={membershipTypes} onEdit={openEdit} onToggle={toggleActive} />)}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <h3 className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider mb-3">Inactive Offers ({inactive.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md opacity-60">
                {inactive.map(offer => <OfferRow key={offer.id} offer={offer} membershipTypes={membershipTypes} onEdit={openEdit} onToggle={toggleActive} />)}
              </div>
            </div>
          )}
          {offers.length === 0 && (
            <div className="card p-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-2">local_offer</span>
              <p>No offers yet. Add your first offer to get started.</p>
            </div>
          )}
        </>
      ))}

      {tab === 'set_points' && <SetPointsTab />}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingOffer ? 'Edit Offer' : 'Add Offer'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="form-label">Title *</label>
            <input className="input-field" placeholder="e.g. Free Hair Wash" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea rows={2} className="input-field h-auto py-3 resize-none" placeholder="Describe the offer terms" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Type *</label>
              <select className="input-field" value={form.offer_type} onChange={e => setForm(f => ({ ...f, offer_type: e.target.value, is_points_redemption: e.target.value === 'points_redemption' }))}>
                {OFFER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Value</label>
              <input type="number" className="input-field" placeholder="e.g. 10 for 10%" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
          </div>

          {/* Set Points on Offer Redemption */}
          {form.offer_type !== 'points_redemption' ? (
            <div className="border border-outline-variant/40 rounded-xl p-3 space-y-2 bg-green-50/40">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                  <span className="text-body-md font-semibold text-green-800">Set Points on Redemption</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, loyalty_points_earn: f.loyalty_points_earn ? '' : '10' }))}
                  className={`w-10 h-5 rounded-full transition-all ${form.loyalty_points_earn ? 'bg-green-500' : 'bg-outline-variant'}`}
                >
                  <span className={`block w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${form.loyalty_points_earn ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              {form.loyalty_points_earn && (
                <div>
                  <label className="form-label text-green-700">Points earned per redemption</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 10"
                    min="1"
                    value={form.loyalty_points_earn}
                    onChange={e => setForm(f => ({ ...f, loyalty_points_earn: e.target.value }))}
                  />
                  <p className="text-label-sm text-green-600 mt-1">Members earn this many points every time this offer is redeemed.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-amber-200 rounded-xl p-3 space-y-2 bg-amber-50/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <span className="text-body-md font-semibold text-amber-800">Set Points Cost (Redemption Reward)</span>
              </div>
              <p className="text-label-sm text-amber-700">Members spend loyalty points to claim this reward. Set how many points it costs.</p>
              <div>
                <label className="form-label text-amber-700">Points cost</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 100"
                  min="1"
                  value={form.loyalty_points_cost}
                  onChange={e => setForm(f => ({ ...f, loyalty_points_cost: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Applicable Membership Types</label>
            <div className="flex flex-wrap gap-2">
              {membershipTypes.map(mt => (
                <button
                  key={mt.id}
                  type="button"
                  onClick={() => toggleMembershipType(mt.id)}
                  className={`px-3 py-1.5 rounded-lg text-label-md transition-all border
                    ${form.applicable_membership_type_ids.includes(mt.id) ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                >
                  {mt.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={save} disabled={saving || !form.title} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              {editingOffer ? 'Update Offer' : 'Create Offer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function OfferRow({ offer, membershipTypes, onEdit, onToggle }: {
  offer: OfferTemplate; membershipTypes: MembershipType[];
  onEdit: (o: OfferTemplate) => void; onToggle: (o: OfferTemplate) => void;
}) {
  const icon = TYPE_ICONS[offer.offer_type] || 'star';
  const applicableNames = membershipTypes.filter(mt => offer.applicable_membership_type_ids?.includes(mt.id)).map(mt => mt.name);
  return (
    <div className="card p-md flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${offer.offer_type === 'points_redemption' ? 'bg-amber-100 text-amber-600' : 'bg-primary-container/10 text-primary'}`}>
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: offer.offer_type === 'points_redemption' ? "'FILL' 1" : undefined }}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-body-lg font-bold">{offer.title}</h4>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${offer.active ? 'bg-secondary-container text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
              {offer.active ? 'ACTIVE' : 'INACTIVE'}
            </span>
            {/* Feature 1: loyalty earn badge */}
            {offer.loyalty_points_earn != null && !offer.is_points_redemption && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                +{offer.loyalty_points_earn} pts
              </span>
            )}
            {/* Feature 1: points cost badge */}
            {offer.is_points_redemption && offer.loyalty_points_cost != null && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                {offer.loyalty_points_cost} pts
              </span>
            )}
          </div>
          <p className="text-body-md text-on-surface-variant line-clamp-1">{offer.description}</p>
        </div>
      </div>
      {applicableNames.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {applicableNames.map(n => <span key={n} className="text-[10px] px-2 py-0.5 bg-primary-fixed/20 text-primary rounded-full">{n}</span>)}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => onEdit(offer)} className="flex-1 py-2 rounded-lg border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container transition-colors flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">edit</span> Edit
        </button>
        <button onClick={() => onToggle(offer)} className={`flex-1 py-2 rounded-lg text-label-md flex items-center justify-center gap-1 transition-colors
          ${offer.active ? 'border border-error/30 text-error hover:bg-error-container' : 'border border-secondary/30 text-secondary hover:bg-secondary-container/20'}`}>
          <span className="material-symbols-outlined text-[14px]">{offer.active ? 'toggle_off' : 'toggle_on'}</span>
          {offer.active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SET POINTS TAB  (inline Points Rules panel in Offers)
// ─────────────────────────────────────────────────────────────────────────────
function SetPointsTab() {
  const { addToast } = useToastStore();
  const [rules, setRules] = useState<PointsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PointsRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ rule_type: 'per_rupee', points_value: '', spend_unit: '1' });

  const load = () => api.getPointsRules().then(setRules as any).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditTarget(null); setForm({ rule_type: 'per_rupee', points_value: '1', spend_unit: '1' }); setShowModal(true); };
  const openEdit = (r: PointsRule) => {
    setEditTarget(r);
    setForm({ rule_type: r.rule_type, points_value: String(r.points_value), spend_unit: r.spend_unit != null ? String(r.spend_unit) : '1' });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.points_value) { addToast('error', 'Points value is required'); return; }
    setSaving(true);
    try {
      const payload = { rule_type: form.rule_type as 'per_visit' | 'per_rupee', points_value: Number(form.points_value), spend_unit: form.rule_type === 'per_rupee' ? Number(form.spend_unit || 1) : 1 };
      if (editTarget) { await api.updatePointsRule(editTarget.id, payload); addToast('success', 'Points rule updated'); }
      else { await api.createPointsRule(payload); addToast('success', 'Points rule created'); }
      setShowModal(false); setEditTarget(null); setForm({ rule_type: 'per_rupee', points_value: '1', spend_unit: '1' }); load();
    } catch { addToast('error', editTarget ? 'Failed to update rule' : 'Failed to create rule'); }
    finally { setSaving(false); }
  };

  const RULE_META: Record<string, { icon: string; color: string }> = {
    per_visit: { icon: 'store', color: 'bg-primary-container/30 text-primary' },
    per_rupee: { icon: 'currency_rupee', color: 'bg-secondary-container text-secondary' },
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">Define rules for how members earn loyalty points.</p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Rule
        </button>
      </div>

      <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-4 flex gap-3">
        <span className="material-symbols-outlined text-primary flex-shrink-0">info</span>
        <div className="text-body-sm text-on-surface">
          <strong>Set Points:</strong> Define how members earn loyalty points on visits or purchases. Members can spend points via the reward catalog or points redemption offers.
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="card h-36 animate-pulse" />)}
        </div>
      ) : rules.length === 0 ? (
        <div className="card p-lg flex flex-col items-center text-center py-16">
          <div className="w-20 h-20 bg-primary-container/20 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <h3 className="text-headline-md font-bold mb-2">No points rules yet</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mb-6">Set up rules to automatically award loyalty points to members on every visit or purchase.</p>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {(rules as any[]).map((r: any) => {
            const meta = RULE_META[r.rule_type] || { icon: 'stars', color: 'bg-surface-container text-on-surface-variant' };
            const descText = r.rule_type === 'per_visit'
              ? `Members earn ${Number(r.points_value).toFixed(0)} points on each visit`
              : `Members earn ${Number(r.points_value).toFixed(0)} points for every ₹${r.spend_unit || 1} spent`;
            return (
              <div key={r.id} className={`card p-md flex flex-col gap-4 transition-all hover:shadow-elevated ${!r.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-headline-lg font-bold text-primary">⚡ {Number(r.points_value).toFixed(0)}</span>
                      <span className="text-body-md text-on-surface-variant">pts / {r.rule_type === 'per_visit' ? 'visit' : `₹${r.spend_unit || 1}`}</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">{descText}</p>
                  </div>
                  <span className={`text-label-sm px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 border-t border-outline-variant/20 pt-3">
                  <button onClick={() => openEdit(r)} className="flex-1 py-1.5 rounded-xl border border-outline-variant text-on-surface-variant text-label-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                  </button>
                  <button onClick={async () => { await api.updatePointsRule(r.id, { is_active: !r.is_active }); load(); }}
                    className="flex-1 py-1.5 rounded-xl border border-outline-variant text-on-surface-variant text-label-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">{r.is_active ? 'pause_circle' : 'play_circle'}</span>
                    {r.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={async () => { await api.deletePointsRule(r.id); load(); addToast('success', 'Rule deleted'); }}
                    className="p-1.5 rounded-xl text-error hover:bg-error-container transition-colors" title="Delete rule">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditTarget(null); }} title={editTarget ? 'Edit Points Rule' : 'Set Points Rule'}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Rule Type *</label>
            <select className="input-field" value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}>
              <option value="per_rupee">Per Spending Amount (₹) — earn points per ₹ spent</option>
              <option value="per_visit">Per Visit — earn flat points on every visit</option>
            </select>
          </div>
          {form.rule_type === 'per_rupee' && (
            <div>
              <label className="form-label">Spend Amount Unit (₹) *</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, spend_unit: '1' }))}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-label-sm font-semibold border transition-all ${form.spend_unit === '1' ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container'}`}>
                  Every ₹1
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, spend_unit: '100' }))}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-label-sm font-semibold border transition-all ${form.spend_unit === '100' ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container'}`}>
                  Every ₹100
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, spend_unit: form.spend_unit !== '1' && form.spend_unit !== '100' ? form.spend_unit : '50' }))}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-label-sm font-semibold border transition-all ${form.spend_unit !== '1' && form.spend_unit !== '100' ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container'}`}>
                  Custom
                </button>
              </div>
              <input type="number" min={1} className="input-field" placeholder="e.g. 1 or 100" value={form.spend_unit} onChange={e => setForm(f => ({ ...f, spend_unit: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="form-label">Points Earned *</label>
            <input type="number" min={1} className="input-field" placeholder="e.g. 10 or 100" value={form.points_value} onChange={e => setForm(f => ({ ...f, points_value: e.target.value }))} autoFocus />
          </div>
          <div className="bg-primary-container/20 border border-primary/20 rounded-xl p-3 text-body-sm text-primary font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">bolt</span>
            <span>
              {form.rule_type === 'per_visit'
                ? `Members earn ${form.points_value || 'X'} points on each visit`
                : `Members earn ${form.points_value || 'X'} points for every ₹${form.spend_unit || '1'} spent`}
            </span>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowModal(false); setEditTarget(null); }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={save} disabled={saving || !form.points_value} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              {editTarget ? 'Save Changes' : 'Set Points Rule'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
