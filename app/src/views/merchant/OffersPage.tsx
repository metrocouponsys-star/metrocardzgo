import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../../components/ui/Modal';
import type { OfferTemplate, MembershipType } from '../../types';
import * as api from '../../api/client';

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
      setShowModal(false);
    } catch { addToast('error', 'Failed to save offer'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (offer: OfferTemplate) => {
    const updated = await api.updateOfferTemplate(user?.merchant_id || '', offer.id, { active: !offer.active });
    setOffers(o => o.map(x => x.id === updated.id ? updated : x));
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
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Offer
        </button>
      </div>

      {loading ? (
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
      )}

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

          {/* Feature 1: Loyalty Points Controls */}
          {form.offer_type !== 'points_redemption' ? (
            <div className="border border-outline-variant/40 rounded-xl p-3 space-y-2 bg-green-50/40">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                  <span className="text-body-md font-semibold text-green-800">Earns Loyalty Points on Redemption</span>
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
                <span className="text-body-md font-semibold text-amber-800">Points Redemption Reward</span>
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
