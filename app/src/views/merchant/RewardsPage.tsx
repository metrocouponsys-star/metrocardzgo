import React, { useEffect, useState } from 'react';
import * as api from '../../api';
import { Modal } from '../../components/ui/Modal';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import type { Member } from '../../types';

type Tab = 'catalog' | 'coupons' | 'vouchers' | 'points_rules';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'catalog',      label: 'Reward Catalog',  icon: 'card_giftcard' },
  { key: 'coupons',      label: 'Coupon Codes',     icon: 'confirmation_number' },
  { key: 'vouchers',     label: 'Gift Vouchers',    icon: 'wallet' },
  { key: 'points_rules', label: 'Points Rules',     icon: 'bolt' },
];

export default function RewardsPage() {
  const [tab, setTab] = useState<Tab>('catalog');

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-5xl mx-auto space-y-xl animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>card_giftcard</span>
          Rewards & Loyalty
        </h2>
        <p className="page-subtitle">Manage your reward catalog, coupon codes, gift vouchers, and loyalty points rules.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex bg-surface-container rounded-2xl p-1.5 gap-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-medium transition-all whitespace-nowrap
              ${tab === t.key
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'catalog'      && <RewardCatalogTab />}
      {tab === 'coupons'      && <CouponsTab />}
      {tab === 'vouchers'     && <VouchersTab />}
      {tab === 'points_rules' && <PointsRulesTab />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REWARD CATALOG TAB
// ─────────────────────────────────────────────────────────────────────────────
function RewardCatalogTab() {
  const { addToast } = useToastStore();
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '', points_cost: '', quantity_available: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.getRewards().then(setRewards).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditTarget(null); setForm({ name: '', description: '', points_cost: '', quantity_available: '' }); setShowModal(true); };
  const openEdit = (r: any) => { setEditTarget(r); setForm({ name: r.name, description: r.description, points_cost: String(r.points_cost), quantity_available: r.quantity_available != null ? String(r.quantity_available) : '' }); setShowModal(true); };

  const save = async () => {
    if (!form.name || !form.points_cost) { addToast('error', 'Name and points cost are required'); return; }
    setSaving(true);
    try {
      const data: any = { name: form.name, description: form.description, points_cost: Number(form.points_cost) };
      if (form.quantity_available) data.quantity_available = Number(form.quantity_available);
      if (editTarget) await api.updateReward(editTarget.id, data);
      else await api.createReward(data);
      addToast('success', editTarget ? 'Reward updated' : 'Reward created');
      setShowModal(false); setEditTarget(null);
      setForm({ name: '', description: '', points_cost: '', quantity_available: '' });
      load();
    } catch { addToast('error', 'Failed to save reward'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (r: any) => {
    await api.updateReward(r.id, { is_active: !r.is_active }).catch(() => {});
    load();
  };

  const remove = async (id: string) => {
    await api.deleteReward(id).catch(() => {});
    addToast('success', 'Reward deleted');
    load();
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">Members redeem loyalty points for these rewards at checkout.</p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Reward
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-44 animate-pulse" />)}
        </div>
      ) : rewards.length === 0 ? (
        <div className="card p-lg flex flex-col items-center text-center py-16">
          <div className="w-20 h-20 bg-secondary-container/30 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-secondary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>card_giftcard</span>
          </div>
          <h3 className="text-headline-md font-bold mb-2">No rewards yet</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mb-6">Create redeemable rewards so your members can spend their loyalty points on something they love.</p>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create First Reward
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {rewards.map(r => (
            <div key={r.id} className={`card p-md flex flex-col gap-3 transition-all hover:shadow-elevated ${!r.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-headline-sm font-bold text-on-surface truncate">{r.name}</h3>
                  <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{r.description}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl font-bold text-label-sm flex-shrink-0 ${r.is_active ? 'bg-secondary-container text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
                  {Number(r.points_cost).toFixed(0)} pts
                </div>
              </div>

              <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                {r.quantity_available != null ? `${r.quantity_available} remaining` : 'Unlimited stock'}
                <span className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2 pt-1 border-t border-outline-variant/20">
                <button onClick={() => openEdit(r)} className="flex-1 btn-outline text-label-sm py-1.5 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Edit
                </button>
                <button onClick={() => toggleActive(r)} className="flex-1 py-1.5 rounded-xl border border-outline-variant text-on-surface-variant text-label-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">{r.is_active ? 'pause_circle' : 'play_circle'}</span>
                  {r.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => remove(r.id)} className="p-1.5 rounded-xl text-error hover:bg-error-container transition-colors" title="Delete reward">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}

          <button onClick={openCreate} className="card border-dashed border-2 border-outline-variant/50 flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:bg-surface-container-low hover:border-primary hover:text-primary transition-all min-h-[180px] rounded-2xl">
            <span className="material-symbols-outlined text-[28px]">add_circle</span>
            <span className="text-label-md font-bold">Add Reward</span>
          </button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditTarget(null); }} title={editTarget ? 'Edit Reward' : 'New Reward'}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Reward Name *</label>
            <input className="input-field" placeholder="e.g. Free Coffee" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea rows={2} className="input-field h-auto py-3 resize-none" placeholder="Briefly describe what the member receives" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="form-label">Points Cost *</label>
              <input type="number" min={1} className="input-field" placeholder="100" value={form.points_cost} onChange={e => setForm(f => ({ ...f, points_cost: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Stock (blank = unlimited)</label>
              <input type="number" min={1} className="input-field" placeholder="Unlimited" value={form.quantity_available} onChange={e => setForm(f => ({ ...f, quantity_available: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => { setShowModal(false); setEditTarget(null); }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={save} disabled={saving || !form.name || !form.points_cost} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              {editTarget ? 'Save Changes' : 'Create Reward'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUPONS TAB
// ─────────────────────────────────────────────────────────────────────────────
function CouponsTab() {
  const { addToast } = useToastStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'flat', value: '', min_purchase: '0', max_uses: '', expires_at: '' });

  const load = () => api.getCoupons().then(setCoupons).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const genCode = () => Array.from({ length: 8 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

  const save = async () => {
    if (!form.value) { addToast('error', 'Discount value is required'); return; }
    setSaving(true);
    try {
      await api.createCoupon({
        code: form.code.toUpperCase() || genCode(),
        discount_type: form.discount_type as 'flat' | 'percent',
        value: Number(form.value),
        min_purchase: Number(form.min_purchase),
        max_uses: form.max_uses ? Number(form.max_uses) : undefined,
        expires_at: form.expires_at || undefined,
      });
      addToast('success', 'Coupon created');
      setShowModal(false);
      setForm({ code: '', discount_type: 'flat', value: '', min_purchase: '0', max_uses: '', expires_at: '' });
      load();
    } catch { addToast('error', 'Failed to create coupon'); }
    finally { setSaving(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => addToast('success', `Code "${code}" copied`)).catch(() => {});
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">Create discount codes for members to use at checkout.</p>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Coupon
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low">
              <tr>
                {['Code', 'Type', 'Value', 'Min Purchase', 'Uses', 'Expires', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-label-md text-on-surface-variant whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-container rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[40px] block mb-2 opacity-40">confirmation_number</span>
                  No coupons yet
                </td></tr>
              ) : coupons.map(c => (
                <tr key={c.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary tracking-widest">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary transition-all">
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-md capitalize text-on-surface-variant">{c.discount_type}</td>
                  <td className="px-4 py-3 text-body-md font-bold">{c.discount_type === 'percent' ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface-variant">₹{c.min_purchase || 0}</td>
                  <td className="px-4 py-3 text-body-md text-on-surface-variant">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                  <td className="px-4 py-3 text-label-sm text-on-surface-variant">{c.expires_at || <span className="italic">Never</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`text-label-sm px-2.5 py-1 rounded-full font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={async () => { await api.updateCoupon(c.id, { is_active: !c.is_active }); load(); }}
                        className="text-label-sm px-2 py-1 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface-variant transition-colors">
                        {c.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={async () => { await api.deleteCoupon(c.id); load(); }}
                        className="p-1 rounded-lg text-error hover:bg-error-container transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Coupon Code">
        <div className="space-y-4">
          <div>
            <label className="form-label">Coupon Code <span className="text-on-surface-variant font-normal">(leave blank to auto-generate)</span></label>
            <input className="input-field font-mono uppercase" placeholder="e.g. SAVE20" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="form-label">Discount Type *</label>
              <select className="input-field" value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                <option value="flat">Flat (₹)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Value *</label>
              <input type="number" min={1} className="input-field" placeholder={form.discount_type === 'percent' ? '10' : '100'} value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Min Purchase (₹)</label>
              <input type="number" min={0} className="input-field" placeholder="0" value={form.min_purchase} onChange={e => setForm(f => ({ ...f, min_purchase: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Max Uses <span className="text-on-surface-variant font-normal">(blank = unlimited)</span></label>
              <input type="number" min={1} className="input-field" placeholder="Unlimited" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Expires At <span className="text-on-surface-variant font-normal">(blank = never)</span></label>
            <input type="date" className="input-field" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={save} disabled={saving || !form.value} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              Create Coupon
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GIFT VOUCHERS TAB
// ─────────────────────────────────────────────────────────────────────────────
function VouchersTab() {
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const merchantId = user?.merchant_id || '';
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ value: '', quantity: '1', expires_at: '' });

  // Link/Redeem to member modal
  const [redeemTarget, setRedeemTarget] = useState<any | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [linking, setLinking] = useState(false);

  const load = () => api.getVouchers().then(setVouchers).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!form.value) { addToast('error', 'Voucher value is required'); return; }
    setGenerating(true);
    try {
      const qty = Math.min(100, Math.max(1, Number(form.quantity)));
      await api.generateVouchers(Number(form.value), qty, form.expires_at || undefined);
      addToast('success', `${qty} voucher(s) generated`);
      setShowModal(false);
      setForm({ value: '', quantity: '1', expires_at: '' });
      load();
    } catch { addToast('error', 'Failed to generate vouchers'); }
    finally { setGenerating(false); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => addToast('success', `Code "${code}" copied`)).catch(() => {});
  };

  const handleMemberSearch = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    setMemberSearching(true);
    try {
      const results = await api.searchMembers(merchantId, q);
      setMemberResults(results);
    } finally { setMemberSearching(false); }
  };

  const handleLinkVoucher = async (member: Member) => {
    if (!redeemTarget) return;
    setLinking(true);
    try {
      await api.redeemVoucher(redeemTarget.code, member.id);
      addToast('success', `Voucher ₹${redeemTarget.value} redeemed & credited to ${member.name}`);
      setRedeemTarget(null);
      setMemberSearch('');
      setMemberResults([]);
      load();
    } catch (e: any) {
      addToast('error', e.message || 'Failed to redeem voucher');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">Generate pre-loaded gift vouchers for customers or promotions.</p>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Generate Vouchers
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="card p-lg flex flex-col items-center text-center py-16">
          <div className="w-20 h-20 bg-secondary-container/20 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-secondary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>wallet</span>
          </div>
          <h3 className="text-headline-md font-bold mb-2">No vouchers yet</h3>
          <p className="text-body-md text-on-surface-variant max-w-sm mb-6">Generate gift vouchers to distribute to customers as rewards, contest prizes, or promotional gifts.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Generate First Vouchers
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {vouchers.map(v => (
            <div
              key={v.id}
              className={`card p-md flex flex-col gap-3 transition-all hover:shadow-elevated ${v.is_redeemed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <code className={`font-mono font-bold tracking-widest text-body-lg ${v.is_redeemed ? 'text-on-surface-variant' : 'text-primary'}`}>
                  {v.code}
                </code>
                {!v.is_redeemed && (
                  <button onClick={() => copyCode(v.code)} className="text-on-surface-variant hover:text-primary transition-colors" title="Copy code">
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  </button>
                )}
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-headline-lg font-bold ${v.is_redeemed ? 'text-on-surface-variant' : 'text-secondary'}`}>₹{v.value}</span>
                <span className="text-label-sm text-on-surface-variant">gift voucher</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-label-sm px-2.5 py-1 rounded-full font-medium ${v.is_redeemed ? 'bg-surface-container text-on-surface-variant' : 'bg-green-100 text-green-700'}`}>
                    {v.is_redeemed ? 'Redeemed' : 'Available'}
                  </span>
                  {v.expires_at && !v.is_redeemed && (
                    <span className="text-label-sm text-on-surface-variant">Expires {v.expires_at}</span>
                  )}
                </div>
                {!v.is_redeemed && (
                  <button
                    onClick={() => { setRedeemTarget(v); setMemberSearch(''); setMemberResults([]); }}
                    className="btn-primary text-label-sm py-1 px-3.5 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    Link User
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Vouchers Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Generate Gift Vouchers">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="form-label">Voucher Value (₹) *</label>
              <input type="number" min={1} className="input-field" placeholder="500" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} autoFocus />
            </div>
            <div>
              <label className="form-label">Quantity <span className="text-on-surface-variant font-normal">(max 100)</span></label>
              <input type="number" min={1} max={100} className="input-field" placeholder="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Expiry Date <span className="text-on-surface-variant font-normal">(blank = no expiry)</span></label>
            <input type="date" className="input-field" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
          </div>
          {form.value && form.quantity && (
            <div className="bg-secondary-container/20 rounded-xl p-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">info</span>
              <p className="text-body-sm">
                Will generate <strong>{form.quantity}</strong> voucher(s) each worth <strong>₹{form.value}</strong>
                {form.expires_at ? `, expiring ${form.expires_at}` : ' with no expiry'}.
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={generate} disabled={generating || !form.value} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {generating && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              Generate
            </button>
          </div>
        </div>
      </Modal>

      {/* Link Gift Voucher to Member Modal */}
      {redeemTarget && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !linking && setRedeemTarget(null)} />
          <div className="relative bg-surface rounded-2xl shadow-2xl p-lg w-full max-w-lg mx-4 animate-scale-in space-y-md">
            <div className="flex items-center justify-between">
              <h3 className="text-headline-md font-bold">Link Gift Voucher to Member</h3>
              <button onClick={() => !linking && setRedeemTarget(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-secondary-container/30 rounded-xl p-4 flex items-center gap-3 text-on-surface">
              <span className="material-symbols-outlined text-secondary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>card_giftcard</span>
              <div>
                <p className="text-label-sm text-on-surface-variant">Redeeming & linking voucher code</p>
                <p className="font-mono font-bold text-headline-md tracking-widest text-primary">{redeemTarget.code}</p>
                <p className="text-label-md font-bold text-secondary">Value: ₹{redeemTarget.value}</p>
              </div>
            </div>

            <div>
              <label className="form-label">Search Member to Link</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
                <input
                  autoFocus
                  className="input-field pl-10"
                  placeholder="Member name or phone number..."
                  value={memberSearch}
                  onChange={e => handleMemberSearch(e.target.value)}
                />
                {memberSearching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
                )}
              </div>
            </div>

            {memberResults.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {memberResults.map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleLinkVoucher(m)}
                    disabled={linking}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-all text-left border border-outline-variant/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-on-primary-container">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface">{m.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{m.phone} · #{m.member_code}</p>
                    </div>
                    {linking ? (
                      <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-primary">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {memberSearch.length >= 2 && !memberSearching && memberResults.length === 0 && (
              <div className="text-center py-6 text-on-surface-variant">
                <span className="material-symbols-outlined text-[32px] block mb-1">person_off</span>
                <p className="text-body-md">No members found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POINTS RULES TAB
// ─────────────────────────────────────────────────────────────────────────────
function PointsRulesTab() {
  const { addToast } = useToastStore();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ rule_type: 'per_visit', points_value: '' });

  const load = () => api.getPointsRules().then(setRules).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.points_value) { addToast('error', 'Points value is required'); return; }
    setSaving(true);
    try {
      await api.createPointsRule({ rule_type: form.rule_type as 'per_visit' | 'per_rupee', points_value: Number(form.points_value) });
      addToast('success', 'Points rule created');
      setShowModal(false);
      setForm({ rule_type: 'per_visit', points_value: '' });
      load();
    } catch { addToast('error', 'Failed to create rule'); }
    finally { setSaving(false); }
  };

  const RULE_META: Record<string, { icon: string; desc: string; color: string }> = {
    per_visit: { icon: 'store', desc: 'Points earned on every visit', color: 'bg-primary-container/30 text-primary' },
    per_rupee: { icon: 'currency_rupee', desc: 'Points earned per ₹ spent', color: 'bg-secondary-container text-secondary' },
  };

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">Define global rules for how members earn loyalty points.</p>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Rule
        </button>
      </div>

      <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-4 flex gap-3">
        <span className="material-symbols-outlined text-primary flex-shrink-0">info</span>
        <div className="text-body-sm text-on-surface">
          <strong>How points work:</strong> Rules here define how many points members earn. Members can then redeem points via reward catalog or the <em>points_redemption</em> offer type in your Offers page.
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
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {rules.map(r => {
            const meta = RULE_META[r.rule_type] || { icon: 'stars', desc: r.rule_type, color: 'bg-surface-container text-on-surface-variant' };
            return (
              <div key={r.id} className={`card p-md flex flex-col gap-4 transition-all hover:shadow-elevated ${!r.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-headline-lg font-bold text-primary">⚡ {Number(r.points_value).toFixed(0)}</span>
                      <span className="text-body-md text-on-surface-variant">points</span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant">{meta.desc}</p>
                  </div>
                  <span className={`text-label-sm px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2 border-t border-outline-variant/20 pt-3">
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Points Rule">
        <div className="space-y-4">
          <div>
            <label className="form-label">Rule Type *</label>
            <select className="input-field" value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}>
              <option value="per_visit">Per Visit — earn X points on every visit</option>
              <option value="per_rupee">Per ₹ Spent — earn X points per rupee spent</option>
            </select>
          </div>
          <div>
            <label className="form-label">Points Value *</label>
            <input type="number" min={1} className="input-field" placeholder="e.g. 10" value={form.points_value} onChange={e => setForm(f => ({ ...f, points_value: e.target.value }))} autoFocus />
            <p className="text-label-sm text-on-surface-variant mt-1">
              {form.rule_type === 'per_visit'
                ? `Members earn ${form.points_value || 'X'} points on each visit`
                : `Members earn ${form.points_value || 'X'} points for every ₹1 spent`}
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={save} disabled={saving || !form.points_value} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              Create Rule
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
