import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { MembershipType, OfferTemplate } from '../../types';
import * as api from '../../api';
import { Modal, ConfirmModal } from '../../components/ui/Modal';

const TIER_COLORS = [
  { bg: 'from-primary to-primary/70', text: 'text-white', badge: 'bg-white/20 text-white' },
  { bg: 'from-secondary to-secondary/70', text: 'text-white', badge: 'bg-white/20 text-white' },
  { bg: 'from-tertiary to-tertiary/70 bg-teal-600', text: 'text-white', badge: 'bg-white/20 text-white' },
  { bg: 'from-amber-500 to-amber-600', text: 'text-white', badge: 'bg-white/20 text-white' },
];

interface BundledOfferFormItem {
  offer_template_id: string;
  default_qty: number;
}

export default function MembershipTypesPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [availableOffers, setAvailableOffers] = useState<OfferTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<MembershipType | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    bundled_offers: [] as BundledOfferFormItem[],
  });
  const [saving, setSaving] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<MembershipType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user?.role === 'owner' || user?.role === 'super_admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, o] = await Promise.all([
        api.getMembershipTypes(user?.merchant_id || ''),
        api.getOfferTemplates(user?.merchant_id || ''),
      ]);
      setTypes(t);
      setAvailableOffers(o.filter(item => item.active));
    } catch {
      addToast('error', 'Failed to load membership types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', description: '', bundled_offers: [] });
    setShowModal(true);
  };

  const openEdit = (type: MembershipType) => {
    setEditTarget(type);
    const bundled = (type.bundled_offers || type.offers || []).map((o: any) => ({
      offer_template_id: o.offer_template_id || o.id,
      default_qty: o.default_qty || 1,
    }));
    setForm({
      name: type.name,
      description: type.description || '',
      bundled_offers: bundled,
    });
    setShowModal(true);
  };

  const toggleOfferBundle = (offerId: string) => {
    setForm(prev => {
      const exists = prev.bundled_offers.find(b => b.offer_template_id === offerId);
      if (exists) {
        return {
          ...prev,
          bundled_offers: prev.bundled_offers.filter(b => b.offer_template_id !== offerId),
        };
      } else {
        return {
          ...prev,
          bundled_offers: [...prev.bundled_offers, { offer_template_id: offerId, default_qty: 1 }],
        };
      }
    });
  };

  const updateOfferQty = (offerId: string, qty: number) => {
    setForm(prev => ({
      ...prev,
      bundled_offers: prev.bundled_offers.map(b =>
        b.offer_template_id === offerId ? { ...b, default_qty: Math.max(1, qty) } : b
      ),
    }));
  };

  const save = async () => {
    if (!form.name.trim()) { addToast('error', 'Type Name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        bundled_offers: form.bundled_offers,
      };
      if (editTarget) {
        await api.updateMembershipType(user?.merchant_id || '', editTarget.id, payload as any);
        addToast('success', `Membership type "${form.name}" updated`);
      } else {
        await api.createMembershipType(user?.merchant_id || '', payload as any);
        addToast('success', `Membership type "${form.name}" created`);
      }
      setShowModal(false);
      setEditTarget(null);
      fetchData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save membership type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteMembershipType(user?.merchant_id || '', deleteTarget.id);
      addToast('success', `Membership type "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete membership type (check active members)');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-4xl mx-auto space-y-xl animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <h2 className="page-title">Membership Types</h2>
          <p className="page-subtitle">Create tiers like "Prime" or "Standard" and bundle exclusive offer packages into each tier.</p>
        </div>
        {isOwner && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Type
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-md h-52 animate-pulse bg-surface-container rounded-2xl" />
          ))}
        </div>
      ) : types.length === 0 ? (
        <div className="card p-lg flex flex-col items-center text-center py-16">
          <div className="w-20 h-20 bg-primary-container/20 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-[40px]">card_membership</span>
          </div>
          <h3 className="text-headline-md font-bold mb-2">No membership types yet</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mb-6">
            Create tiers like "Prime" or "Standard" to categorise your members and bundle exclusive offers.
          </p>
          {isOwner && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create First Type
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {types.map((type, idx) => {
            const color = TIER_COLORS[idx % TIER_COLORS.length];
            const bundledList = type.bundled_offers || type.offers || [];
            return (
              <div
                key={type.id}
                className="relative rounded-2xl overflow-hidden shadow-tonal flex flex-col hover:shadow-elevated transition-all duration-200 group"
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-br ${color.bg} p-5 flex items-start justify-between`}>
                  <div>
                    <p className={`text-label-sm font-bold uppercase tracking-widest opacity-70 ${color.text}`}>Membership Tier</p>
                    <h3 className={`text-headline-lg font-bold mt-1 ${color.text}`}>{type.name}</h3>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${color.badge}`}>
                    {type.member_count ?? 0} members
                  </div>
                </div>

                {/* Body */}
                <div className="bg-surface p-5 flex-1 flex flex-col gap-4">
                  <p className="text-body-md text-on-surface-variant leading-relaxed">{type.description || 'No description provided.'}</p>

                  {/* Bundled Offers */}
                  {bundledList.length > 0 ? (
                    <div>
                      <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                        Bundled Offers ({bundledList.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {bundledList.map((o: any) => {
                          const offerId = o.offer_template_id || o.id;
                          const offerObj = availableOffers.find(item => item.id === offerId);
                          const title = o.title || offerObj?.title || 'Offer';
                          const qty = o.default_qty || 1;
                          return (
                            <span key={offerId} className="text-[11px] px-2.5 py-1 bg-secondary-container/50 text-secondary rounded-full font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">local_offer</span>
                              {qty > 1 ? `${qty}x ` : ''}{title}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-on-surface-variant text-label-sm">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      No offers bundled into this tier yet.
                    </div>
                  )}

                  {/* Actions */}
                  {isOwner && (
                    <div className="mt-auto pt-2 flex items-center gap-2 border-t border-outline-variant/30">
                      <button
                        onClick={() => openEdit(type)}
                        className="flex-1 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(type)}
                        className="p-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-error-container/30 hover:border-error hover:text-error transition-all"
                        title="Delete Tier"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add New card */}
          {isOwner && (
            <button
              onClick={openCreate}
              className="card border-dashed border-2 border-outline-variant/50 flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-surface-container-low hover:border-primary hover:text-primary transition-all min-h-[240px] rounded-2xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-[28px] text-primary">add_circle</span>
              </div>
              <span className="text-label-md font-bold">Add Membership Type</span>
            </button>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditTarget(null); }} title={editTarget ? 'Edit Membership Type' : 'Add Membership Type'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="form-label">Tier Name *</label>
            <input
              className="input-field"
              placeholder="e.g. Prime, Standard, Gold"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              rows={2}
              className="input-field h-auto py-3 resize-none"
              placeholder="Briefly describe the benefits of this tier"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Bundled Offers Selector */}
          <div>
            <label className="form-label mb-1">Bundle Offers into this Tier</label>
            <p className="text-label-sm text-on-surface-variant mb-3">
              Select offer templates auto-assigned to members who join this tier:
            </p>
            {availableOffers.length === 0 ? (
              <div className="p-3 bg-surface-container rounded-xl text-body-sm text-on-surface-variant">
                No active offer templates available. Create offers on the <strong>Offers</strong> page first.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {availableOffers.map(offer => {
                  const bundled = form.bundled_offers.find(b => b.offer_template_id === offer.id);
                  const isSelected = !!bundled;
                  return (
                    <div
                      key={offer.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant/50 hover:bg-surface-container'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOfferBundle(offer.id)}
                          className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary"
                        />
                        <div className="truncate">
                          <p className="text-body-sm font-bold text-on-surface truncate">{offer.title}</p>
                          <p className="text-label-xs text-on-surface-variant capitalize">{offer.offer_type.replace('_', ' ')} · Value: {offer.value}</p>
                        </div>
                      </label>
                      {isSelected && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-label-xs text-on-surface-variant font-semibold">Qty:</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={bundled.default_qty}
                            onChange={e => updateOfferQty(offer.id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 bg-surface border border-outline-variant rounded-lg text-center text-body-sm font-bold outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-outline-variant/30">
            <button onClick={() => { setShowModal(false); setEditTarget(null); }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              {editTarget ? 'Save Changes' : 'Create Tier'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete "${deleteTarget?.name}" Tier?`}
        description={`Are you sure you want to delete this membership tier? This action cannot be undone.`}
        confirmLabel="Delete Tier"
        danger
        isLoading={deleting}
      />
    </div>
  );
}
