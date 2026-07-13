import React, { useEffect, useState } from 'react';
import { useToastStore } from '../../store/toastStore';
import { ConfirmModal } from '../../components/ui/Modal';
import type { Merchant } from '../../types';
import * as api from '../../api';
import { format } from 'date-fns';

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
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState<Merchant | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [actioningMerchant, setActioningMerchant] = useState<string | null>(null);

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

  const toggleSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      const newStatus = suspendTarget.status === 'active' ? 'suspended' : 'active';
      const updated = await api.updateMerchantStatus(suspendTarget.id, newStatus);
      setMerchants(m => m.map(x => x.id === updated.id ? updated : x));
      addToast('success', `${suspendTarget.business_name} status updated to ${newStatus}`);
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

  const filtered = merchants.filter(m => {
    const matchesSearch =
      m.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    
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
            placeholder="Search by business name..."
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
                          {m.business_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-body-md text-on-surface">{m.business_name}</p>
                          <p className="text-label-sm text-on-surface-variant font-mono">{m.whatsapp_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{m.category}</td>
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
                    <td className="px-4 py-3 text-label-sm text-on-surface-variant">{format(new Date(m.created_at), 'dd MMM yyyy')}</td>
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
                          <button
                            onClick={() => setSuspendTarget(m)}
                            disabled={isActioning}
                            className={`text-label-md px-3 py-1 rounded-lg transition-colors font-bold border
                              ${m.status === 'active'
                                ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200'
                                : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200'}`}
                          >
                            {m.status === 'active' ? 'Suspend' : 'Reactivate'}
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
    </div>
  );
}
