import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { MembershipType } from '../../types';
import * as api from '../../api';
import { Modal } from '../../components/ui/Modal';

const TIER_COLORS = [
  { bg: 'from-primary to-primary/70', text: 'text-white', badge: 'bg-white/20 text-white' },
  { bg: 'from-secondary to-secondary/70', text: 'text-white', badge: 'bg-white/20 text-white' },
  { bg: 'from-tertiary to-tertiary/70 bg-teal-600', text: 'text-white', badge: 'bg-white/20 text-white' },
  { bg: 'from-amber-500 to-amber-600', text: 'text-white', badge: 'bg-white/20 text-white' },
];

export default function MembershipTypesPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<MembershipType | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const isOwner = user?.role === 'owner' || user?.role === 'super_admin';

  const fetchTypes = () => {
    setLoading(true);
    api.getMembershipTypes(user?.merchant_id || '').then(t => {
      setTypes(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchTypes(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (type: MembershipType) => {
    setEditTarget(type);
    setForm({ name: type.name, description: type.description });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { addToast('error', 'Name is required'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        // Edit path — update in place (mock client supports this for name/desc)
        setTypes(prev => prev.map(t => t.id === editTarget.id ? { ...t, name: form.name, description: form.description } : t));
        addToast('success', `Membership type "${form.name}" updated`);
      } else {
        const newType = await api.createMembershipType(user?.merchant_id || '', form);
        setTypes(prev => [...prev, newType]);
        addToast('success', `Membership type "${form.name}" created`);
      }
      setShowModal(false);
      setEditTarget(null);
      setForm({ name: '', description: '' });
    } catch { addToast('error', 'Failed to save membership type'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-4xl mx-auto space-y-xl animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <h2 className="page-title">Membership Types</h2>
          <p className="page-subtitle">Create tiers like "Prime" or "Standard" and bundle offers into each.</p>
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
            return (
              <div
                key={type.id}
                className={`relative rounded-2xl overflow-hidden shadow-tonal flex flex-col hover:shadow-elevated transition-all duration-200 group`}
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
                  {type.offers && type.offers.length > 0 ? (
                    <div>
                      <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                        Bundled Offers ({type.offers.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {type.offers.slice(0, 3).map(o => (
                          <span key={o.id} className="text-[11px] px-2.5 py-1 bg-secondary-container/50 text-secondary rounded-full font-medium">
                            {o.title}
                          </span>
                        ))}
                        {type.offers.length > 3 && (
                          <span className="text-[11px] px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-full font-medium">
                            +{type.offers.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-on-surface-variant text-label-sm">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      No offers bundled yet — assign from the Offers page.
                    </div>
                  )}

                  {/* Actions */}
                  {isOwner && (
                    <button
                      onClick={() => openEdit(type)}
                      className="mt-auto py-2.5 rounded-xl border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit Type
                    </button>
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
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditTarget(null); }} title={editTarget ? 'Edit Membership Type' : 'Add Membership Type'}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Type Name *</label>
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
              rows={3}
              className="input-field h-auto py-3 resize-none"
              placeholder="Briefly describe the benefits of this tier"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          {!editTarget && (
            <p className="text-body-md text-on-surface-variant bg-surface-container rounded-xl p-3">
              💡 After creating this type, assign offers to it from the <strong>Offers</strong> page.
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowModal(false); setEditTarget(null); }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={save} disabled={saving || !form.name.trim()} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              {editTarget ? 'Save Changes' : 'Create Type'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
