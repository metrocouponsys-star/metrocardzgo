'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { type PartnerStatus } from '@/lib/partnerStatus';

interface Brand {
  id: number;
  name: string;
  partnerStatus: PartnerStatus;
  category: string;
  city: string;
}

interface DealFormData {
  brandId: number | '';
  offerTitle: string;
  offerPercentage: string;
  offerType: string;
  startDate: string;
  endDate: string;
  bookingUrl: string;
  affiliateUrl: string;
  terms: string;
  lastVerifiedDate: string;
  featured: boolean;
  active: boolean;
  heroImageUrl: string;
}

interface DealFormProps {
  initialData?: Partial<DealFormData>;
  dealId?: number;
  isEdit?: boolean;
}

const OFFER_TYPES = ['percentage', 'bogo', 'flat', 'package', 'complimentary'];
const today = new Date().toISOString().split('T')[0];

export function DealForm({ initialData, dealId, isEdit = false }: DealFormProps) {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<DealFormData>({
    brandId:         '',
    offerTitle:      '',
    offerPercentage: '',
    offerType:       'percentage',
    startDate:       today,
    endDate:         '',
    bookingUrl:      '',
    affiliateUrl:    '',
    terms:           '',
    lastVerifiedDate: today,
    featured:        false,
    active:          true,
    heroImageUrl:    '',
    ...initialData,
  });

  const selectedBrand = brands.find((b) => b.id === Number(form.brandId));

  useEffect(() => {
    fetch('/api/admin/brands', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBrands(data);
      });
  }, []);

  function update(field: keyof DealFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const body = {
        ...form,
        brandId: Number(form.brandId),
        offerPercentage: form.offerPercentage ? Number(form.offerPercentage) : null,
      };

      const url    = isEdit ? `/api/admin/deals/${dealId}` : '/api/admin/deals';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/deals');
        router.refresh();
      } else if (data.fields) {
        setErrors(data.fields);
      } else {
        setErrors({ _form: data.message ?? 'Save failed' });
      }
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, id: string, content: React.ReactNode, error?: string) {
    return (
      <div>
        <label htmlFor={id} style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '6px' }}>
          {label}
        </label>
        {content}
        {error && <div style={{ fontSize: '12px', color: '#FF8A80', marginTop: '4px' }}>⚠ {error}</div>}
      </div>
    );
  }

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width:        '100%',
    height:       '44px',
    background:   '#1C212B',
    border:       `1px solid ${hasError ? 'rgba(186,26,26,0.6)' : '#2A303C'}`,
    borderRadius: '10px',
    padding:      '0 14px',
    color:        '#F8FAFC',
    fontSize:     '14px',
    outline:      'none',
    fontFamily:   '"Plus Jakarta Sans", sans-serif',
    boxSizing:    'border-box' as const,
  });

  return (
    <div style={{ background: '#0D0F12', minHeight: '100dvh', color: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#14171F', borderBottom: '1px solid #2A303C', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 40 }}>
        <Link href="/admin/deals" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9CA3AF', textDecoration: 'none', fontSize: '13px' }}>← Back</Link>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: '#D4AF37' }}>
          {isEdit ? 'Edit Deal' : 'New Deal'}
        </div>
      </header>

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
        {errors._form && (
          <div style={{ background: 'rgba(186,26,26,0.1)', border: '1px solid rgba(186,26,26,0.3)', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#FF8A80', marginBottom: '20px' }}>
            ⚠ {errors._form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Section: Brand */}
          <section style={{ background: '#14171F', border: '1px solid #2A303C', borderRadius: '14px', padding: '20px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>Brand</h2>

            {field('BRAND *', 'brandId',
              <select
                id="brandId"
                value={form.brandId}
                onChange={(e) => update('brandId', e.target.value)}
                required
                style={{ ...inputStyle(!!errors.brandId), cursor: 'pointer' }}
              >
                <option value="">Select a brand...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.city} · {b.partnerStatus})</option>
                ))}
              </select>,
              errors.brandId
            )}

            {selectedBrand && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PartnerBadge status={selectedBrand.partnerStatus} />
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{selectedBrand.category} · {selectedBrand.city}</span>
              </div>
            )}
          </section>

          {/* Section: Offer */}
          <section style={{ background: '#14171F', border: '1px solid #2A303C', borderRadius: '14px', padding: '20px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>Offer Details</h2>
            <div style={{ display: 'grid', gap: '16px' }}>

              {field('OFFER TITLE *', 'offerTitle',
                <input id="offerTitle" type="text" value={form.offerTitle} onChange={(e) => update('offerTitle', e.target.value)} required placeholder="e.g. 40% Off All Wave Pool Passes" style={inputStyle(!!errors.offerTitle)} />,
                errors.offerTitle
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {field('OFFER TYPE *', 'offerType',
                  <select id="offerType" value={form.offerType} onChange={(e) => update('offerType', e.target.value)} style={{ ...inputStyle(), cursor: 'pointer' }}>
                    {OFFER_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                )}
                {field('PERCENTAGE (if applicable)', 'offerPercentage',
                  <input id="offerPercentage" type="number" min="1" max="100" value={form.offerPercentage} onChange={(e) => update('offerPercentage', e.target.value)} placeholder="e.g. 40" style={inputStyle()} />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {field('START DATE *', 'startDate',
                  <input id="startDate" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required style={inputStyle(!!errors.startDate)} />,
                  errors.startDate
                )}
                {field('END DATE *', 'endDate',
                  <input id="endDate" type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} required style={inputStyle(!!errors.endDate)} />,
                  errors.endDate
                )}
              </div>

              {field('BOOKING URL', 'bookingUrl',
                <input id="bookingUrl" type="url" value={form.bookingUrl} onChange={(e) => update('bookingUrl', e.target.value)} placeholder="https://..." style={inputStyle()} />
              )}

              {field(
                `AFFILIATE URL${selectedBrand?.partnerStatus === 'affiliate' ? ' *' : ''}`,
                'affiliateUrl',
                <input id="affiliateUrl" type="url" value={form.affiliateUrl} onChange={(e) => update('affiliateUrl', e.target.value)} placeholder="https://..." style={inputStyle(!!errors.affiliateUrl)} />,
                errors.affiliateUrl
              )}

              {field('HERO IMAGE URL', 'heroImageUrl',
                <input id="heroImageUrl" type="url" value={form.heroImageUrl} onChange={(e) => update('heroImageUrl', e.target.value)} placeholder="https://..." style={inputStyle()} />
              )}
            </div>
          </section>

          {/* Section: Terms & Settings */}
          <section style={{ background: '#14171F', border: '1px solid #2A303C', borderRadius: '14px', padding: '20px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>Terms & Settings</h2>
            <div style={{ display: 'grid', gap: '16px' }}>

              {field('OFFER TERMS', 'terms',
                <textarea
                  id="terms"
                  value={form.terms}
                  onChange={(e) => update('terms', e.target.value)}
                  rows={5}
                  placeholder="Valid on weekends and public holidays only. Max 2 passes per card. Not applicable during school holidays..."
                  style={{ ...inputStyle(), height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: '20px' }}
                />
              )}

              {field('LAST VERIFIED DATE *', 'lastVerifiedDate',
                <input id="lastVerifiedDate" type="date" value={form.lastVerifiedDate} onChange={(e) => update('lastVerifiedDate', e.target.value)} required style={inputStyle(!!errors.lastVerifiedDate)} />,
                errors.lastVerifiedDate
              )}

              <div style={{ display: 'flex', gap: '20px' }}>
                {[
                  { id: 'featured', label: 'Featured Deal', desc: 'Appears on Flash Privilege banner' },
                  { id: 'active',   label: 'Active',        desc: 'Visible to public' },
                ].map(({ id, label, desc }) => (
                  <label key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <div
                      style={{ width: '20px', height: '20px', background: (form as unknown as Record<string, unknown>)[id] ? '#D4AF37' : '#2A303C', border: '1px solid #3F3722', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      onClick={() => update(id as keyof DealFormData, !(form as unknown as Record<string, unknown>)[id])}
                    >
                      {!!(form as unknown as Record<string, unknown>)[id] && <span style={{ color: '#0D0F12', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 1, height: '52px', background: saving ? '#2A303C' : 'linear-gradient(135deg, #E5C158, #D4AF37)', border: 'none', borderRadius: '12px', color: '#0D0F12', fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(212,175,55,0.3)' }}
            >
              {saving ? 'Saving...' : isEdit ? 'Update Deal' : 'Create Deal'}
            </button>
            <Link href="/admin/deals" style={{ height: '52px', padding: '0 24px', background: '#14171F', border: '1px solid #2A303C', borderRadius: '12px', color: '#9CA3AF', fontSize: '15px', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
