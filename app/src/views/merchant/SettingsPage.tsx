import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import type { Merchant, MerchantUser } from '../../types';
import * as api from '../../api';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [tab, setTab] = useState<'profile' | 'staff' | 'billing'>('profile');
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [staffList, setStaffList] = useState<MerchantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'staff' as 'staff' | 'owner' });
  const [addingStaff, setAddingStaff] = useState(false);

  const [profileForm, setProfileForm] = useState({ business_name: '', category: '', address: '', whatsapp_number: '', referral_bonus_points: 50 });

  useEffect(() => {
    Promise.all([
      api.getAllMerchants(),
      api.getMerchantUsers(user?.merchant_id || ''),
    ]).then(([merchants, staff]) => {
      const m = merchants.find(x => x.id === user?.merchant_id);
      if (m) {
        setMerchant(m);
        setProfileForm({
          business_name: m.business_name,
          category: m.category,
          address: m.address || '',
          whatsapp_number: m.whatsapp_number,
          referral_bonus_points: m.referral_bonus_points || 50
        });
      }
      setStaffList(staff);
      setLoading(false);
    });
  }, []);


  const saveProfile = async () => {
    if (!merchant) return;
    setSaving(true);
    try {
      const updated = await api.updateMerchant(merchant.id, profileForm);
      setMerchant(updated);
      addToast('success', 'Business profile updated');
    } catch { addToast('error', 'Failed to save'); }
    finally { setSaving(false); }
  };

  const addStaff = async () => {
    setAddingStaff(true);
    try {
      const newUser = await api.createMerchantUser(user?.merchant_id || '', staffForm);
      setStaffList(s => [...s, newUser]);
      setShowAddStaff(false);
      setStaffForm({ name: '', phone: '', role: 'staff' });
      addToast('success', `Staff member ${staffForm.name} added`);
    } catch { addToast('error', 'Failed to add staff'); }
    finally { setAddingStaff(false); }
  };

  const CATEGORIES = ['Salon', 'Kirana', 'Restaurant', 'Jewellery', 'Boutique', 'Optician', 'Other'];
  const TABS = [{ k: 'profile', l: 'Business Profile', icon: 'store' }, { k: 'staff', l: 'Staff Accounts', icon: 'manage_accounts' }, { k: 'billing', l: 'Plan & Billing', icon: 'payments' }] as const;

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-3xl mx-auto space-y-xl animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-outline-variant/30 gap-1">
        {TABS.map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 px-4 py-3 text-label-md font-label-md border-b-2 transition-all
              ${tab === t.k ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:bg-surface-container'}`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.l}
          </button>
        ))}
      </div>

      {/* Business Profile */}
      {tab === 'profile' && (
        <div className="card p-lg space-y-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="form-label">Business Name *</label>
              <input className="input-field" value={profileForm.business_name} onChange={e => setProfileForm(f => ({ ...f, business_name: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select className="input-field" value={profileForm.category} onChange={e => setProfileForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">WhatsApp Number</label>
              <input className="input-field" placeholder="+91 98765 43210" value={profileForm.whatsapp_number} onChange={e => setProfileForm(f => ({ ...f, whatsapp_number: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Address</label>
              <input className="input-field" placeholder="Shop address" value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Referral Bonus (Loyalty Points)</label>
              <input type="number" className="input-field" placeholder="50" value={profileForm.referral_bonus_points} onChange={e => setProfileForm(f => ({ ...f, referral_bonus_points: parseInt(e.target.value) || 0 }))} />
              <p className="text-label-sm text-on-surface-variant mt-1">Points credited to a member when their referral code is successfully applied by a new customer.</p>
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
            Save Changes
          </button>
        </div>
      )}

      {/* Staff */}
      {tab === 'staff' && (
        <div className="space-y-md">
          <div className="flex justify-end">
            <button onClick={() => setShowAddStaff(true)} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Staff
            </button>
          </div>
          <div className="card divide-y divide-outline-variant/30">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4 h-16 animate-pulse bg-surface-container" />)
            ) : staffList.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-body-lg font-bold">{u.name} {u.id === user?.id && <span className="text-label-sm text-on-surface-variant">(You)</span>}</p>
                  <p className="text-body-md text-on-surface-variant">{u.phone}</p>
                </div>
                <span className={`text-label-sm px-2 py-0.5 rounded-full capitalize ${u.role === 'owner' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container text-on-surface-variant'}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing */}
      {tab === 'billing' && (
        <div className="card p-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
            <div>
              <h3 className="text-headline-md font-headline-md text-on-surface">{merchant?.plan_tier} Plan</h3>
              <p className="text-body-md text-on-surface-variant">Active · Renews annually</p>
            </div>
          </div>
          <div className="bg-surface-container rounded-xl p-4 mb-4 space-y-2">
            {['Up to 5,000 members', 'Unlimited redemptions', 'WhatsApp + SMS campaigns', 'Reports & analytics', 'Priority support'].map(f => (
              <div key={f} className="flex items-center gap-2 text-body-md">
                <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                {f}
              </div>
            ))}
          </div>
          <a href="mailto:support@metrocardz.in" className="btn-outline flex items-center justify-center gap-2 w-full">
            <span className="material-symbols-outlined text-[18px]">upgrade</span>
            Contact Support to Upgrade
          </a>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal isOpen={showAddStaff} onClose={() => setShowAddStaff(false)} title="Add Staff Member">
        <div className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="input-field" placeholder="e.g. Priya Nair" value={staffForm.name} onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Mobile Number *</label>
            <input type="tel" className="input-field" placeholder="+91 98765 11111" value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select className="input-field" value={staffForm.role} onChange={e => setStaffForm(f => ({ ...f, role: e.target.value as any }))}>
              <option value="staff">Staff (lookup & redeem only)</option>
              <option value="owner">Owner (full access)</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddStaff(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={addStaff} disabled={addingStaff || !staffForm.name || !staffForm.phone} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {addingStaff && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              Add Staff
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
