import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Modal } from '../../components/ui/Modal';
import type { Merchant, MerchantUser } from '../../types';
import * as api from '../../api';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [tab, setTab] = useState<'profile' | 'staff' | 'billing' | 'agreement' | 'integrations'>('profile');
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

  const CATEGORIES = [
    'Mobile',
    'Mobile & Accessories',
    'Mobile & Electronics',
    'Salon & Spa',
    'Restaurant',
    'Cafe',
    'Boutique',
    'Readymade Garments',
    'Dental / Skin Clinic',
    'Supermarket & Kirana',
    'Travel & Tourism',
    'Gym & Fitness',
    'Optician & Eyewear',
    'Footwear & Leather',
    'Jewellery',
    'Automobile',
    'Insurance',
    'Real Estate',
    'Other',
  ];
  const TABS = [
    { k: 'profile', l: 'Business Profile', icon: 'store' },
    { k: 'staff', l: 'Staff Accounts', icon: 'manage_accounts' },
    { k: 'billing', l: 'Starter Plan & Validity', icon: 'payments' },
    { k: 'agreement', l: 'Policy = Bond - Agreement', icon: 'gavel' },
    { k: 'integrations', l: 'Integrations', icon: 'extension' },
  ] as const;

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your business profile, staff, and integrations.</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-outline-variant/30 gap-1">
        {TABS.map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-bold border-b-2 transition-all
              ${tab === t.k ? 'text-accent border-accent' : 'text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[16px]" style={tab === t.k ? { fontVariationSettings: "'FILL' 1" } : undefined}>{t.icon}</span>
            {t.l}
          </button>
        ))}
      </div>

      {/* Business Profile */}
      {tab === 'profile' && (
        <div className="card p-lg space-y-md">

          {/* Logo Upload */}
          <div className="pb-md border-b border-outline-variant/30">
            <label className="form-label mb-3">Business Logo</label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-2xl bg-surface-container border-2 border-outline-variant flex items-center justify-center overflow-hidden flex-shrink-0">
                {merchant?.logo_url ? (
                  <img src={merchant.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant text-[32px]">store</span>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-body-sm text-on-surface-variant">
                  {merchant?.logo_url ? 'Logo uploaded. Click to replace.' : 'Upload your business logo. PNG or JPG, auto-compressed.'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    disabled={logoUploading}
                    className="btn-outline flex items-center gap-2 !py-1.5 !px-3 text-label-sm"
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
                      className="text-error text-label-sm flex items-center gap-1 hover:underline"
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
              <div key={u.id} className="flex items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-body-lg font-bold">{u.name} {u.id === user?.id && <span className="text-label-sm text-on-surface-variant">(You)</span>}</p>
                    <p className="text-body-md text-on-surface-variant">
                      {u.phone}{u.email ? ` · ${u.email}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-label-sm px-2 py-0.5 rounded-full capitalize ${u.role === 'owner' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container text-on-surface-variant'}`}>
                    {u.role}
                  </span>
                  {u.id !== user?.id && (
                    <>
                      <button onClick={() => toggleRole(u.id, u.role)}
                        className="btn-outline !py-1 !px-2.5 text-label-sm" style={{ minHeight: 'auto' }} title="Change privilege role">
                        Toggle Role
                      </button>
                      <button onClick={() => removeStaff(u.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-error/30 text-error hover:bg-error/10" title="Delete staff account">
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

      {/* Billing & Software Validity */}
      {tab === 'billing' && (() => {
        const start = merchant?.created_at ? new Date(merchant.created_at) : new Date();
        const expiry = new Date(start);
        expiry.setMonth(expiry.getMonth() + 16);
        expiry.setDate(expiry.getDate() + 5);
        const now = new Date();
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = diffDays <= 0;

        return (
          <div className="card p-lg space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-on-primary shrink-0">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-headline-md font-bold text-on-surface">{merchant?.plan_tier || 'Starter'} Plan</h3>
                  <span className={`text-label-xs px-2.5 py-0.5 rounded-full font-bold ${
                    isExpired ? 'bg-error-container text-on-error-container' : 'bg-primary-container/40 text-primary'
                  }`}>
                    {isExpired ? 'Expired' : 'Active SaaS License'}
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-0.5">Commercial Software License, Validity & Allocated Cards</p>
              </div>
            </div>

            {/* Software Validity Details (16 Months, 5 Days) */}
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3 flex-wrap gap-2">
                <div>
                  <p className="text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">License Validity Period</p>
                  <p className="text-headline-sm font-black text-primary mt-0.5">16 Months, 5 Days</p>
                </div>
                <div>
                  <p className="text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">Software Charges</p>
                  <p className="text-headline-sm font-black text-on-surface mt-0.5">₹4,999 <span className="text-label-xs font-medium text-on-surface-variant">/ term</span></p>
                </div>
                <div className="text-right">
                  <p className="text-label-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</p>
                  <p className={`text-body-md font-bold ${isExpired ? 'text-error' : 'text-emerald-700'}`}>
                    {isExpired ? 'License Expired' : `${diffDays} Days Remaining`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-body-sm">
                <div className="p-3 rounded-xl bg-surface border border-outline-variant/30">
                  <span className="text-label-xs text-on-surface-variant block">Activation Date</span>
                  <strong className="text-on-surface">{start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-outline-variant/30">
                  <span className="text-label-xs text-on-surface-variant block">Valid Until (Auto-Close)</span>
                  <strong className="text-on-surface text-primary">{expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-outline-variant/30">
                  <span className="text-label-xs text-on-surface-variant block">Card Allocation</span>
                  <strong className="text-on-surface text-secondary">500 Physical Cards</strong>
                </div>
              </div>

              {/* Automatic Closure Banner */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-amber-900">
                <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">lock_clock</span>
                <p className="text-label-sm leading-relaxed">
                  <strong>Automatic Expiration Policy:</strong> This software is provided under a fixed validity of <strong>16 months and 5 days</strong>. Upon reaching the expiry date, merchant system access and card scanning services will automatically close unless renewed in advance.
                </p>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-4 space-y-2">
              <p className="text-label-xs font-bold text-on-surface uppercase tracking-wider mb-1">Included in Starter Plan License</p>
              {[
                'Digital Membership Pass & Real-Time Balance Check',
                '16 Months 5 Days Cloud Hosting & 99.9% Uptime SLA',
                '500 Pre-allocated QR/NFC Physical Membership Cards',
                'Unlimited Customer Directory & Registered Member Records',
                'Custom Point Rule = Set Point Configuration',
                'Upcoming Birthday & Anniversary Campaign Auto-Wishes',
                'Metro Cardz Brand Co-Marketing & Discovery Network'
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-body-md">
                  <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                  {f}
                </div>
              ))}
            </div>

            <a href="mailto:support@metrocardz.in?subject=Software%20License%20Renewal" className="btn-outline flex items-center justify-center gap-2 w-full">
              <span className="material-symbols-outlined text-[18px]">contact_support</span>
              Contact Support for Extension or Renewal
            </a>
          </div>
        );
      })()}

      {/* Policy = Bond - Agreement Tab */}
      {tab === 'agreement' && (
        <div className="card p-lg space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-outline-variant/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-300 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              </div>
              <div>
                <h3 className="text-headline-sm font-bold text-on-surface">Policy = Bond - Agreement</h3>
                <p className="text-label-sm text-on-surface-variant">Merchant Service Legal Bond & SaaS Operating Terms</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                Bond Active & Enforceable
              </span>
              <button
                onClick={() => window.print()}
                className="btn-outline !py-1.5 !px-3 text-label-sm flex items-center gap-1.5"
                style={{ minHeight: 'auto' }}
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                Print Agreement
              </button>
            </div>
          </div>

          {/* Bond Document Box */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-6 space-y-5 text-on-surface font-sans">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <div>
                <p className="font-mono text-xs font-bold text-amber-700 uppercase tracking-widest">Bond Ref: MC-SLA-BOND-2024</p>
                <p className="text-body-sm font-bold text-on-surface mt-0.5">Service Level Agreement & Merchant Guarantee Bond</p>
              </div>
              <div className="text-right text-label-xs text-on-surface-variant font-mono">
                Jurisdiction: Commercial Courts of India
              </div>
            </div>

            <div className="space-y-4 text-body-sm leading-relaxed">
              <div className="p-3 bg-white rounded-xl border border-outline-variant/40">
                <h4 className="font-bold text-on-surface text-[14px] mb-1">1. Parties & SaaS Platform Authorization</h4>
                <p className="text-on-surface-variant text-xs">
                  This Agreement and Performance Bond is entered into between <strong>Metro Cardz SaaS Platform</strong> ("Service Provider") and <strong>{merchant?.business_name || profileForm.business_name || 'Merchant Partner'}</strong> ("Merchant"). The Merchant is granted an authorized license to utilize the digital loyalty ecosystem, card verification APIs, and member pass portal.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-outline-variant/40">
                <h4 className="font-bold text-on-surface text-[14px] mb-1">2. Software Validity Bond (16 Months, 5 Days)</h4>
                <p className="text-on-surface-variant text-xs">
                  The SaaS software license is issued for a guaranteed validity period of <strong>16 months and 5 days</strong> from activation. Service Provider warrants a 99.9% uptime SLA. In accordance with mutual terms, automatic software closure and renewal reminders shall take effect upon term expiry unless renewed.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-outline-variant/40">
                <h4 className="font-bold text-on-surface text-[14px] mb-1">3. Physical Cards Allocation & Stack Order Policy</h4>
                <p className="text-on-surface-variant text-xs">
                  All pre-printed NFC and QR-encoded physical membership cards allocated to the Merchant remain serial-tracked inventory. Cards must be assigned sequentially to registered members. Replacement of defective or lost blank cards is provided under warranty within 14 business days.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-outline-variant/40">
                <h4 className="font-bold text-on-surface text-[14px] mb-1">4. Data Privacy, Customer Confidentiality & DPDP Compliance</h4>
                <p className="text-on-surface-variant text-xs">
                  Customer records (including phone numbers, birth dates, and purchase transaction history) are held in strict compliance with the Digital Personal Data Protection (DPDP) Act. All customer data is the exclusive proprietary property of the Merchant and shall never be shared or cross-marketed to competitors.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-outline-variant/40">
                <h4 className="font-bold text-on-surface text-[14px] mb-1">5. Loyalty Point Rule Guarantee & Redemption Bond</h4>
                <p className="text-on-surface-variant text-xs">
                  The Merchant covenants to honor points and promotional vouchers issued through the system in good faith as per the active Point Rule (Set Point) schedule configured on the merchant portal.
                </p>
              </div>
            </div>

            {/* Signatures & Execution Seal */}
            <div className="pt-4 border-t border-outline-variant/30 grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-surface border border-outline-variant/30 text-xs">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Authorized Service Provider</p>
                <p className="font-bold text-on-surface">Metro Cardz Technologies</p>
                <p className="text-[11px] text-emerald-700 font-bold mt-1">✓ Digitally Signed & Stamped</p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-outline-variant/30 text-xs">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Merchant Partner</p>
                <p className="font-bold text-on-surface">{merchant?.business_name || profileForm.business_name || 'Partner Merchant'}</p>
                <p className="text-[11px] text-emerald-700 font-bold mt-1">✓ Verified Account Holder</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {tab === 'integrations' && (
        <div className="space-y-md">
          {/* Google Wallet */}
          <div className="card p-lg space-y-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_wallet</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-on-surface">Google Wallet Integration</h3>
                <p className="text-body-sm text-on-surface-variant">Let Android members save their membership to Google Wallet for offline access.</p>
              </div>
              <span className={`text-label-sm px-2.5 py-1 rounded-full font-bold ${
                walletClass ? 'bg-green-500/10 text-green-400' : 'bg-surface-container text-on-surface-variant'
              }`}>
                {walletClass ? 'Configured' : 'Not Set Up'}
              </span>
            </div>

            {walletClass ? (
              <div className="bg-surface-container rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm text-on-surface-variant">Google Class ID</span>
                  <span className="font-mono text-body-sm text-on-surface">{walletClass.google_class_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label-sm text-on-surface-variant">Background Color</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: walletClass.background_color || '#1A1A1A' }} />
                    <span className="font-mono text-body-sm">{walletClass.background_color || '#1A1A1A'}</span>
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
              <div className="bg-surface-container rounded-xl p-4 space-y-3">
                <p className="text-body-md text-on-surface-variant">
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
          <div className="card p-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-400 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-on-surface">WhatsApp Campaigns (AiSensy)</h3>
                <p className="text-body-sm text-on-surface-variant">Bulk campaigns and auto-reminders via WhatsApp Business API.</p>
              </div>
              <span className="text-label-sm px-2.5 py-1 rounded-full font-bold bg-green-500/10 text-green-400">Active</span>
            </div>
          </div>

          {/* SMS */}
          <div className="card p-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400 text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>sms</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-on-surface">SMS OTP (Msg91)</h3>
                <p className="text-body-sm text-on-surface-variant">One-time password delivery for merchant login via SMS.</p>
              </div>
              <span className="text-label-sm px-2.5 py-1 rounded-full font-bold bg-green-500/10 text-green-400">Active</span>
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
              <h4 className="font-bold text-on-surface text-headline-md">Staff Added Successfully!</h4>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Share these login details with <strong>{createdStaffCreds.name}</strong>:
              </p>
              <div className="bg-surface-container rounded-lg p-3 mt-3 text-left font-mono text-body-sm space-y-1 border border-outline-variant/40">
                <p><span className="text-on-surface-variant">Login URL:</span> <strong className="text-primary">metrocardz.in/login</strong></p>
                <p><span className="text-on-surface-variant">Mobile Number:</span> <strong className="text-on-surface">{createdStaffCreds.phone}</strong></p>
                <p><span className="text-on-surface-variant">Default Password:</span> <strong className="text-on-surface">{createdStaffCreds.phone.replace(/\s/g, '')}</strong></p>
              </div>
              <p className="text-label-sm text-on-surface-variant mt-2">
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
              <p className="text-label-sm text-on-surface-variant mt-1">Allows the staff member to log in using their email address.</p>
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
