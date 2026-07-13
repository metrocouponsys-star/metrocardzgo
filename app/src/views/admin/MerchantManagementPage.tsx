import React, { useEffect, useState } from 'react';
import { useToastStore } from '../../store/toastStore';
import { ConfirmModal } from '../../components/ui/Modal';
import type { Merchant } from '../../types';
import * as api from '../../api/client';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  active: { cls: 'bg-secondary-container text-secondary', label: 'Active' },
  suspended: { cls: 'bg-error-container text-on-error-container', label: 'Suspended' },
};

export default function MerchantManagementPage() {
  const { addToast } = useToastStore();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState<Merchant | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { api.getAllMerchants().then(m => { setMerchants(m); setLoading(false); }); }, []);

  const toggleSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    try {
      const newStatus = suspendTarget.status === 'active' ? 'suspended' : 'active';
      const updated = await api.updateMerchantStatus(suspendTarget.id, newStatus);
      setMerchants(m => m.map(x => x.id === updated.id ? updated : x));
      addToast('success', `${suspendTarget.business_name} ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`);
      setSuspendTarget(null);
    } catch { addToast('error', 'Action failed'); }
    finally { setSuspending(false); }
  };

  const filtered = merchants.filter(m =>
    m.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <h2 className="page-title">Merchant Management</h2>
          <p className="page-subtitle">Create, view, and manage all merchant accounts on the platform.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Merchant
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
        <input
          className="input-field pl-10"
          placeholder="Search by business name or category..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low">
              <tr>
                {['Business', 'Category', 'Plan', 'Members', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-container rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map(m => {
                const status = STATUS_CONFIG[m.status];
                return (
                  <tr key={m.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
                          {m.business_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-body-md">{m.business_name}</p>
                          <p className="text-label-sm text-on-surface-variant">{m.whatsapp_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{m.category}</td>
                    <td className="px-4 py-3"><span className="text-label-sm bg-primary-fixed/20 text-primary px-2 py-0.5 rounded-full">{m.plan_tier}</span></td>
                    <td className="px-4 py-3 text-body-md">{m.member_count?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-label-sm px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-label-sm text-on-surface-variant">{format(new Date(m.created_at), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSuspendTarget(m)}
                        className={`text-label-md px-3 py-1 rounded-lg transition-colors
                          ${m.status === 'active' ? 'text-error hover:bg-error-container' : 'text-secondary hover:bg-secondary-container'}`}
                      >
                        {m.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
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
        title={suspendTarget?.status === 'active' ? 'Suspend Merchant' : 'Reactivate Merchant'}
        isLoading={suspending}
        danger={suspendTarget?.status === 'active'}
        confirmLabel={suspendTarget?.status === 'active' ? 'Suspend' : 'Reactivate'}
        description={
          suspendTarget?.status === 'active'
            ? `Suspending "${suspendTarget?.business_name}" will immediately block all their staff sessions and disable the merchant panel. This is logged to the audit trail.`
            : `Reactivating "${suspendTarget?.business_name}" will restore their full access to the platform.`
        }
      />
    </div>
  );
}
