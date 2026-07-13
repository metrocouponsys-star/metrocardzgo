import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { MembershipType } from '../../types';
import * as api from '../../api/client';
import { Modal } from '../../components/ui/Modal';

export default function MembershipTypesPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMembershipTypes(user?.merchant_id || '').then(t => { setTypes(t); setLoading(false); });
  }, []);

  const create = async () => {
    setSaving(true);
    try {
      const newType = await api.createMembershipType(user?.merchant_id || '', form);
      setTypes(t => [...t, newType]);
      setShowModal(false);
      setForm({ name: '', description: '' });
      addToast('success', `Membership type "${form.name}" created`);
    } catch { addToast('error', 'Failed to create membership type'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-4xl mx-auto space-y-xl animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="page-header mb-0">
          <h2 className="page-title">Membership Types</h2>
          <p className="page-subtitle">Create tiers like "Prime" or "Standard" and bundle offers into each.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Type
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-md h-48 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {types.map(type => (
            <div key={type.id} className="card p-md flex flex-col gap-md hover:shadow-elevated transition-all">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-headline-md font-headline-md text-primary">{type.name}</h3>
                  <span className="text-label-sm text-on-surface-variant">{type.member_count} members</span>
                </div>
                <p className="text-body-md text-on-surface-variant">{type.description}</p>
              </div>
              {type.offers && type.offers.length > 0 && (
                <div>
                  <p className="text-label-md font-label-md text-on-surface-variant mb-2">Bundled Offers</p>
                  <div className="flex flex-wrap gap-1">
                    {type.offers.map(o => (
                      <span key={o.id} className="text-[11px] px-2 py-0.5 bg-secondary-container/40 text-secondary rounded-full">{o.title}</span>
                    ))}
                  </div>
                </div>
              )}
              <button className="mt-auto py-2 rounded-lg border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container transition-colors flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[14px]">edit</span> Edit
              </button>
            </div>
          ))}

          {/* Add card */}
          <button
            onClick={() => setShowModal(true)}
            className="card p-md border-dashed border-2 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-low transition-colors min-h-[160px]"
          >
            <span className="material-symbols-outlined text-[36px]">add_circle</span>
            <span className="text-label-md">Add Membership Type</span>
          </button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Membership Type">
        <div className="space-y-4">
          <div>
            <label className="form-label">Type Name *</label>
            <input className="input-field" placeholder="e.g. Prime, Standard, Gold" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea rows={2} className="input-field h-auto py-3 resize-none" placeholder="Briefly describe the benefits of this tier" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <p className="text-body-md text-on-surface-variant">💡 After creating the type, assign offers to it from the Offers page.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={create} disabled={saving || !form.name} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              Create Type
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
