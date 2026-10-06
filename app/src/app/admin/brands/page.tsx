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

interface GoMember {
  id: string;
  memberCode: string;
  name: string;
  phone: string;
  email: string | null;
  joinedDate: string;
  expiryDate: string;
  daysRemaining: number;
  validityStatus: 'active' | 'expiring_soon' | 'expired';
  tierName: string;
  merchantName: string;
  loyaltyPoints: number;
  notes: string | null;
}

const PARTNER_STATUSES: PartnerStatus[] = ['direct_merchant', 'authorised_partner', 'affiliate', 'public_link'];
const STATUS_LABELS: Record<PartnerStatus, string> = {
  direct_merchant: 'Direct Merchant',
  authorised_partner: 'Authorised Partner',
  affiliate: 'Affiliate',
  public_link: 'Public Link',
};

// Design tokens — Clean White Theme
const T = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  orange: '#EA580C',
  orangeHover: '#C2410C',
  orangeLight: '#FFF7ED',
  orangeBorder: '#FFEDD5',
  green: '#10B981',
  greenLight: '#ECFDF5',
  greenBorder: '#A7F3D0',
  amber: '#F59E0B',
  amberLight: '#FFFBEB',
  amberBorder: '#FDE68A',
  red: '#EF4444',
  redLight: '#FEF2F2',
  redBorder: '#FECACA',
  shadowSm: '0 1px 3px rgba(0,0,0,0.05)',
  shadowMd: '0 4px 14px rgba(0,0,0,0.06)',
};

