'use client';

import { useState, useEffect, useRef } from 'react';
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

// Light-theme design tokens matching the GO Admin shell
const T = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  orangeDark: '#EA580C',
  inputBg: '#F9FAFB',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
  red: '#EF4444',
  redBg: '#FEF2F2',
};

export function DealForm({ initialData, dealId, isEdit = false }: DealFormProps) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUploading, setImageUploading] = useState(false);
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

  // ── Image file upload handler ──────────────────────────────────────────────
  function handleImageFile(file: File) {
    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const maxDim = 900;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          update('heroImageUrl', canvas.toDataURL('image/jpeg', 0.85));
        } else {
          update('heroImageUrl', ev.target?.result as string);
        }
        setImageUploading(false);
      };
      img.onerror = () => {
        update('heroImageUrl', ev.target?.result as string);
        setImageUploading(false);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
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

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width:        '100%',
    height:       '42px',
    background:   T.inputBg,
    border:       `1px solid ${hasError ? '#FECACA' : T.border}`,
    borderRadius: '10px',
    padding:      '0 12px',
    color:        T.text,
    fontSize:     '14px',
    outline:      'none',
    fontFamily:   '"Inter", system-ui, sans-serif',
    boxSizing:    'border-box' as const,
    transition:   'border-color 0.15s',
  });

  const labelStyle: React.CSSProperties = {
    display:       'block',
    fontSize:      '11px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    color:         T.textMuted,
    marginBottom:  '5px',
    textTransform: 'uppercase',
  };

  function field(label: string, id: string, content: React.ReactNode, error?: string) {
    return (
      <div>
        <label htmlFor={id} style={labelStyle}>{label}</label>
        {content}
        {error && (
          <div style={{ fontSize: '12px', color: T.red, marginTop: '4px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>error</span>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, fontFamily: '"Inter", system-ui, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: 56,
        boxShadow: T.shadow,
      }}>
        <Link
          href="/admin/deals"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: T.textMuted,
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Back
        </Link>
        <div style={{ width: 1, height: 20, background: T.border }} />
        <div style={{ fontWeight: 800, fontSize: '16px', color: T.text }}>
          {isEdit ? 'Edit Deal' : 'New Deal'}
        </div>
        {isEdit && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.orange,
              background: T.orangeLight,
              border: `1px solid #FDE8CC`,
              borderRadius: 6,
              padding: '2px 7px',
              letterSpacing: '0.06em',
            }}
          >
            EDITING
          </div>
        )}
      </header>

      {/* ── Form Body ──────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px 48px', boxSizing: 'border-box' }}>

        {errors._form && (
          <div style={{
            background: T.redBg,
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '13px',
            color: T.red,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>error</span>
            {errors._form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Brand Section ─────────────────────────────────────────── */}
          <section style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: '14px',
            padding: '20px',
            boxShadow: T.shadow,
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: T.text, marginBottom: '16px', letterSpacing: '-0.01em' }}>
              Brand
            </h2>

            {field('Brand *', 'brandId',
              <select
                id="brandId"
                value={form.brandId}
                onChange={(e) => update('brandId', e.target.value)}
                required
                style={{ ...inputStyle(!!errors.brandId), cursor: 'pointer', appearance: 'none' }}
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
                <span style={{ fontSize: '12px', color: T.textMuted }}>{selectedBrand.category} · {selectedBrand.city}</span>
              </div>
            )}
          </section>

          {/* ── Offer Details ─────────────────────────────────────────── */}
          <section style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: '14px',
            padding: '20px',
            boxShadow: T.shadow,
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: T.text, marginBottom: '16px', letterSpacing: '-0.01em' }}>
              Offer Details
            </h2>
            <div style={{ display: 'grid', gap: '14px' }}>

              {field('Offer Title *', 'offerTitle',
                <input
                  id="offerTitle"
                  type="text"
                  value={form.offerTitle}
                  onChange={(e) => update('offerTitle', e.target.value)}
                  required
                  placeholder="e.g. 40% Off All Wave Pool Passes"
                  style={inputStyle(!!errors.offerTitle)}
                />,
                errors.offerTitle
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {field('Offer Type *', 'offerType',
                  <select
                    id="offerType"
                    value={form.offerType}
                    onChange={(e) => update('offerType', e.target.value)}
                    style={{ ...inputStyle(), cursor: 'pointer', appearance: 'none' }}
                  >
                    {OFFER_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                )}
                {field('Percentage (if applicable)', 'offerPercentage',
                  <input
                    id="offerPercentage"
                    type="number"
                    min="1"
                    max="100"
                    value={form.offerPercentage}
                    onChange={(e) => update('offerPercentage', e.target.value)}
                    placeholder="e.g. 40"
                    style={inputStyle()}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {field('Start Date *', 'startDate',
                  <input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => update('startDate', e.target.value)}
                    required
                    style={inputStyle(!!errors.startDate)}
                  />,
                  errors.startDate
                )}
                {field('End Date *', 'endDate',
                  <input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => update('endDate', e.target.value)}
                    required
                    style={inputStyle(!!errors.endDate)}
                  />,
                  errors.endDate
                )}
              </div>

              {field('Booking URL', 'bookingUrl',
                <input
                  id="bookingUrl"
                  type="url"
                  value={form.bookingUrl}
                  onChange={(e) => update('bookingUrl', e.target.value)}
                  placeholder="https://..."
                  style={inputStyle()}
                />
              )}

              {field(
                `Affiliate URL${selectedBrand?.partnerStatus === 'affiliate' ? ' *' : ''}`,
                'affiliateUrl',
                <input
                  id="affiliateUrl"
                  type="url"
                  value={form.affiliateUrl}
                  onChange={(e) => update('affiliateUrl', e.target.value)}
                  placeholder="https://..."
                  style={inputStyle(!!errors.affiliateUrl)}
                />,
                errors.affiliateUrl
              )}

              {/* ── Hero Image — URL + File Upload ────────────────────── */}
              {/* ── Deal Image — JPG / PNG File Upload (Not URL) ────────────────────── */}
              <div>
                <label style={labelStyle}>Deal Image (JPG / JPEG / PNG)</label>
                {/* Hidden file input */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,.jpeg,.jpg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                    e.target.value = '';
                  }}
                />

                {form.heroImageUrl ? (
                  <div
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: `1px solid ${T.border}`,
                      position: 'relative',
                      background: '#0F172A',
                    }}
                  >
                    <img
                      src={form.heroImageUrl}
                      alt="Deal JPG preview"
                      style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                      }}
                    >
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(6px)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#0F172A',
                        }}
                      >
                        JPG Photo Loaded
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={imageUploading}
                          style={{
                            background: '#FFFFFF',
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            color: '#0F172A',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>photo_camera</span>
                          Change JPG
                        </button>
                        <button
                          type="button"
                          onClick={() => update('heroImageUrl', '')}
                          style={{
                            background: '#EF4444',
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            color: '#FFFFFF',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${T.border}`,
                      borderRadius: 14,
                      padding: '28px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      cursor: imageUploading ? 'wait' : 'pointer',
                      background: T.inputBg,
                      transition: 'all 0.2s',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 32, color: T.orange }}
                    >
                      {imageUploading ? 'progress_activity' : 'add_photo_alternate'}
                    </span>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>
                      {imageUploading ? 'Optimizing JPG image…' : 'Click to select JPG photo'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>
                      Upload directly from your device (.jpg, .jpeg, .png) · auto-compressed for speed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Terms & Settings ──────────────────────────────────────── */}
          <section style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: '14px',
            padding: '20px',
            boxShadow: T.shadow,
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 800, color: T.text, marginBottom: '16px', letterSpacing: '-0.01em' }}>
              Terms &amp; Settings
            </h2>
            <div style={{ display: 'grid', gap: '14px' }}>

              {field('Offer Terms', 'terms',
                <textarea
                  id="terms"
                  value={form.terms}
                  onChange={(e) => update('terms', e.target.value)}
                  rows={4}
                  placeholder="Valid on weekends and public holidays only. Max 2 passes per card..."
                  style={{
                    ...inputStyle(),
                    height: 'auto',
                    padding: '10px 12px',
                    resize: 'vertical',
                    lineHeight: '1.5',
                  }}
                />
              )}

              {field('Last Verified Date *', 'lastVerifiedDate',
                <input
                  id="lastVerifiedDate"
                  type="date"
                  value={form.lastVerifiedDate}
                  onChange={(e) => update('lastVerifiedDate', e.target.value)}
                  required
                  style={inputStyle(!!errors.lastVerifiedDate)}
                />,
                errors.lastVerifiedDate
              )}

              {/* Toggles */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { id: 'featured', label: 'Featured Deal', desc: 'Appears on Flash Privilege banner', icon: 'star' },
                  { id: 'active',   label: 'Active',        desc: 'Visible to public', icon: 'visibility' },
                ].map(({ id, label, desc, icon }) => {
                  const checked = !!(form as unknown as Record<string, unknown>)[id];
                  return (
                    <label
                      key={id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        flex: '1 1 180px',
                        background: checked ? T.orangeLight : T.inputBg,
                        border: `1px solid ${checked ? '#FDE8CC' : T.border}`,
                        borderRadius: 10,
                        padding: '10px 12px',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => update(id as keyof DealFormData, !checked)}
                    >
                      {/* Custom checkbox */}
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          background: checked ? T.orange : '#fff',
                          border: `2px solid ${checked ? T.orange : T.border}`,
                          borderRadius: '5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s',
                        }}
                      >
                        {checked && (
                          <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>
                            check
                          </span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: checked ? T.orangeDark : T.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: checked ? T.orange : T.textLight, fontVariationSettings: "'FILL' 1" }}>
                            {icon}
                          </span>
                          {label}
                        </div>
                        <div style={{ fontSize: '11px', color: T.textMuted, marginTop: 1 }}>{desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Action Buttons ────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                height: '48px',
                background: saving ? T.border : `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`,
                border: 'none',
                borderRadius: '12px',
                color: saving ? T.textMuted : '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 4px 14px rgba(249,115,22,0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              {saving && (
                <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 0.8s linear infinite' }}>
                  progress_activity
                </span>
              )}
              {saving ? 'Saving…' : isEdit ? 'Update Deal' : 'Create Deal'}
            </button>
            <Link
              href="/admin/deals"
              style={{
                height: '48px',
                padding: '0 20px',
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: '12px',
                color: T.textMuted,
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                boxShadow: T.shadow,
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
