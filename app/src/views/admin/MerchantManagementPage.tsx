import React, { useEffect, useState } from 'react';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { ConfirmModal, Modal } from '../../components/ui/Modal';
import type { Merchant } from '../../types';
import * as api from '../../api';
import { safeFormat } from '../../lib/dateUtils';

const STATUS_CONFIG = {
  active: { cls: 'bg-green-100 text-green-800 border-green-200', label: 'Active' },
  suspended: { cls: 'bg-red-100 text-red-800 border-red-200', label: 'Suspended' },
};

const APPROVAL_CONFIG = {
  approved: { cls: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
  pending: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending Approval' },
  rejected: { cls: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
};

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

export default function MerchantManagementPage() {
  const { addToast } = useToastStore();
  const { impersonate } = useAuthStore();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState<Merchant | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Edit merchant state
  const [editTarget, setEditTarget] = useState<Merchant | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    category: '',
    plan_tier: 'Starter',
    whatsapp_number: '',
    address: '',
    referral_bonus_points: 50,
  });

  // Delete merchant state
  const [deleteTarget, setDeleteTarget] = useState<Merchant | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actioningMerchant, setActioningMerchant] = useState<string | null>(null);

  // Creation form state
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [planTier, setPlanTier] = useState('Starter');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const data = await api.getAllMerchants();
      setMerchants(data);
    } catch {
      addToast('error', 'Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !category.trim() || !ownerName.trim() || !ownerPhone.trim()) {
      addToast('error', 'Please fill in all required fields');
      return;
    }
    setCreateLoading(true);
    try {
      const newMerchant = await api.createMerchant({
        business_name: businessName.trim(),
        category: category.trim(),
        plan_tier: planTier,
        whatsapp_number: whatsappNumber.trim(),
        address: address.trim() || undefined,
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim().replace(/\s+/g, ''),
        owner_email: ownerEmail.trim() || undefined,
      });
      setMerchants(prev => [newMerchant, ...prev]);
      addToast('success', `${businessName} added to the platform successfully`);
      setCreateOpen(false);
      // Reset form
      setBusinessName('');
      setCategory('');
      setPlanTier('Starter');
      setWhatsappNumber('');
      setAddress('');
      setOwnerName('');
      setOwnerPhone('');
      setOwnerEmail('');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create merchant');
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      const newStatus = suspendTarget.status === 'active' ? 'suspended' : 'active';
      const updated = await api.updateMerchantStatus(suspendTarget.id, newStatus);
      setMerchants(m => m.map(x => x.id === updated.id ? updated : x));
      addToast('success', newStatus === 'suspended'
        ? `${suspendTarget.business_name} has been suspended — all staff logins disabled`
        : `${suspendTarget.business_name} is now active — staff can log in again`);
      setSuspendTarget(null);
    } catch {
      addToast('error', 'Action failed');
    } finally {
      setSuspending(false);
    }
  };

  const handleApprove = async (mId: string) => {
    setActioningMerchant(mId);
    try {
      const updated = await api.approveMerchant(mId);
      setMerchants(m => m.map(x => x.id === mId ? updated : x));
      addToast('success', 'Merchant approved successfully');
    } catch (e: any) {
      addToast('error', e.message || 'Approval failed');
    } finally {
      setActioningMerchant(null);
    }
  };

  const handleReject = async (mId: string) => {
    setActioningMerchant(mId);
    try {
      const updated = await api.rejectMerchant(mId);
      setMerchants(m => m.map(x => x.id === mId ? updated : x));
      addToast('success', 'Merchant rejected');
    } catch (e: any) {
      addToast('error', e.message || 'Action failed');
    } finally {
      setActioningMerchant(null);
    }
  };

  // ── Edit merchant ────────────────────────────────────────────────────────────
  const openEditModal = (merchant: Merchant) => {
    setEditForm({
      business_name: merchant.business_name || '',
      category: (merchant as any).category || '',
      plan_tier: (merchant as any).plan_tier || 'Starter',
      whatsapp_number: merchant.whatsapp_number || '',
      address: (merchant as any).address || '',
      referral_bonus_points: Number((merchant as any).referral_bonus_points ?? 50),
    });
    setEditTarget(merchant);
  };

  const handleEditMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.business_name.trim()) {
      addToast('error', 'Business name is required');
      return;
    }
    setEditLoading(true);
    try {
      const updated = await api.updateMerchant(editTarget.id, editForm);
      setMerchants(m => m.map(x => x.id === updated.id ? { ...x, ...updated } : x));
      addToast('success', `${updated.business_name || editForm.business_name} details updated successfully`);
      setEditTarget(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update merchant — please try again');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete merchant ──────────────────────────────────────────────────────────
  const handleDeleteMerchant = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.deleteMerchant(deleteTarget.id);
      setMerchants(m => m.filter(x => x.id !== deleteTarget.id));
      addToast('success', `${deleteTarget.business_name} has been permanently removed from the platform`);
      setDeleteTarget(null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete merchant — please try again');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = merchants.filter(m => {
    const q = (searchQuery || '').trim().toLowerCase();
    const bName = (m.business_name || '').toLowerCase();
    const cat = (m.category || '').toLowerCase();
    const phone = (m.whatsapp_number || '').replace(/\D/g, '');
    const address = (m.address || '').toLowerCase();
    const matchesSearch = !q || bName.includes(q) || cat.includes(q) || phone.includes(q) || address.includes(q);
    
    const approvalStatus = m.approval_status || 'approved'; // default safety
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && approvalStatus === activeTab;
  });

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <h2 className="page-title">Merchant Management</h2>
          <p className="page-subtitle">Onboard, approve, and suspend merchant accounts on the platform.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary flex items-center gap-2 h-10 px-4"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add Merchant
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-outline-variant/30 pb-2">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {([
            { id: 'all', label: 'All Merchants' },
            { id: 'pending', label: `Pending (${merchants.filter(m => m.approval_status === 'pending').length})` },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-label-md font-label-md rounded-lg transition-all whitespace-nowrap
                ${activeTab === t.id ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            className="input-field pl-9 h-10 text-body-sm"
            placeholder="Search merchant, phone, category (e.g. Kanku Jewellers)..."
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
                {['Business Details', 'Category', 'Tier', 'Enrolled Members', 'Approval Status', 'System Status', 'Registered On', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-container rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">
                    No merchants found matching the filter criteria.
                  </td>
                </tr>
              ) : filtered.map(m => {
                const status = STATUS_CONFIG[m.status] || STATUS_CONFIG.active;
                const approval = APPROVAL_CONFIG[m.approval_status as 'approved' | 'pending' | 'rejected'] || APPROVAL_CONFIG.approved;
                const isActioning = actioningMerchant === m.id;

                return (
                  <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-headline-sm">
                          {(m.business_name || 'M').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-body-md text-on-surface">{m.business_name || 'Unnamed Merchant'}</p>
                          <p className="text-label-sm text-on-surface-variant font-mono">{m.whatsapp_number || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{m.category || 'General'}</td>
                    <td className="px-4 py-3">
                      <span className="text-label-sm bg-primary-container/30 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{m.plan_tier}</span>
                    </td>
                    <td className="px-4 py-3 text-body-md font-semibold">{m.member_count?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-label-sm px-2.5 py-0.5 rounded-full border ${approval.cls}`}>{approval.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-label-sm px-2.5 py-0.5 rounded-full border ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-label-sm text-on-surface-variant">{safeFormat(m.created_at, 'dd MMM yyyy', '—')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.approval_status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(m.id)}
                              disabled={isActioning}
                              className="text-label-sm bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded-lg transition-colors font-bold disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(m.id)}
                              disabled={isActioning}
                              className="text-label-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-lg transition-colors font-bold disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <div className="flex gap-1.5 items-center flex-wrap">
                            {/* Allocate Cards */}
                            <a
                              href={`/portal/admin/inventory?merchant=${m.id}`}
                              className="text-label-sm bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg transition-all font-bold inline-flex items-center gap-1 min-h-[36px]"
                              title="Allocate Physical Cards to Merchant"
                            >
                              <span className="material-symbols-outlined text-[14px]">credit_card</span>
                              Allocate Cards
                            </a>
                            {/* Edit Merchant */}
                            <button
                              onClick={() => openEditModal(m)}
                              disabled={isActioning}
                              className="text-label-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-all font-bold inline-flex items-center gap-1 min-h-[36px] disabled:opacity-40"
                              title="Edit merchant details"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              Edit
                            </button>
                            {/* Suspend / Reactivate */}
                            <button
                              onClick={() => setSuspendTarget(m)}
                              disabled={isActioning}
                              className={`text-label-sm px-2.5 py-1.5 rounded-lg transition-all font-bold border min-h-[36px] disabled:opacity-40
                                ${m.status === 'active'
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                  : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200'}`}
                            >
                              {m.status === 'active' ? 'Suspend' : 'Reactivate'}
                            </button>
                            {/* Impersonate */}
                            {m.status === 'active' && (
                              <button
                                onClick={() => { impersonate(m.id, m.business_name); addToast('success', `Now viewing as ${m.business_name}`); }}
                                className="text-label-sm bg-primary text-white hover:bg-primary-dark px-2.5 py-1.5 rounded-lg transition-all font-bold shadow-sm min-h-[36px]"
                              >
                                Impersonate
                              </button>
                            )}
                            {/* Delete Merchant */}
                            <button
                              onClick={() => setDeleteTarget(m)}
                              disabled={isActioning}
                              className="text-label-sm bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-all font-bold inline-flex items-center gap-1 min-h-[36px] disabled:opacity-40"
                              title="Permanently delete this merchant"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={toggleSuspend}
        title={suspendTarget?.status === 'active' ? 'Suspend Merchant Account' : 'Reactivate Merchant Account'}
        isLoading={suspending}
        danger={suspendTarget?.status === 'active'}
        confirmLabel={suspendTarget?.status === 'active' ? 'Suspend' : 'Reactivate'}
        description={
          suspendTarget?.status === 'active'
            ? `Suspending "${suspendTarget?.business_name}" will block all active login sessions for their owner/staff partners and immediately disable redemptions for their customers.`
            : `Reactivating "${suspendTarget?.business_name}" will immediately restore full portal access for the merchant.`
        }
      />

      {/* ── Edit Merchant Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => !editLoading && setEditTarget(null)}
        title={`Edit Merchant — ${editTarget?.business_name || ''}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditMerchant} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="md:col-span-2">
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Business Name *</label>
              <input
                type="text"
                required
                value={editForm.business_name}
                onChange={e => setEditForm(f => ({ ...f, business_name: e.target.value }))}
                className="input-field h-11 text-body-sm"
                placeholder="e.g. Glamour Salon"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Industry Category</label>
              <select
                value={editForm.category}
                onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                className="input-field h-11 text-body-sm bg-surface"
              >
                <option value="">Select category...</option>
                {['Salon', 'Restaurant', 'Retail', 'Gym', 'Healthcare', 'Groceries',
                  'Jewellery', 'Pharmacy', 'Electronics', 'Education', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Plan Tier</label>
              <select
                value={editForm.plan_tier}
                onChange={e => setEditForm(f => ({ ...f, plan_tier: e.target.value }))}
                className="input-field h-11 text-body-sm bg-surface"
              >
                <option value="Starter">Starter</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">WhatsApp Number</label>
              <input
                type="text"
                value={editForm.whatsapp_number}
                onChange={e => setEditForm(f => ({ ...f, whatsapp_number: e.target.value }))}
                className="input-field h-11 text-body-sm"
                placeholder="e.g. 919876543210"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Referral Bonus Points</label>
              <input
                type="number"
                min={0}
                max={10000}
                value={editForm.referral_bonus_points}
                onChange={e => setEditForm(f => ({ ...f, referral_bonus_points: Number(e.target.value) }))}
                className="input-field h-11 text-body-sm"
                placeholder="50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Address / Location</label>
              <input
                type="text"
                value={editForm.address}
                onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                className="input-field h-11 text-body-sm"
                placeholder="e.g. 123 Main Street, Mumbai"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              className="btn-secondary h-11 px-5"
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="btn-primary flex items-center gap-2 h-11 px-6 font-bold"
            >
              {editLoading && (
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              )}
              {editLoading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Merchant Confirm Modal ────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={handleDeleteMerchant}
        title="Delete Merchant Account"
        isLoading={deleteLoading}
        danger={true}
        confirmLabel={deleteLoading ? 'Deleting...' : 'Yes, Delete Merchant'}
        description={
          `This will permanently remove "${deleteTarget?.business_name}" and disable all associated ` +
          `member passes, cards, and redemptions. All ${(deleteTarget as any)?._count?.members ?? (deleteTarget as any)?.member_count ?? 0} ` +
          `enrolled members will lose access to their loyalty cards. This action cannot be undone.`
        }
      />

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add New Merchant" maxWidth="max-w-lg">
        <form onSubmit={handleCreateMerchant} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Info */}
            <div className="space-y-3 md:col-span-2">
              <h4 className="text-body-md font-bold text-primary border-b border-outline-variant/30 pb-1">Business Details</h4>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Business Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. Glamour Salon"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Category *</label>
              <input
                type="text"
                required
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Salon, Groceries"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Plan Tier *</label>
              <select
                value={planTier}
                onChange={e => setPlanTier(e.target.value)}
                className="input-field h-10 text-body-sm bg-surface"
              >
                <option value="Starter">Starter</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">WhatsApp Number *</label>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 919876543210"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Main Street"
                className="input-field h-10 text-body-sm"
              />
            </div>

            {/* Owner Info */}
            <div className="space-y-3 md:col-span-2 mt-2">
              <h4 className="text-body-md font-bold text-primary border-b border-outline-variant/30 pb-1">Owner Account Details</h4>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Owner Name *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="Owner's full name"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Owner Phone * (For Login)</label>
              <input
                type="text"
                required
                value={ownerPhone}
                onChange={e => setOwnerPhone(e.target.value)}
                placeholder="Owner's phone number"
                className="input-field h-10 text-body-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-label-sm text-on-surface-variant mb-1 font-medium">Owner Email (For Google/Email Login)</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={e => setOwnerEmail(e.target.value)}
                placeholder="owner@example.com"
                className="input-field h-10 text-body-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary h-10 px-4" disabled={createLoading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="btn-primary flex items-center gap-2 h-10 px-6 font-bold"
            >
              {createLoading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
              Save Merchant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
