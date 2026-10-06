import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../../components/ui/Modal';
import type { OfferTemplate, MembershipType, PointsRule } from '../../types';
import * as api from '../../api';
import { invalidateContaining } from '../../api/cache';

const T = {
  bg: '#F6F3EE',
  white: '#FFFFFF',
  panel: '#FFFDFB',
  soft: '#F9F7F5',
  border: '#EAE3DD',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  orange: '#FF6B35',
  orangeLight: '#FFF4EF',
  orangeDark: '#EA580C',
  green: '#16A34A',
  greenLight: '#F0FDF4',
  violet: '#7C3AED',
  violetLight: '#F5F3FF',
  shadow: '0 10px 22px rgba(17,24,39,0.05)',
  shadowMd: '0 16px 30px rgba(17,24,39,0.06)',
};

const OFFER_TYPES = [
  { value: 'birthday_anniversary', label: '🎂 Birthday & Anniversary Benefit' },
  { value: 'flat_off', label: '₹ Flat Off (Cash Discount)' },
  { value: 'wallet_points', label: '💰 Cash Back / Wallet Points' },
  { value: 'buy_1_get_1', label: '🎁 Buy 1 Get 1 Free (BOGO)' },
  { value: 'percent_off', label: '% Off (Percentage Discount)' },
  { value: 'free_service', label: 'Free Service / Reward' },
  { value: 'birthday', label: 'Birthday Benefit' },
  { value: 'referral', label: 'Referral Bonus' },
  { value: 'points_redemption', label: '🏆 Points Redemption Reward' },
];

const TYPE_ICONS: Record<string, string> = {
  birthday_anniversary: 'cake',
  flat_off: 'sell',
  wallet_points: 'account_balance_wallet',
  cashback: 'account_balance_wallet',
  buy_1_get_1: 'card_giftcard',
  percent_off: 'percent',
  free_service: 'spa',
  referral: 'people',
  birthday: 'cake',
  points_redemption: 'stars',
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

  const handleDelete = async (offer: OfferTemplate) => {
    if (!window.confirm(`Delete offer "${offer.title}"?`)) return;
    try {
      await api.deleteOfferTemplate(user?.merchant_id || '', offer.id);
      addToast('success', 'Offer deleted');
      invalidateContaining('offers');
      setOffers(prev => prev.filter(o => o.id !== offer.id));
    } catch {
      addToast('error', 'Failed to delete offer');
    }
  };

  const tabContent = tab === 'offers'
    ? loading
      ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 150, borderRadius: 18, background: 'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 40%, #F3F4F6 80%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s linear infinite', border: `1px solid ${T.border}` }} />
          ))}
        </div>
      )
      : (
        <>
          {active.length > 0 && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                <h3 style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted }}>Active Offers ({active.length})</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {active.map((offer) => (
                  <OfferRow key={offer.id} offer={offer} membershipTypes={membershipTypes} onEdit={openEdit} onToggle={toggleActive} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div style={{ display: 'grid', gap: 14, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block' }} />
                <h3 style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted }}>Inactive Offers ({inactive.length})</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, opacity: 0.7 }}>
                {inactive.map((offer) => (
                  <OfferRow key={offer.id} offer={offer} membershipTypes={membershipTypes} onEdit={openEdit} onToggle={toggleActive} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
          {offers.length === 0 && (
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, boxShadow: T.shadow, padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: T.orange, fontVariationSettings: "'FILL' 1" }}>local_offer</span>
              </div>
              <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 15, color: T.text }}>No offers yet</p>
              <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>Add your first promotional offer to get started.</p>
            </div>
          )}
        </>
      )
    : <SetPointsTab />;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.orangeLight, border: `1px solid ${T.border}`, borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.orangeDark, marginBottom: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>local_offer</span>
              Promotions
            </div>
            <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.05em', color: T.text, fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>Offers & Loyalty Points</h2>
            <p style={{ margin: '8px 0 0', color: T.textMuted, fontSize: 14 }}>Configure campaigns, member rewards, and points rules to keep retention strong.</p>
          </div>
          {tab === 'offers' && (
            <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px rgba(249,115,22,0.18)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Add Offer
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Active offers', value: String(active.length), icon: 'local_offer', color: T.orange, bg: T.orangeLight },
            { label: 'Inactive', value: String(inactive.length), icon: 'pause_circle', color: '#0EA5E9', bg: '#E0F2FE' },
            { label: 'Rewards', value: String(offers.length), icon: 'stars', color: T.violet, bg: T.violetLight },
          ].map((item) => (
            <div key={item.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, boxShadow: T.shadow, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: item.color, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textLight }}>{item.label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800, color: T.text }}>{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', background: T.white, border: `1px solid ${T.border}`, boxShadow: T.shadow, borderRadius: 18, padding: 6, gap: 6, marginBottom: 20 }}>
          <button
            onClick={() => setTab('offers')}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 12,
              padding: '10px 14px',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              background: tab === 'offers' ? 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)' : T.soft,
              color: tab === 'offers' ? '#fff' : T.textMuted,
              boxShadow: tab === 'offers' ? '0 8px 16px rgba(249,115,22,0.16)' : 'none'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 8, verticalAlign: 'middle', fontVariationSettings: "'FILL' 1" }}>local_offer</span>
            Offers
          </button>
          <button
            onClick={() => setTab('set_points')}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 12,
              padding: '10px 14px',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              background: tab === 'set_points' ? 'linear-gradient(135deg, #FF6B35 0%, #E85A28 100%)' : T.soft,
              color: tab === 'set_points' ? '#fff' : T.textMuted,
              boxShadow: tab === 'set_points' ? '0 8px 16px rgba(249,115,22,0.16)' : 'none'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, marginRight: 8, verticalAlign: 'middle', fontVariationSettings: "'FILL' 1" }}>bolt</span>
            Set Points
          </button>
        </div>

        {tabContent}

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
    </div>
  );
}