export default function AdminBrandsAndMembersPage() {
  const router = useRouter();

  // Main active top tab: 'brands' vs 'members'
  const [activeTab, setActiveTab] = useState<'brands' | 'members'>('brands');

  // ── Brands State ──────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [cities, setCities] = useState<Array<{ id: number; name: string; slug: string }>>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandFormError, setBrandFormError] = useState('');

  const [brandForm, setBrandForm] = useState({
    name: '',
    categoryId: '',
    cityId: '',
    partnerStatus: '' as PartnerStatus | '',
    description: '',
    website: '',
    instagram: '',
    phone: '',
    mapsUrl: '',
    active: true,
  });

  // ── GO 1-Year Members State ───────────────────────────────────────────────
  const [members, setMembers] = useState<GoMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');
  const [memberStats, setMemberStats] = useState({
    totalCount: 0,
    activeCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
  });

  // Add Member Modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [memberFormError, setMemberFormError] = useState('');
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    tierName: 'GO 1-Year Pass',
    joinedDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  // Reminder Modal
  const [reminderMember, setReminderMember] = useState<GoMember | null>(null);
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [reminderSuccess, setReminderSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Load Brands Data
  async function loadBrandsData() {
    try {
      const [brandsRes, catRes, citiesRes] = await Promise.all([
        fetch('/api/admin/brands', { credentials: 'include' }),
        fetch('/api/categories'),
        fetch('/api/cities'),
      ]);
      if (brandsRes.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (brandsRes.ok) setBrands(await brandsRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (citiesRes.ok) setCities(await citiesRes.json());
    } finally {
      setBrandsLoading(false);
    }
  }

  // Load GO Members Data
  async function loadMembersData() {
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/admin/go-members?search=${encodeURIComponent(memberSearch)}&filter=${memberFilter}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        if (data.stats) setMemberStats(data.stats);
      }
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    loadBrandsData();
    loadMembersData();
  }, []);

  useEffect(() => {
    loadMembersData();
  }, [memberFilter]);

  // Brand Actions
  async function saveBrand(e: React.FormEvent) {
    e.preventDefault();
    setSavingBrand(true);
    setBrandFormError('');

    const res = await fetch('/api/admin/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...brandForm, categoryId: Number(brandForm.categoryId), cityId: Number(brandForm.cityId) }),
    });

    const data = await res.json();
    if (res.ok) {
      setShowBrandForm(false);
      setBrandForm({
        name: '',
        categoryId: '',
        cityId: '',
        partnerStatus: '',
        description: '',
        website: '',
        instagram: '',
        phone: '',
        mapsUrl: '',
        active: true,
      });
      await loadBrandsData();
    } else {
      setBrandFormError(data.message ?? 'Failed to save brand');
    }
    setSavingBrand(false);
  }

  async function toggleActive(brand: BrandRow) {
    await fetch(`/api/admin/brands/${brand.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active: !brand.active }),
    });
    await loadBrandsData();
  }

  // Member Actions: Add Member
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberForm.name.trim()) {
      setMemberFormError('Please enter member name');
      return;
    }
    const cleanPhone = newMemberForm.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setMemberFormError('Please enter a valid 10-digit mobile number');
      return;
    }

    setSavingMember(true);
    setMemberFormError('');

    try {
      const res = await fetch('/api/admin/go-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newMemberForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setMemberFormError(data.message || 'Failed to create member');
        return;
      }

      setShowAddMember(false);
      setNewMemberForm({
        name: '',
        phone: '',
        email: '',
        tierName: 'GO 1-Year Pass',
        joinedDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
      });
      await loadMembersData();
    } catch {
      setMemberFormError('Network error while creating member');
    } finally {
      setSavingMember(false);
    }
  }

  // Member Actions: Renew +1 Year
  async function handleRenewMember(memberId: string) {
    if (!confirm('Extend this member pass for 1 full year (+365 days)?')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/go-members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: memberId, action: 'renew_1_year' }),
      });
      if (res.ok) {
        await loadMembersData();
        if (reminderMember && reminderMember.id === memberId) {
          setReminderSuccess('Member pass renewed for +1 Year successfully!');
          setTimeout(() => setReminderMember(null), 1200);
        }
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Member Actions: Delete
  async function handleDeleteMember(memberId: string, memberName: string) {
    if (!confirm(`Are you sure you want to remove member ${memberName}?`)) return;
    await fetch(`/api/admin/go-members?id=${encodeURIComponent(memberId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await loadMembersData();
  }

  // Compose Reminder Message
  const getReminderMessage = (m: GoMember) => {
    const daysText = m.daysRemaining <= 0 ? 'has expired' : `expires in ${m.daysRemaining} days`;
    return `Hello ${m.name}! Your 1-Year Metro Cardz GO membership pass (${m.memberCode}) ${daysText} on ${m.expiryDate}. Renew your membership today to continue enjoying exclusive 40% OFF dining, resorts, water parks, and 25+ partner brands across Mumbai! Renew online at: https://metrocardz.com/go/login`;
  };

  // Filtered Brands
  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
      b.city.toLowerCase().includes(brandSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '42px',
    background: '#FFFFFF',
    border: `1px solid ${T.border}`,
    borderRadius: '10px',
    padding: '0 14px',
    color: T.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, fontFamily: '"Inter", system-ui, sans-serif' }}>
      {/* ── Top Header Bar (White Theme) ─────────────────────────────────── */}
      <header
        style={{
          background: T.card,
          borderBottom: `1px solid ${T.border}`,
          padding: '0 24px',
          height: '58px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: T.shadowSm,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '15px',
              }}
            >
              M
            </div>
            <div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>
                Metro Cardz GO
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: T.orange,
                  background: T.orangeLight,
                  border: `1px solid ${T.orangeBorder}`,
                  borderRadius: '6px',
                  padding: '1px 6px',
                  marginLeft: '8px',
                }}
              >
                ADMIN
              </span>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Dashboard', href: '/admin' },
              { label: 'Deals', href: '/admin/deals' },
              { label: 'Brands & Members', href: '/admin/brands', active: true },
              { label: 'Cards', href: '/admin/cards' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: item.active ? T.orangeLight : 'transparent',
                  color: item.active ? T.orange : T.textMuted,
                  fontSize: '13px',
                  fontWeight: item.active ? 700 : 500,
                  textDecoration: 'none',
                  border: `1px solid ${item.active ? T.orangeBorder : 'transparent'}`,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/go"
            target="_blank"
            style={{
              fontSize: '12px',
              color: T.textMuted,
              textDecoration: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              open_in_new
            </span>
            View GO Site
          </Link>
          <button
            onClick={logout}
            style={{
              background: '#FFFFFF',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              color: T.textMuted,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Page Title & Tab Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: '22px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em', color: T.text }}>
              Platform Operations
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: T.textMuted }}>
              Manage partner brands, onboard GO 1-year members, and trigger annual renewal reminders.
            </p>
          </div>

          {/* Primary Top Tab Switcher */}
          <div
            style={{
              display: 'flex',
              background: '#FFFFFF',
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              padding: '4px',
              boxShadow: T.shadowSm,
            }}
          >
            <button
              onClick={() => setActiveTab('brands')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'brands' ? T.orangeLight : 'transparent',
                color: activeTab === 'brands' ? T.orange : T.textMuted,
                fontWeight: activeTab === 'brands' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>storefront</span>
              Partner Brands ({brands.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'members' ? T.orangeLight : 'transparent',
                color: activeTab === 'members' ? T.orange : T.textMuted,
                fontWeight: activeTab === 'members' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>badge</span>
              GO Members (1-Yr Passes)
              {memberStats.expiringSoonCount > 0 && (
                <span
                  style={{
                    background: T.amber,
                    color: '#fff',
                    borderRadius: 999,
                    fontSize: 10,
                    padding: '1px 6px',
                    fontWeight: 800,
                  }}
                >
                  {memberStats.expiringSoonCount} due
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: BRANDS & PARTNERS
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'brands' && (
          <div>
            {/* Quick stats for partner statuses */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              {PARTNER_STATUSES.map((status) => {
                const count = brands.filter((b) => b.partnerStatus === status).length;
                return (
                  <div
                    key={status}
                    style={{
                      background: T.card,
                      border: `1px solid ${T.border}`,
                      borderRadius: '14px',
                      padding: '16px 18px',
                      boxShadow: T.shadowSm,
                    }}
                  >
                    <div style={{ marginBottom: '10px' }}>
                      <PartnerBadge status={status} />
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>{count}</div>
                    <div style={{ fontSize: '12px', color: T.textMuted, marginTop: '2px' }}>{STATUS_LABELS[status]}</div>
                  </div>
                );
              })}
            </div>

            {/* Brand Search & Add Brand Toolbar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: '12px',
                  padding: '0 14px',
                  height: '42px',
                  flex: 1,
                  maxWidth: '440px',
                  boxShadow: T.shadowSm,
                }}
              >
                <span className="material-symbols-outlined" style={{ color: T.textLight, fontSize: 18 }}>search</span>
                <input
                  type="search"
                  placeholder="Search brands by name, city, category..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: T.text,
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                onClick={() => setShowBrandForm(true)}
                style={{
                  height: '42px',
                  padding: '0 18px',
                  background: T.orange,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: T.shadowSm,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                Add Brand
              </button>
            </div>

            {/* Brands Table */}
            {brandsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted, background: T.card, borderRadius: 16, border: `1px solid ${T.border}` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>progress_activity</span>
                <p style={{ marginTop: 8, fontSize: 13 }}>Loading brands...</p>
              </div>
            ) : (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: T.shadowSm }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}` }}>
                        {['BRAND', 'CATEGORY', 'CITY', 'PARTNER TIER', 'DEALS', 'STATUS', 'ACTIONS'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: '11px',
                              letterSpacing: '0.06em',
                              color: T.textMuted,
                              fontWeight: 700,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBrands.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: T.textMuted, fontSize: 13 }}>
                            No brands found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredBrands.map((brand, idx) => (
                          <tr
                            key={brand.id}
                            style={{
                              borderBottom: idx === filteredBrands.length - 1 ? 'none' : `1px solid ${T.borderLight}`,
                              background: '#FFFFFF',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLTableRowElement).style.background = '#FFFFFF';
                            }}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontWeight: 700, color: T.text, fontSize: '14px' }}>{brand.name}</div>
                              {brand.website && (
                                <a
                                  href={brand.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '11px', color: T.orange, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2, marginTop: 2 }}
                                >
                                  <span>Website</span>
                                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>open_in_new</span>
                                </a>
                              )}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: T.textMuted }}>{brand.category}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: T.textMuted }}>{brand.city}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <PartnerBadge status={brand.partnerStatus} />
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: T.text, fontWeight: 700 }}>
                              <span style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: 6 }}>
                                {brand.dealCount}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <button
                                onClick={() => toggleActive(brand)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 999,
                                  border: `1px solid ${brand.active ? T.greenBorder : T.border}`,
                                  background: brand.active ? T.greenLight : '#F1F5F9',
                                  color: brand.active ? T.green : T.textMuted,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {brand.active ? '● Active' : '○ Inactive'}
                              </button>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <Link
                                href={`/admin/deals?brand=${brand.id}`}
                                style={{
                                  fontSize: '12px',
                                  color: T.orange,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                }}
                              >
                                Manage Deals →
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: GO PLATFORM MEMBERS (1-YEAR VALIDITY & REMINDERS)
           ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'members' && (
          <div>
            {/* 1-Year Expiry Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '14px', padding: '16px 18px', boxShadow: T.shadowSm }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: T.textMuted, marginBottom: 8 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Total GO Members</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.orange }}>group</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: T.text }}>{memberStats.totalCount}</div>
                <div style={{ fontSize: '11px', color: T.textLight, marginTop: 4 }}>Registered on GO Platform</div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.greenBorder}`, borderRadius: '14px', padding: '16px 18px', boxShadow: T.shadowSm }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: T.green, marginBottom: 8 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Active (1-Yr Pass)</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>verified</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: T.green }}>{memberStats.activeCount}</div>
                <div style={{ fontSize: '11px', color: T.textMuted, marginTop: 4 }}>More than 30 days remaining</div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.amberBorder}`, borderRadius: '14px', padding: '16px 18px', boxShadow: T.shadowSm }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: T.amber, marginBottom: 8 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Expiring Soon (≤30 Days)</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notification_important</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: T.amber }}>{memberStats.expiringSoonCount}</div>
                <div style={{ fontSize: '11px', color: T.amber, fontWeight: 600, marginTop: 4 }}>1-Year Reminder Required!</div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.redBorder}`, borderRadius: '14px', padding: '16px 18px', boxShadow: T.shadowSm }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: T.red, marginBottom: 8 }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Expired Passes</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>event_busy</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: T.red }}>{memberStats.expiredCount}</div>
                <div style={{ fontSize: '11px', color: T.textMuted, marginTop: 4 }}>Passed 1-Year mark — needs renewal</div>
              </div>
            </div>

            {/* Member Search, Filter Pills & Add Button */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: '12px',
                    padding: '0 14px',
                    height: '42px',
                    width: '320px',
                    boxShadow: T.shadowSm,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: T.textLight, fontSize: 18 }}>search</span>
                  <input
                    type="search"
                    placeholder="Search by name, phone, code..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadMembersData()}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: T.text,
                      fontSize: '13px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: 6, background: '#FFFFFF', padding: 4, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'active', label: '🟢 Active' },
                    { key: 'expiring_soon', label: '🟡 Expiring Soon' },
                    { key: 'expired', label: '🔴 Expired' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setMemberFilter(f.key as any)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '7px',
                        border: 'none',
                        background: memberFilter === f.key ? T.orangeLight : 'transparent',
                        color: memberFilter === f.key ? T.orange : T.textMuted,
                        fontWeight: memberFilter === f.key ? 700 : 500,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowAddMember(true)}
                style={{
                  height: '42px',
                  padding: '0 18px',
                  background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(234,88,12,0.2)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                Add Member (1-Yr Pass)
              </button>
            </div>

            {/* Members Table with 1-Year Validity & Reminders */}
            {membersLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted, background: T.card, borderRadius: 16, border: `1px solid ${T.border}` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>progress_activity</span>
                <p style={{ marginTop: 8, fontSize: 13 }}>Loading GO members...</p>
              </div>
            ) : (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: T.shadowSm }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}` }}>
                        {['MEMBER', 'PASS CODE & TIER', 'JOINED', '1-YR EXPIRY', 'VALIDITY / COUNTDOWN', 'ANNUAL REMINDERS & ACTIONS'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontSize: '11px',
                              letterSpacing: '0.06em',
                              color: T.textMuted,
                              fontWeight: 700,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: T.textMuted, fontSize: 13 }}>
                            No GO members found matching the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        members.map((m, idx) => {
                          const isExpired = m.validityStatus === 'expired';
                          const isExpiringSoon = m.validityStatus === 'expiring_soon';

                          return (
                            <tr
                              key={m.id}
                              style={{
                                borderBottom: idx === members.length - 1 ? 'none' : `1px solid ${T.borderLight}`,
                                background: isExpiringSoon ? '#FFFDF5' : isExpired ? '#FFF8F8' : '#FFFFFF',
                                transition: 'background 0.15s ease',
                              }}
                            >
                              {/* Member info */}
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: 10,
                                      background: T.orangeLight,
                                      border: `1px solid ${T.orangeBorder}`,
                                      color: T.orange,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: 14,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: T.text, fontSize: '14px' }}>{m.name}</div>
                                    <div style={{ fontSize: '12px', color: T.textMuted, fontFamily: 'monospace' }}>
                                      +91 {m.phone}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Pass Code & Tier */}
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 700, color: T.text, fontSize: '13px', fontFamily: 'monospace' }}>
                                  {m.memberCode}
                                </div>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: T.orange,
                                    background: T.orangeLight,
                                    borderRadius: 6,
                                    padding: '1px 6px',
                                    marginTop: 3,
                                  }}
                                >
                                  {m.tierName}
                                </span>
                              </td>

                              {/* Joined Date */}
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: T.textMuted }}>
                                {m.joinedDate}
                              </td>

                              {/* 1-Yr Expiry Date */}
                              <td style={{ padding: '14px 16px', fontSize: '13px', color: T.text, fontWeight: 600 }}>
                                {m.expiryDate}
                              </td>

                              {/* Validity Countdown */}
                              <td style={{ padding: '14px 16px' }}>
                                {isExpired ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '4px 10px',
                                      borderRadius: 999,
                                      background: T.redLight,
                                      border: `1px solid ${T.redBorder}`,
                                      color: T.red,
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>
                                    Expired ({Math.abs(m.daysRemaining)}d ago)
                                  </span>
                                ) : isExpiringSoon ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '4px 10px',
                                      borderRadius: 999,
                                      background: T.amberLight,
                                      border: `1px solid ${T.amberBorder}`,
                                      color: T.amber,
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
                                    Expiring in {m.daysRemaining} days!
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '4px 10px',
                                      borderRadius: 999,
                                      background: T.greenLight,
                                      border: `1px solid ${T.greenBorder}`,
                                      color: T.green,
                                      fontSize: 11,
                                      fontWeight: 700,
                                    }}
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                                    Active ({m.daysRemaining}d left)
                                  </span>
                                )}
                              </td>

                              {/* Reminders & Renewal Actions */}
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  {/* Send 1-Yr Reminder */}
                                  <button
                                    onClick={() => {
                                      setReminderMember(m);
                                      setReminderSuccess('');
                                    }}
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: 8,
                                      background: isExpiringSoon || isExpired ? '#25D366' : '#FFFFFF',
                                      border: isExpiringSoon || isExpired ? 'none' : `1px solid ${T.border}`,
                                      color: isExpiringSoon || isExpired ? '#FFFFFF' : T.text,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                    title="Send 1-Year Expiry Reminder via WhatsApp/SMS"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chat</span>
                                    Reminder
                                  </button>

                                  {/* Renew +1 Year */}
                                  <button
                                    onClick={() => handleRenewMember(m.id)}
                                    disabled={actionLoading}
                                    style={{
                                      padding: '5px 10px',
                                      borderRadius: 8,
                                      background: T.orangeLight,
                                      border: `1px solid ${T.orangeBorder}`,
                                      color: T.orange,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                    title="Extend membership pass for +1 Year"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>autorenew</span>
                                    Renew 1-Yr
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteMember(m.id, m.name)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: T.textLight,
                                      cursor: 'pointer',
                                      padding: 4,
                                    }}
                                    title="Delete Member"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          SLIDE-OVER / MODAL: NEW BRAND (White Theme)
         ══════════════════════════════════════════════════════════════════════ */}
      {showBrandForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)' }} onClick={() => setShowBrandForm(false)} />
          <div style={{ width: '480px', background: '#FFFFFF', borderLeft: `1px solid ${T.border}`, padding: '24px', overflowY: 'auto', boxShadow: T.shadowMd }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: T.text, margin: '0 0 2px' }}>Add Partner Brand</h2>
                <p style={{ margin: 0, fontSize: '12px', color: T.textMuted }}>Onboard a brand into Metro Cardz GO directory</p>
              </div>
              <button onClick={() => setShowBrandForm(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            {brandFormError && (
              <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: T.red, marginBottom: '16px' }}>
                ⚠ {brandFormError}
              </div>
            )}

            <form onSubmit={saveBrand} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>BRAND NAME *</label>
                <input
                  type="text"
                  placeholder="e.g. Imagicaa, Bastian, The Machan"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>CATEGORY *</label>
                <select
                  value={brandForm.categoryId}
                  onChange={(e) => setBrandForm((f) => ({ ...f, categoryId: e.target.value }))}
                  required
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>CITY *</label>
                <select
                  value={brandForm.cityId}
                  onChange={(e) => setBrandForm((f) => ({ ...f, cityId: e.target.value }))}
                  required
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select city...</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>PARTNER STATUS *</label>
                <select
                  value={brandForm.partnerStatus}
                  onChange={(e) => setBrandForm((f) => ({ ...f, partnerStatus: e.target.value as PartnerStatus }))}
                  required
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Select status tier...</option>
                  {PARTNER_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>WEBSITE</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={brandForm.website}
                  onChange={(e) => setBrandForm((f) => ({ ...f, website: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>PHONE</label>
                <input
                  type="tel"
                  placeholder="+91..."
                  value={brandForm.phone}
                  onChange={(e) => setBrandForm((f) => ({ ...f, phone: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>DESCRIPTION</label>
                <textarea
                  rows={3}
                  value={brandForm.description}
                  onChange={(e) => setBrandForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brand highlights and offerings..."
                  style={{ ...inputStyle, height: 'auto', padding: '10px 14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '10px' }}>
                <button
                  type="submit"
                  disabled={savingBrand}
                  style={{
                    flex: 1,
                    height: '44px',
                    background: T.orange,
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: savingBrand ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingBrand ? 'Saving...' : 'Save Brand'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBrandForm(false)}
                  style={{
                    height: '44px',
                    padding: '0 18px',
                    background: '#F1F5F9',
                    border: `1px solid ${T.border}`,
                    borderRadius: '10px',
                    color: T.text,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: ADD GO MEMBER (1-YEAR VALIDITY)
         ══════════════════════════════════════════════════════════════════════ */}
      {showAddMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)' }} onClick={() => setShowAddMember(false)} />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: T.shadowMd,
              boxSizing: 'border-box',
              margin: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 2px', color: T.text }}>
                  Onboard GO Member (1-Year Pass)
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: T.textMuted }}>
                  Issues an active Metro Cardz GO membership pass with 365-day validity.
                </p>
              </div>
              <button onClick={() => setShowAddMember(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {memberFormError && (
              <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: T.red, marginBottom: '14px' }}>
                ⚠ {memberFormError}
              </div>
            )}

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>FULL NAME *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>MOBILE NUMBER (10 DIGITS) *</label>
                  <input
                    type="tel"
                    placeholder="9987379000"
                    maxLength={10}
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>EMAIL ADDRESS (OPTIONAL)</label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={newMemberForm.email}
                  onChange={(e) => setNewMemberForm((f) => ({ ...f, email: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>PASS PLAN / TIER</label>
                  <select
                    value={newMemberForm.tierName}
                    onChange={(e) => setNewMemberForm((f) => ({ ...f, tierName: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="GO 1-Year Pass">GO 1-Year Pass</option>
                    <option value="GO 1-Year VIP Pass">GO 1-Year VIP Pass</option>
                    <option value="GO Family 1-Year Pass">GO Family 1-Year Pass</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>JOINED DATE</label>
                  <input
                    type="date"
                    value={newMemberForm.joinedDate}
                    onChange={(e) => {
                      const joined = new Date(e.target.value);
                      const expiry = new Date(joined);
                      expiry.setFullYear(expiry.getFullYear() + 1);
                      setNewMemberForm((f) => ({
                        ...f,
                        joinedDate: e.target.value,
                        expiryDate: expiry.toISOString().split('T')[0],
                      }));
                    }}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* 1-Year Expiry Highlight Card */}
              <div
                style={{
                  background: T.greenLight,
                  border: `1px solid ${T.greenBorder}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: T.green, fontWeight: 800, textTransform: 'uppercase' }}>
                    1-Year Pass Validity
                  </div>
                  <div style={{ fontSize: '13px', color: '#065F46', fontWeight: 700, marginTop: 2 }}>
                    Expires: {newMemberForm.expiryDate} (365 Days)
                  </div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: T.green }}>
                  verified_user
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 5 }}>NOTES</label>
                <input
                  type="text"
                  placeholder="Store location or onboarded by..."
                  value={newMemberForm.notes}
                  onChange={(e) => setNewMemberForm((f) => ({ ...f, notes: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                <button
                  type="submit"
                  disabled={savingMember}
                  style={{
                    flex: 1,
                    height: '46px',
                    background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: savingMember ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(234,88,12,0.25)',
                  }}
                >
                  {savingMember ? 'Creating...' : 'Create 1-Year Member Pass'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  style={{
                    height: '46px',
                    padding: '0 18px',
                    background: '#F1F5F9',
                    border: `1px solid ${T.border}`,
                    borderRadius: '12px',
                    color: T.text,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: 1-YEAR RENEWAL REMINDER & ACTION
         ══════════════════════════════════════════════════════════════════════ */}
      {reminderMember && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)' }} onClick={() => setReminderMember(null)} />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: T.shadowMd,
              boxSizing: 'border-box',
              margin: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 800, color: T.text }}>
                  1-Year Renewal Reminder
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: T.textMuted }}>
                  Send an annual membership renewal notice to {reminderMember.name}
                </p>
              </div>
              <button onClick={() => setReminderMember(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {/* Member Snapshot */}
            <div
              style={{
                background: reminderMember.validityStatus === 'expired' ? T.redLight : T.amberLight,
                border: `1px solid ${reminderMember.validityStatus === 'expired' ? T.redBorder : T.amberBorder}`,
                borderRadius: '14px',
                padding: '14px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: T.text }}>{reminderMember.name}</div>
                  <div style={{ fontSize: '12px', color: T.textMuted, marginTop: 2 }}>
                    Code: <strong>{reminderMember.memberCode}</strong> · +91 {reminderMember.phone}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: reminderMember.validityStatus === 'expired' ? T.red : T.amber,
                    color: '#fff',
                  }}
                >
                  {reminderMember.validityStatus === 'expired'
                    ? `Expired ${Math.abs(reminderMember.daysRemaining)}d ago`
                    : `Expires in ${reminderMember.daysRemaining}d`}
                </span>
              </div>
              <div style={{ fontSize: '12px', marginTop: 8, color: T.textMuted }}>
                Expiry Date: <strong>{reminderMember.expiryDate}</strong> (1-Year Validity Mark)
              </div>
            </div>

            {/* Channel selection */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { key: 'whatsapp', label: '💬 WhatsApp', color: '#25D366' },
                { key: 'sms', label: '📱 SMS', color: T.orange },
                { key: 'email', label: '✉️ Email', color: '#3B82F6' },
              ].map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => setReminderChannel(ch.key as any)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 8,
                    border: reminderChannel === ch.key ? `2px solid ${ch.color}` : `1px solid ${T.border}`,
                    background: reminderChannel === ch.key ? '#FFFFFF' : '#F8FAFC',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Message Template Preview */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: 6 }}>
                PREVIEW MESSAGE:
              </label>
              <div
                style={{
                  background: '#F8FAFC',
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: '13px',
                  color: '#334155',
                  lineHeight: 1.5,
                  userSelect: 'all',
                }}
              >
                {getReminderMessage(reminderMember)}
              </div>
            </div>

            {reminderSuccess && (
              <div style={{ background: T.greenLight, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: '10px 14px', fontSize: '13px', color: T.green, marginBottom: 14, fontWeight: 700 }}>
                ✓ {reminderSuccess}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reminderChannel === 'whatsapp' && (
                <a
                  href={`https://api.whatsapp.com/send?phone=91${reminderMember.phone}&text=${encodeURIComponent(getReminderMessage(reminderMember))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={async () => {
                    await fetch('/api/admin/go-members', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ id: reminderMember.id, action: 'record_reminder', channel: 'whatsapp' }),
                    });
                    setReminderSuccess('WhatsApp message triggered! Logged reminder in history.');
                  }}
                  style={{
                    height: '46px',
                    background: '#25D366',
                    borderRadius: 12,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 700,
                    fontSize: '14px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat</span>
                  Open in WhatsApp Web / App →
                </a>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getReminderMessage(reminderMember));
                    setReminderSuccess('Reminder copied to clipboard!');
                  }}
                  style={{
                    flex: 1,
                    height: '42px',
                    background: '#FFFFFF',
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    color: T.text,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
                  Copy Text
                </button>

                <button
                  onClick={() => handleRenewMember(reminderMember.id)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    height: '42px',
                    background: T.orange,
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    color: '#fff',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>autorenew</span>
                  Renew for +1 Year
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
