'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { type PartnerStatus } from '@/lib/partnerStatus';

interface DealRow {
  id: number;
  offerTitle: string;
  offerType: string;
  active: boolean;
  featured: boolean;
  lastVerifiedDate: string;
  endDate: string;
  isStale: boolean;
  clicks: number;
  brand: {
    id: number;
    name: string;
    logoUrl: string | null;
    partnerStatus: PartnerStatus;
    category: string;
    city: string;
  };
}

const T = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  orange: '#EA580C',
  orangeLight: '#FFF7ED',
  orangeBorder: '#FFEDD5',
  green: '#10B981',
  greenLight: '#ECFDF5',
  greenBorder: '#A7F3D0',
  amber: '#F59E0B',
  amberLight: '#FFFBEB',
  amberBorder: '#FDE68A',
  shadowSm: '0 1px 3px rgba(0,0,0,0.05)',
};

export default function AdminDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PartnerStatus | 'all'>('all');
  const [deleting, setDeleting] = useState<number | null>(null);

  async function loadDeals() {
    try {
      const res = await fetch('/api/admin/deals', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (res.ok) setDeals(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeals();
  }, []);

  async function toggleActive(deal: DealRow) {
    await fetch(`/api/admin/deals/${deal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active: !deal.active }),
    });
    await loadDeals();
  }

  async function softDelete(id: number) {
    if (!confirm('Deactivate this deal? (Soft delete — click history is preserved)')) return;
    setDeleting(id);
    await fetch(`/api/admin/deals/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await loadDeals();
    setDeleting(null);
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const filtered = deals.filter((d) => {
    const matchSearch =
      d.offerTitle.toLowerCase().includes(search.toLowerCase()) ||
      d.brand.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.brand.partnerStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const staleCount = deals.filter((d) => d.isStale).length;
  const activeCount = deals.filter((d) => d.active).length;
  const directCount = deals.filter((d) => d.brand.partnerStatus === 'direct_merchant').length;

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', color: T.text, fontFamily: '"Inter", system-ui, sans-serif' }}>
      {/* Top Header Bar */}
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
              { label: 'Deals', href: '/admin/deals', active: true },
              { label: 'Brands & Members', href: '/admin/brands' },
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/admin/deals/new"
            style={{
              height: '38px',
              padding: '0 16px',
              background: T.orange,
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add Deal
          </Link>
          <button
            onClick={handleLogout}
            style={{
              height: '38px',
              padding: '0 14px',
              background: '#FFFFFF',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              color: T.textMuted,
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em', color: T.text }}>
            Deals Management
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: T.textMuted }}>
            Create, verify, and monitor consumer deals and promotions across Mumbai.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Deals', value: deals.length, icon: 'local_offer', color: T.text, bg: T.card },
            { label: 'Active Deals', value: activeCount, icon: 'check_circle', color: T.green, bg: T.card },
            { label: 'Stale Content (>30d)', value: staleCount, icon: 'warning', color: T.amber, bg: T.card, alert: staleCount > 0 },
            { label: 'Direct Merchants', value: directCount, icon: 'storefront', color: T.orange, bg: T.card },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: stat.bg,
                border: `1px solid ${stat.alert ? T.amberBorder : T.border}`,
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: T.shadowSm,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: stat.alert ? T.amberLight : T.bg,
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{stat.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: T.textMuted, marginTop: '2px' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              maxWidth: 440,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              padding: '0 14px',
              height: '42px',
              boxShadow: T.shadowSm,
            }}
          >
            <span className="material-symbols-outlined" style={{ color: T.textLight, fontSize: 18 }}>search</span>
            <input
              type="search"
              placeholder="Search deals or brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PartnerStatus | 'all')}
            style={{
              height: '42px',
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              color: T.text,
              fontSize: '13px',
              padding: '0 14px',
              cursor: 'pointer',
              boxShadow: T.shadowSm,
              fontFamily: 'inherit',
            }}
          >
            <option value="all">All Partner Tiers</option>
            <option value="direct_merchant">Direct Merchant</option>
            <option value="authorised_partner">Authorised Partner</option>
            <option value="affiliate">Affiliate</option>
            <option value="public_link">Public Link</option>
          </select>
        </div>

        {/* Deals table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: T.textMuted, background: T.card, borderRadius: 16, border: `1px solid ${T.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>progress_activity</span>
            <p style={{ marginTop: 8, fontSize: 13 }}>Loading deals...</p>
          </div>
        ) : (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: T.shadowSm }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}` }}>
                    {['BRAND', 'CATEGORY', 'OFFER TITLE', 'PARTNER TIER', 'LAST VERIFIED', 'CLICKS', 'STATUS', 'ACTIONS'].map((h) => (
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
                  {filtered.map((deal, idx) => {
                    const verifiedDays = Math.floor(
                      (Date.now() - new Date(deal.lastVerifiedDate).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <tr
                        key={deal.id}
                        style={{
                          background: deal.isStale ? '#FFFDF5' : '#FFFFFF',
                          borderBottom: idx === filtered.length - 1 ? 'none' : `1px solid ${T.borderLight}`,
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = deal.isStale ? '#FFFDF5' : '#FFFFFF';
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: T.text, fontSize: '14px' }}>{deal.brand.name}</div>
                          <div style={{ fontSize: '12px', color: T.textMuted }}>{deal.brand.city}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: T.textMuted }}>{deal.brand.category}</td>
                        <td style={{ padding: '14px 16px', maxWidth: '240px' }}>
                          <div style={{ fontSize: '13px', color: T.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {deal.offerTitle}
                          </div>
                          <div style={{ fontSize: '11px', color: T.textLight, marginTop: '2px', fontFamily: 'monospace' }}>
                            ID #{deal.id}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <PartnerBadge status={deal.brand.partnerStatus} />
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {deal.isStale ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: T.amberLight,
                                border: `1px solid ${T.amberBorder}`,
                                color: T.amber,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              ⚠ {verifiedDays}d ago
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: T.green, fontWeight: 600 }}>
                              {verifiedDays === 0 ? 'Today' : `${verifiedDays}d ago`}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: T.text, fontWeight: 700 }}>
                          <span style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: 6 }}>
                            {deal.clicks}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => toggleActive(deal)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              border: `1px solid ${deal.active ? T.greenBorder : T.border}`,
                              background: deal.active ? T.greenLight : '#F1F5F9',
                              color: deal.active ? T.green : T.textMuted,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {deal.active ? '● Active' : '○ Inactive'}
                          </button>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link
                              href={`/admin/deals/${deal.id}/edit`}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: '#F1F5F9',
                                color: T.text,
                                textDecoration: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                              title="Edit deal"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => softDelete(deal.id)}
                              disabled={deleting === deal.id}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                background: 'transparent',
                                border: 'none',
                                color: T.textLight,
                                cursor: 'pointer',
                              }}
                              title="Delete deal"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                        No deals match your search or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