function OfferRow({ offer, membershipTypes, onEdit, onToggle, onDelete }: {
  offer: OfferTemplate; membershipTypes: MembershipType[];
  onEdit: (o: OfferTemplate) => void; onToggle: (o: OfferTemplate) => void;
  onDelete: (o: OfferTemplate) => void;
}) {
  const icon = TYPE_ICONS[offer.offer_type] || 'star';
  const applicableNames = membershipTypes.filter(mt => offer.applicable_membership_type_ids?.includes(mt.id)).map(mt => mt.name);
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 18, boxShadow: T.shadow, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: offer.offer_type === 'points_redemption' ? '#FEF3C7' : T.orangeLight, flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: offer.offer_type === 'points_redemption' ? '#D97706' : T.orange, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.text }}>{offer.title}</h4>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 999, padding: '4px 8px', background: offer.active ? '#F0FDF4' : '#F3F4F6', color: offer.active ? '#16A34A' : T.textMuted }}>
              {offer.active ? 'Active' : 'Inactive'}
            </span>
            {offer.loyalty_points_earn != null && !offer.is_points_redemption && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 999, background: '#F0FDF4', color: '#16A34A', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                +{offer.loyalty_points_earn} pts
              </span>
            )}
            {offer.is_points_redemption && offer.loyalty_points_cost != null && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 999, background: '#FEF3C7', color: '#B45309', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>stars</span>
                {offer.loyalty_points_cost} pts
              </span>
            )}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>{offer.description}</p>
        </div>
      </div>

      {applicableNames.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {applicableNames.map((n) => (
            <span key={n} style={{ fontSize: 11, fontWeight: 700, padding: '5px 8px', borderRadius: 999, background: T.orangeLight, color: T.orangeDark, border: `1px solid ${T.border}` }}>{n}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onEdit(offer)} style={{ flex: 1, border: `1px solid ${T.border}`, background: T.soft, color: T.textMuted, borderRadius: 10, padding: '9px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
          Edit
        </button>
        <button onClick={() => onToggle(offer)} style={{ flex: 1, border: `1px solid ${offer.active ? '#FECACA' : '#DBEAFE'}`, background: offer.active ? '#FEF2F2' : '#EFF6FF', color: offer.active ? '#DC2626' : '#2563EB', borderRadius: 10, padding: '9px 10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{offer.active ? 'toggle_off' : 'toggle_on'}</span>
          {offer.active ? 'Deactivate' : 'Activate'}
        </button>
        <button onClick={() => onDelete(offer)} title="Delete offer" style={{ width: 40, border: `1px solid #FECACA`, background: '#FEF2F2', color: '#DC2626', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
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

  const load = () => {
    invalidateContaining('points-rules');
    api.getPointsRules().then(setRules as any).catch(() => {}).finally(() => setLoading(false));
  };
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

      <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 flex gap-3">
        <span className="material-symbols-outlined text-accent flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
        <div className="text-[13px] text-on-surface">
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
                      <span className="text-[22px] font-extrabold text-accent font-display">⚡ {Number(r.points_value).toFixed(0)}</span>
                      <span className="text-[13px] text-on-surface-variant">pts / {r.rule_type === 'per_visit' ? 'visit' : `₹${r.spend_unit || 1}`}</span>
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
