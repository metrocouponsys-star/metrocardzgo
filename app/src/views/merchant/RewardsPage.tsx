'use client';
import React, { useEffect, useState } from 'react';
import * as api from '../../api/realClient';

type Tab = 'catalog' | 'coupons' | 'vouchers' | 'points_rules';

export default function RewardsPage() {
  const [tab, setTab] = useState<Tab>('catalog');

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--clr-text-primary)' }}>
        Rewards & Loyalty
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--clr-border)', flexWrap: 'wrap' }}>
        {([
          ['catalog', '🎁 Reward Catalog'],
          ['coupons', '🎟️ Coupon Codes'],
          ['vouchers', '💳 Gift Vouchers'],
          ['points_rules', '⚡ Points Rules'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              padding: '0.6rem 1.25rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              background: 'none', borderBottom: tab === key ? '2px solid var(--clr-primary)' : '2px solid transparent',
              color: tab === key ? 'var(--clr-primary)' : 'var(--clr-text-secondary)',
              marginBottom: -2,
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'catalog' && <RewardCatalogTab />}
      {tab === 'coupons' && <CouponsTab />}
      {tab === 'vouchers' && <VouchersTab />}
      {tab === 'points_rules' && <PointsRulesTab />}
    </div>
  );
}

// ── Reward Catalog ────────────────────────────────────────────────────────────
function RewardCatalogTab() {
  const [rewards, setRewards] = useState<api.Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', points_cost: '', quantity_available: '' });

  const load = () => api.getRewards().then(setRewards).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    const data: any = { name: form.name, description: form.description, points_cost: Number(form.points_cost) };
    if (form.quantity_available) data.quantity_available = Number(form.quantity_available);
    if (editId) await api.updateReward(editId, data); else await api.createReward(data);
    setShowForm(false); setEditId(null);
    setForm({ name: '', description: '', points_cost: '', quantity_available: '' });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.875rem' }}>Members redeem loyalty points for these rewards.</p>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '', points_cost: '', quantity_available: '' }); }}
          style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          + Add Reward
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>{editId ? 'Edit' : 'New'} Reward</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[['Reward Name', 'name', 'text'], ['Points Cost', 'points_cost', 'number'], ['Stock (blank = unlimited)', 'quantity_available', 'number']].map(([label, key, type]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={save} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--clr-surface-alt)', border: '1px solid var(--clr-border)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {loading ? <p style={{ color: 'var(--clr-text-secondary)' }}>Loading…</p> :
          rewards.map(r => (
            <div key={r.id} style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', opacity: r.is_active ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{r.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', marginBottom: '0.75rem' }}>{r.description}</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { setEditId(r.id); setShowForm(true); setForm({ name: r.name, description: r.description, points_cost: String(r.points_cost), quantity_available: r.quantity_available != null ? String(r.quantity_available) : '' }); }}
                    style={{ background: 'var(--clr-surface-alt)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
                  <button onClick={async () => { await api.updateReward(r.id, { is_active: !r.is_active }); load(); }}
                    style={{ background: r.is_active ? '#ffeaa7' : '#dff9fb', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
                    {r.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ background: '#6c63ff22', color: '#6c63ff', padding: '4px 12px', borderRadius: 99, fontWeight: 700, fontSize: '0.875rem' }}>
                  {Number(r.points_cost).toFixed(0)} pts
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-secondary)' }}>
                  {r.quantity_available != null ? `${r.quantity_available} left` : 'Unlimited'}
                </span>
              </div>
            </div>
          ))}
        {!loading && rewards.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--clr-text-secondary)' }}>
            <div style={{ fontSize: '3rem' }}>🎁</div>
            <p>No rewards yet. Add your first reward!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Coupons Tab ───────────────────────────────────────────────────────────────
function CouponsTab() {
  const [coupons, setCoupons] = useState<api.Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount_type: 'flat', value: '', min_purchase: '0', max_uses: '', expires_at: '' });

  const load = () => api.getCoupons().then(setCoupons).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const save = async () => {
    await api.createCoupon({
      code: form.code || generateCode(),
      discount_type: form.discount_type as any,
      value: Number(form.value),
      min_purchase: Number(form.min_purchase),
      max_uses: form.max_uses ? Number(form.max_uses) : undefined,
      expires_at: form.expires_at || undefined,
    });
    setShowForm(false);
    setForm({ code: '', discount_type: 'flat', value: '', min_purchase: '0', max_uses: '', expires_at: '' });
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.875rem' }}>Create discount codes for customers at checkout.</p>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          + Create Coupon
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>New Coupon Code</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>Code (leave blank to auto-generate)</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>Discount Type</label>
              <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }}>
                <option value="flat">Flat (₹)</option>
                <option value="percent">Percent (%)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>Value</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>Min Purchase (₹)</label>
              <input type="number" value={form.min_purchase} onChange={e => setForm(f => ({ ...f, min_purchase: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>Max Uses (blank = unlimited)</label>
              <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>Expires At</label>
              <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={save} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--clr-surface-alt)', border: '1px solid var(--clr-border)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'var(--clr-surface)', borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--clr-surface-alt)' }}>
              {['Code', 'Type', 'Value', 'Min Purchase', 'Uses', 'Expires', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center' }}>Loading…</td></tr> :
              coupons.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--clr-border)' }}>
                  <td style={{ padding: '0.65rem 1rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }}>{c.code}</td>
                  <td style={{ padding: '0.65rem 1rem', textTransform: 'capitalize' }}>{c.discount_type}</td>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 600 }}>{c.discount_type === 'percent' ? `${c.value}%` : `₹${c.value}`}</td>
                  <td style={{ padding: '0.65rem 1rem' }}>₹{c.min_purchase}</td>
                  <td style={{ padding: '0.65rem 1rem' }}>{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--clr-text-secondary)' }}>{c.expires_at || '—'}</td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <span style={{ background: c.is_active ? '#00b89422' : '#e1705522', color: c.is_active ? '#00b894' : '#e17055', padding: '2px 8px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <button onClick={async () => { await api.updateCoupon(c.id, { is_active: !c.is_active }); load(); }}
                      style={{ background: 'none', border: '1px solid var(--clr-border)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={async () => { await api.deleteCoupon(c.id); load(); }}
                      style={{ background: 'none', border: '1px solid #e17055', color: '#e17055', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: '0.75rem', marginLeft: 4 }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && coupons.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-secondary)' }}>No coupons yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Gift Vouchers Tab ─────────────────────────────────────────────────────────
function VouchersTab() {
  const [vouchers, setVouchers] = useState<api.GiftVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ value: '', quantity: '1', expires_at: '' });

  const load = () => api.getVouchers().then(setVouchers).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const generate = async () => {
    await api.generateVouchers(Number(form.value), Number(form.quantity), form.expires_at || undefined);
    setShowForm(false);
    setForm({ value: '', quantity: '1', expires_at: '' });
    load();
  };

  const copyCode = (code: string) => navigator.clipboard.writeText(code).catch(() => {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.875rem' }}>Generate pre-loaded gift vouchers for customers.</p>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          + Generate Vouchers
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Generate Gift Vouchers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            {[['Value (₹)', 'value', 'number'], ['Quantity (max 100)', 'quantity', 'number'], ['Expires At', 'expires_at', 'date']].map(([label, key, type]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={generate} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Generate</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--clr-surface-alt)', border: '1px solid var(--clr-border)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
        {loading ? <p style={{ color: 'var(--clr-text-secondary)' }}>Loading…</p> :
          vouchers.map(v => (
            <div key={v.id} style={{ background: 'var(--clr-surface)', borderRadius: 10, padding: '1rem', boxShadow: 'var(--shadow-sm)', opacity: v.is_redeemed ? 0.6 : 1, border: `1px solid ${v.is_redeemed ? 'var(--clr-border)' : '#00b89433'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <code style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em', color: v.is_redeemed ? 'var(--clr-text-secondary)' : 'var(--clr-primary)' }}>{v.code}</code>
                {!v.is_redeemed && (
                  <button onClick={() => copyCode(v.code)} title="Copy code"
                    style={{ background: 'var(--clr-surface-alt)', border: '1px solid var(--clr-border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.75rem' }}>📋</button>
                )}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00b894', marginBottom: '0.25rem' }}>₹{v.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-secondary)' }}>
                {v.is_redeemed ? `✅ Redeemed` : `Available${v.expires_at ? ` · Expires ${v.expires_at}` : ''}`}
              </div>
            </div>
          ))}
        {!loading && vouchers.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--clr-text-secondary)' }}>
            <div style={{ fontSize: '3rem' }}>💳</div>
            <p>No vouchers yet. Generate some!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Points Rules Tab ──────────────────────────────────────────────────────────
function PointsRulesTab() {
  const [rules, setRules] = useState<api.PointsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rule_type: 'per_visit', points_value: '' });

  const load = () => api.getPointsRules().then(setRules).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    await api.createPointsRule({ rule_type: form.rule_type as any, points_value: Number(form.points_value) });
    setShowForm(false);
    setForm({ rule_type: 'per_visit', points_value: '' });
    load();
  };

  const RULE_LABELS: Record<string, string> = {
    per_visit: 'Per Visit',
    per_rupee: 'Per ₹ Spent',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.875rem' }}>Define how members earn loyalty points globally.</p>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          + Add Rule
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>New Points Rule</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>Rule Type</label>
              <select value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }}>
                <option value="per_visit">Per Visit — earn X points each visit</option>
                <option value="per_rupee">Per ₹ Spent — earn X points per rupee</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-secondary)', marginBottom: 4 }}>Points Value</label>
              <input type="number" value={form.points_value} onChange={e => setForm(f => ({ ...f, points_value: e.target.value }))} placeholder="e.g. 10"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--clr-border)', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={save} style={{ padding: '0.5rem 1.25rem', borderRadius: 8, background: 'var(--clr-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--clr-surface-alt)', border: '1px solid var(--clr-border)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {loading ? <p style={{ color: 'var(--clr-text-secondary)' }}>Loading…</p> :
          rules.map(r => (
            <div key={r.id} style={{ background: 'var(--clr-surface)', borderRadius: 12, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', opacity: r.is_active ? 1 : 0.5 }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fdcb6e', marginBottom: '0.25rem' }}>⚡ {Number(r.points_value).toFixed(0)} pts</div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{RULE_LABELS[r.rule_type] || r.rule_type}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', marginBottom: '0.75rem' }}>
                Members earn {Number(r.points_value).toFixed(0)} points {r.rule_type === 'per_visit' ? 'per visit' : 'per rupee spent'}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={async () => { await api.updatePointsRule(r.id, { is_active: !r.is_active }); load(); }}
                  style={{ background: r.is_active ? '#ffeaa7' : '#dff9fb', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                  {r.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={async () => { await api.deletePointsRule(r.id); load(); }}
                  style={{ background: 'none', border: '1px solid #e17055', color: '#e17055', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        {!loading && rules.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--clr-text-secondary)' }}>
            <div style={{ fontSize: '3rem' }}>⚡</div>
            <p>No points rules yet. Add a global rule!</p>
          </div>
        )}
      </div>
    </div>
  );
}
