import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../../components/ui/Modal';
import type { Merchant, MerchantUser } from '../../types';
import * as api from '../../api';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [tab, setTab] = useState<'profile' | 'staff' | 'billing' | 'integrations'>('profile');
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [staffList, setStaffList] = useState<MerchantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', email: '', role: 'staff' as 'staff' | 'owner' });
  const [addingStaff, setAddingStaff] = useState(false);
  const [walletClass, setWalletClass] = useState<any | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletSyncing, setWalletSyncing] = useState(false);

  const [profileForm, setProfileForm] = useState({ business_name: '', category: '', address: '', whatsapp_number: '', referral_bonus_points: 50 });
  const [logoUploading, setLogoUploading] = useState(false);
  const logoFileRef = React.useRef<HTMLInputElement>(null);

  /** Compress an image file to a data URL */
  async function compressImage(file: File, maxWidth = 400, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const [createdStaffCreds, setCreatedStaffCreds] = useState<{ phone: string; name: string } | null>(null);

  useEffect(() => {
    Promise.all([
      api.getMerchantProfile().catch(() => null),
      api.getMerchantUsers(user?.merchant_id || '').catch(() => []),
    ]).then(([m, staff]) => {
      if (m) {
        setMerchant(m);
        if (m.logo_url) updateUser({ logo_url: m.logo_url });
        setProfileForm({
          business_name: m.business_name || '',
          category: m.category || '',
          address: m.address || '',
          whatsapp_number: m.whatsapp_number || '',
          referral_bonus_points: m.referral_bonus_points || 50
        });
      }
      setStaffList(staff);
      setLoading(false);
    });
    // Load wallet class status async
    api.getMerchantWalletClass().then(setWalletClass).catch(() => setWalletClass(null));
  }, []);


  const saveProfile = async () => {
    if (!merchant) return;
    setSaving(true);
    try {
      const updated = await api.updateMerchant(merchant.id, profileForm);
      setMerchant(updated);
      if (updated?.business_name) {
        updateUser({ merchant_name: updated.business_name });
      }
      addToast('success', 'Business profile updated');
    } catch { addToast('error', 'Failed to save'); }
    finally { setSaving(false); }
  };

  const addStaff = async () => {
    setAddingStaff(true);
    try {
      const newUser = await api.createMerchantUser(user?.merchant_id || '', staffForm);
      setStaffList(s => [...s, newUser]);
      setCreatedStaffCreds({ phone: staffForm.phone, name: staffForm.name });
      setStaffForm({ name: '', phone: '', email: '', role: 'staff' });
      addToast('success', `Staff member ${staffForm.name} added`);
    } catch { addToast('error', 'Failed to add staff'); }
    finally { setAddingStaff(false); }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'owner' ? 'staff' : 'owner';
    try {
      await api.updateStaffRole(user?.merchant_id || '', userId, newRole);
      setStaffList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      addToast('success', 'Staff role updated successfully');
    } catch {
      addToast('error', 'Failed to update role');
    }
  };

  const removeStaff = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.deleteStaff(user?.merchant_id || '', userId);
      setStaffList(prev => prev.filter(u => u.id !== userId));
      addToast('success', 'Staff member removed');
    } catch {
      addToast('error', 'Failed to remove staff');
    }
  };

  const CATEGORIES = ['Salon', 'Kirana', 'Restaurant', 'Jewellery', 'Boutique', 'Optician', 'Other'];
  const TABS = [
    { k: 'profile', l: 'Business Profile', icon: 'store' },
    { k: 'staff', l: 'Staff Accounts', icon: 'manage_accounts' },
    { k: 'billing', l: 'Plan & Billing', icon: 'payments' },
    { k: 'integrations', l: 'Integrations', icon: 'extension' },
  ] as const;

  return (
    <div className="px-4 md:px-10 py-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="page-title">Settings</h2>
      </div>

      {/* Tab bar — PREMIUM: gold underline */}
      <div className="flex border-b border-[#E5E7EB] gap-1 overflow-x-auto hide-scrollbar">
        {TABS.map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
              ${tab === t.k
                ? 'text-[#B8941F] border-[#B8941F]'
                : 'text-[#6B7280] border-transparent hover:text-[#111111] hover:bg-[#F9FAFB]'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.l}
          </button>
        ))}
      </div>

      {/* Business Profile */}
      {tab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">

          {/* Logo Upload */}
          <div className="pb-5 border-b border-[#F3F4F6]">
            <label className="form-label mb-3">Business Logo</label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-2xl bg-[#F3F4F6] border-2 border-[#E5E7EB] flex items-center justify-center overflow-hidden flex-shrink-0">
                {merchant?.logo_url ? (
                  <img src={merchant.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[#9CA3AF] text-[32px]">store</span>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-[#6B7280]">
                  {merchant?.logo_url ? 'Logo uploaded. Click to replace.' : 'Upload your business logo. PNG or JPG, auto-compressed.'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    disabled={logoUploading}
                    className="btn-outline flex items-center gap-2 !py-1.5 !px-3 text-xs"
                    style={{ minHeight: 'auto' }}
                  >
                    {logoUploading
                      ? <><span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span> Uploading…</>
                      : <><span className="material-symbols-outlined text-[14px]">upload</span> {merchant?.logo_url ? 'Replace Logo' : 'Upload Logo'}</>
                    }
                  </button>
                  {merchant?.logo_url && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!merchant) return;
                        try {
                          const updated = await api.uploadMerchantLogo(merchant.id, '');
                          setMerchant(updated);
                          updateUser({ logo_url: '' });
                          addToast('success', 'Logo removed');
                        } catch { addToast('error', 'Failed to remove logo'); }
                      }}
                      className="text-red-600 text-xs flex items-center gap-1 hover:underline"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span> Remove
                    </button>
                  )}
                </div>
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    const mId = merchant?.id || user?.merchant_id || '';
                    if (!file || !mId) return;
                    setLogoUploading(true);
                    try {
                      const dataUrl = await compressImage(file, 400, 0.8);
                      // Optimistic instant preview & sync to global header/sidebar
                      setMerchant(prev => prev ? { ...prev, logo_url: dataUrl } : prev);
                      updateUser({ logo_url: dataUrl });
                      const updated = await api.uploadMerchantLogo(mId, dataUrl);
                      if (updated && updated.logo_url) {
                        setMerchant(updated);
                        updateUser({ logo_url: updated.logo_url });
                      }
                      addToast('success', 'Logo uploaded successfully!');
                    } catch (err) {
                      console.error('[LogoUpload] error:', err);
                      addToast('error', err instanceof Error ? err.message : 'Failed to upload logo');
                    } finally {
                      setLogoUploading(false);
                      if (logoFileRef.current) logoFileRef.current.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-xs text-[#6B7280] mt-1">Points credited to a member when their referral code is successfully applied by a new customer.</p>
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
        <div className="space-y-5">
          <div className="flex justify-end">
            <button onClick={() => setShowAddStaff(true)} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Staff
            </button>
          </div>
          <div className="card divide-y divide-outline-variant/30">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4 h-16 animate-pulse bg-[#F3F4F6]" />)
            ) : staffList.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5EDD0] flex items-center justify-center text-[#7A5C12] font-bold">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-bold">{u.name} {u.id === user?.id && <span className="text-xs text-[#6B7280]">(You)</span>}</p>
                    <p className="text-sm text-[#6B7280]">
                      {u.phone}{u.email ? ` · ${u.email}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${u.role === 'owner' ? 'bg-[#B8941F]-fixed text-white-fixed' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                    {u.role}
                  </span>
                  {u.id !== user?.id && (
                    <>
                      <button onClick={() => toggleRole(u.id, u.role)}
                        className="btn-outline !py-1 !px-2.5 text-xs" style={{ minHeight: 'auto' }} title="Change privilege role">
                        Toggle Role
                      </button>
                      <button onClick={() => removeStaff(u.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-red-200 text-red-600 hover:bg-red-600/10" title="Delete staff account">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing */}
      {tab === 'billing' && (
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-[#B8941F] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
            <div>
              <h3 className="text-xl font-headline-md text-[#111111]">{merchant?.plan_tier} Plan</h3>
              <p className="text-sm text-[#6B7280]">Active · Renews annually</p>
            </div>
          </div>
          <div className="bg-[#F3F4F6] rounded-xl p-4 mb-4 space-y-2">
            {['Up to 5,000 members', 'Unlimited redemptions', 'WhatsApp + SMS campaigns', 'Reports & analytics', 'Priority support'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[#6B7280] text-[18px]">check_circle</span>
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

      {/* Integrations Tab */}
      {tab === 'integrations' && (
        <div className="space-y-5">
          {/* Google Wallet */}
          <div className="card p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_wallet</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#111111]">Google Wallet Integration</h3>
                <p className="text-xs text-[#6B7280]">Let Android members save their membership to Google Wallet for offline access.</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                walletClass ? 'bg-green-500/10 text-green-400' : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}>
                {walletClass ? 'Configured' : 'Not Set Up'}
              </span>
            </div>

            {walletClass ? (
              <div className="bg-[#F3F4F6] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Google Class ID</span>
                  <span className="font-mono text-xs text-[#111111]">{walletClass.google_class_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Background Color</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: walletClass.background_color || '#1A1A1A' }} />
                    <span className="font-mono text-xs">{walletClass.background_color || '#1A1A1A'}</span>
                  </div>
                </div>
                <button
                  disabled={walletSyncing}
                  onClick={async () => {
                    setWalletSyncing(true);
                    try {
                      const res = await api.syncAllWalletPasses();
                      addToast('success', res.message || 'Wallet passes queued for sync');
                    } catch {
                      addToast('error', 'Failed to sync wallet passes');
                    } finally {
                      setWalletSyncing(false);
                    }
                  }}
                  className="btn-outline flex items-center gap-2 mt-3"
                >
                  {walletSyncing && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  {walletSyncing ? 'Syncing...' : 'Sync All Passes Now'}
                </button>
              </div>
            ) : (
              <div className="bg-[#F3F4F6] rounded-xl p-4 space-y-3">
                <p className="text-sm text-[#6B7280]">
                  Google Wallet requires a Google Pay & Wallet Console account and Service Account credentials. Contact Metro Cardz support to complete setup.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <a href="mailto:support@metrocardz.in?subject=Google%20Wallet%20Integration" className="btn-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    Request Setup
                  </a>
                  <a href="https://developers.google.com/wallet" target="_blank" rel="noopener noreferrer" className="btn-outline flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Developer Docs
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp */}
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-400 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#111111]">WhatsApp Campaigns (AiSensy)</h3>
                <p className="text-xs text-[#6B7280]">Bulk campaigns and auto-reminders via WhatsApp Business API.</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-green-500/10 text-green-400">Active</span>
            </div>
          </div>

          {/* SMS */}
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>sms</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#111111]">SMS OTP (Msg91)</h3>
                <p className="text-xs text-[#6B7280]">One-time password delivery for merchant login via SMS.</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-green-500/10 text-green-400">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal isOpen={showAddStaff} onClose={() => { setShowAddStaff(false); setCreatedStaffCreds(null); }} title={createdStaffCreds ? 'Staff Account Created' : 'Add Staff Member'}>
        {createdStaffCreds ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
              <span className="material-symbols-outlined text-green-600 text-[36px] mb-1">check_circle</span>
              <h4 className="font-bold text-[#111111] text-xl">Staff Added Successfully!</h4>
              <p className="text-xs text-[#6B7280] mt-1">
                Share these login details with <strong>{createdStaffCreds.name}</strong>:
              </p>
              <div className="bg-[#F3F4F6] rounded-lg p-3 mt-3 text-left font-mono text-xs space-y-1 border border-[#E5E7EB]/40">
                <p><span className="text-[#6B7280]">Login URL:</span> <strong className="text-[#B8941F]">metrocardz.in/login</strong></p>
                <p><span className="text-[#6B7280]">Mobile Number:</span> <strong className="text-[#111111]">{createdStaffCreds.phone}</strong></p>
                <p><span className="text-[#6B7280]">Default Password:</span> <strong className="text-[#111111]">{createdStaffCreds.phone.replace(/\s/g, '')}</strong></p>
              </div>
              <p className="text-xs text-[#6B7280] mt-2">
                Staff can sign in on the login page using Mobile Number + Default Password.
              </p>
            </div>
            <button
              onClick={() => {
                setCreatedStaffCreds(null);
                setShowAddStaff(false);
              }}
              className="btn-primary w-full"
            >
              Done
            </button>
          </div>
        ) : (
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
              <label className="form-label">Email Address (Optional)</label>
              <input type="email" className="input-field" placeholder="e.g. priya@metrocardz.in" value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} />
              <p className="text-xs text-[#6B7280] mt-1">Allows the staff member to log in using their email address.</p>
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
        )}
      </Modal>
    </div>
  );
}


