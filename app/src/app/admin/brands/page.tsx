'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { type PartnerStatus } from '@/lib/partnerStatus';

interface BrandRow {
  id: number;
  name: string;
  partnerStatus: PartnerStatus;
  category: string;
  city: string;
  logoUrl: string | null;
  website: string | null;
  active: boolean;
  dealCount: number;
}

const PARTNER_STATUSES: PartnerStatus[] = ['direct_merchant', 'authorised_partner', 'affiliate', 'public_link'];
const STATUS_LABELS: Record<PartnerStatus, string> = {
  direct_merchant:    'Direct Merchant',
  authorised_partner: 'Authorised Partner',
  affiliate:          'Affiliate',
  public_link:        'Public Link',
};

export default function AdminBrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [cities, setCities] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    name: '', categoryId: '', cityId: '', partnerStatus: '' as PartnerStatus | '',
    description: '', website: '', instagram: '', phone: '', mapsUrl: '', active: true,
  });

  async function loadData() {
    try {
      const [brandsRes, catRes, citiesRes] = await Promise.all([
        fetch('/api/admin/brands', { credentials: 'include' }),
        fetch('/api/categories'),
        fetch('/api/cities'),
      ]);
      if (brandsRes.status === 401) { router.push('/admin/login'); return; }
      if (brandsRes.ok) setBrands(await brandsRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (citiesRes.ok) setCities(await citiesRes.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function saveBrand(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const res = await fetch('/api/admin/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, categoryId: Number(form.categoryId), cityId: Number(form.cityId) }),
    });

    const data = await res.json();
    if (res.ok) {
      setShowForm(false);
      setForm({ name: '', categoryId: '', cityId: '', partnerStatus: '', description: '', website: '', instagram: '', phone: '', mapsUrl: '', active: true });
      await loadData();
    } else {
      setFormError(data.message ?? 'Failed to save brand');
    }
    setSaving(false);
  }

  async function toggleActive(brand: BrandRow) {
    await fetch(`/api/admin/brands/${brand.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active: !brand.active }),
    });
    await loadData();
  }

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase()));

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '44px', background: '#1C212B', border: '1px solid #2A303C',
    borderRadius: '10px', padding: '0 14px', color: '#F8FAFC', fontSize: '14px', outline: 'none',
    fontFamily: '"Plus Jakarta Sans", sans-serif', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: '#0D0F12', minHeight: '100dvh', color: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#14171F', borderBottom: '1px solid #2A303C', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#D4AF37' }}>Metro Cardz</span>
          <nav style={{ display: 'flex', gap: '4px' }}>
            <Link href="/admin/deals" style={{ padding: '6px 14px', borderRadius: '9999px', background: 'transparent', border: '1px solid transparent', color: '#9CA3AF', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Deals</Link>
            <Link href="/admin/brands" style={{ padding: '6px 14px', borderRadius: '9999px', background: '#1C212B', border: '1px solid #D4AF37', color: '#FFF3D6', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Brands</Link>
          </nav>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{ height: '36px', padding: '0 16px', background: 'linear-gradient(135deg, #E5C158, #D4AF37)', border: 'none', borderRadius: '9999px', color: '#0D0F12', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          + Add Brand
        </button>
      </header>

      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {PARTNER_STATUSES.map((status) => {
            const count = brands.filter((b) => b.partnerStatus === status).length;
            return (
              <div key={status} style={{ background: '#14171F', border: '1px solid #2A303C', borderRadius: '12px', padding: '14px' }}>
                <div style={{ marginBottom: '8px' }}><PartnerBadge status={status} /></div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>{count}</div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>{STATUS_LABELS[status]}</div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#14171F', border: '1px solid #2A303C', borderRadius: '10px', padding: '0 14px', height: '44px', marginBottom: '16px' }}>
          <span style={{ color: '#6B7280' }}>🔍</span>
          <input type="search" placeholder="Search brands..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: '14px', fontFamily: '"Plus Jakarta Sans", sans-serif' }} />
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading brands...</div>
        ) : (
          <div style={{ background: '#14171F', border: '1px solid #2A303C', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1C212B', borderBottom: '1px solid #2A303C' }}>
                  {['BRAND', 'CATEGORY', 'CITY', 'PARTNER TIER', 'DEALS', 'ACTIVE', 'ACTIONS'].map((h) => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: '#6B7280', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((brand, idx) => (
                  <tr key={brand.id} style={{ background: idx % 2 === 0 ? '#14171F' : '#111419', borderBottom: '1px solid #1C212B' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#1C212B'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#14171F' : '#111419'; }}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '14px' }}>{brand.name}</div>
                      {brand.website && <a href={brand.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#D4AF37', textDecoration: 'none' }}>↗ Website</a>}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#9CA3AF' }}>{brand.category}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#9CA3AF' }}>{brand.city}</td>
                    <td style={{ padding: '12px 14px' }}><PartnerBadge status={brand.partnerStatus} /></td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>{brand.dealCount}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => toggleActive(brand)}
                        style={{ width: '42px', height: '24px', borderRadius: '9999px', background: brand.active ? '#D4AF37' : '#2A303C', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                        <span style={{ position: 'absolute', top: '3px', left: brand.active ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s' }} />
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Edit →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Quick add brand slide-over */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowForm(false)} />
          <div style={{ width: '480px', background: '#14171F', borderLeft: '1px solid #2A303C', padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>New Brand</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {formError && <div style={{ background: 'rgba(186,26,26,0.1)', border: '1px solid rgba(186,26,26,0.3)', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#FF8A80', marginBottom: '16px' }}>⚠ {formError}</div>}

            <form onSubmit={saveBrand} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'BRAND NAME *', id: 'name', type: 'text', placeholder: 'e.g. Wet\'nJoy Water Park' },
                { label: 'WEBSITE', id: 'website', type: 'url', placeholder: 'https://...' },
                { label: 'PHONE', id: 'phone', type: 'tel', placeholder: '+91 22...' },
                { label: 'INSTAGRAM HANDLE', id: 'instagram', type: 'text', placeholder: 'wetnjoywaterpark' },
                { label: 'GOOGLE MAPS URL', id: 'mapsUrl', type: 'url', placeholder: 'https://maps.google.com/...' },
              ].map(({ label, id, type, placeholder }) => (
                <div key={id}>
                  <label htmlFor={`brand-${id}`} style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '5px' }}>{label}</label>
                  <input id={`brand-${id}`} type={type} value={(form as Record<string, unknown>)[id] as string} onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))} required={id === 'name'} placeholder={placeholder} style={inputStyle} />
                </div>
              ))}

              <div>
                <label htmlFor="brand-category" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '5px' }}>CATEGORY *</label>
                <select id="brand-category" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="brand-city" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '5px' }}>CITY *</label>
                <select id="brand-city" value={form.cityId} onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="brand-status" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '5px' }}>PARTNER STATUS * (required — cannot default)</label>
                <select id="brand-status" value={form.partnerStatus} onChange={(e) => setForm((f) => ({ ...f, partnerStatus: e.target.value as PartnerStatus }))} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select tier...</option>
                  {PARTNER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                {form.partnerStatus && <div style={{ marginTop: '8px' }}><PartnerBadge status={form.partnerStatus} /></div>}
              </div>

              <div>
                <label htmlFor="brand-desc" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '5px' }}>DESCRIPTION</label>
                <textarea id="brand-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                <button type="submit" disabled={saving} style={{ flex: 1, height: '48px', background: saving ? '#2A303C' : 'linear-gradient(135deg, #E5C158, #D4AF37)', border: 'none', borderRadius: '10px', color: '#0D0F12', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : 'Create Brand'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ height: '48px', padding: '0 20px', background: '#1C212B', border: '1px solid #2A303C', borderRadius: '10px', color: '#9CA3AF', fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
