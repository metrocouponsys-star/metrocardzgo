'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { isStaleContent, type PartnerStatus } from '@/lib/partnerStatus';

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
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (res.ok) setDeals(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDeals(); }, []);

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
    await fetch(`/api/admin/deals/${id}`, { method: 'DELETE', credentials: 'include' });
    await loadDeals();
    setDeleting(null);
  }

  async function handleLogout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  const filtered = deals.filter((d) => {
    const matchSearch = d.offerTitle.toLowerCase().includes(search.toLowerCase()) || d.brand.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.brand.partnerStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const staleCount  = deals.filter((d) => d.isStale).length;
  const activeCount = deals.filter((d) => d.active).length;
  const directCount = deals.filter((d) => d.brand.partnerStatus === 'direct_merchant').length;

  return (
    <div style={{ background: '#0D0F12', minHeight: '100dvh', color: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* Top nav */}
      <header style={{ background: '#14171F', borderBottom: '1px solid #2A303C', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/go" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#D4AF37' }}>Metro Cardz</span>
          </Link>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Deals',  href: '/admin/deals' },
              { label: 'Brands', href: '/admin/brands' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ padding: '6px 14px', borderRadius: '9999px', background: item.href === '/admin/deals' ? '#1C212B' : 'transparent', border: item.href === '/admin/deals' ? '1px solid #D4AF37' : '1px solid transparent', color: item.href === '/admin/deals' ? '#FFF3D6' : '#9CA3AF', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/admin/deals/new"
            style={{ height: '36px', padding: '0 16px', background: 'linear-gradient(135deg, #E5C158, #D4AF37)', borderRadius: '9999px', color: '#0D0F12', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            + Add Deal
          </Link>
          <button onClick={handleLogout} style={{ height: '36px', padding: '0 14px', background: 'transparent', border: '1px solid #2A303C', borderRadius: '9999px', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Deals',    value: deals.length,  icon: '📋', highlight: false },
            { label: 'Active',         value: activeCount,   icon: '✅', highlight: false },
            { label: 'Stale Content',  value: staleCount,    icon: '⚠️', highlight: staleCount > 0 },
            { label: 'Direct Merchant', value: directCount,  icon: '⭐', highlight: false },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background:   '#14171F',
                border:       `1px solid ${stat.highlight ? 'rgba(245,158,11,0.4)' : '#2A303C'}`,
                borderRadius: '14px',
                padding:      '16px',
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
              }}
            >
              <span style={{ fontSize: '22px' }}>{stat.icon}</span>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: stat.highlight ? '#F59E0B' : '#FFFFFF' }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stale content warning */}
        {staleCount > 0 && (
          <div
            style={{
              background:   'rgba(245,158,11,0.08)',
              border:       '1px solid rgba(245,158,11,0.3)',
              borderRadius: '12px',
              padding:      '14px 16px',
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B' }}>Mandatory Compliance Engine Alert</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{staleCount} deal(s) have not been verified in the last 30 days. Please verify these offers to ensure accuracy.</div>
            </div>
          </div>
        )}

        {/* Search + filter bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#14171F', border: '1px solid #2A303C', borderRadius: '10px', padding: '0 14px', height: '44px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="5" stroke="#6B7280" strokeWidth="1.5" /><path d="M11 11l2.5 2.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <input
              type="search"
              placeholder="Search deals or brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: '14px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PartnerStatus | 'all')}
            style={{ height: '44px', background: '#14171F', border: '1px solid #2A303C', borderRadius: '10px', color: '#F8FAFC', fontSize: '13px', padding: '0 14px', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
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
          <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>Loading deals...</div>
        ) : (
          <div style={{ background: '#14171F', border: '1px solid #2A303C', borderRadius: '16px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1C212B', borderBottom: '1px solid #2A303C' }}>
                  {['BRAND', 'CATEGORY', 'OFFER', 'PARTNER TIER', 'VERIFIED', 'CLICKS', 'ACTIVE', 'ACTIONS'].map((h) => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', color: '#6B7280', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((deal, idx) => {
                  const stale = deal.isStale;
                  const verifiedDays = Math.floor((Date.now() - new Date(deal.lastVerifiedDate).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr
                      key={deal.id}
                      style={{
                        background:   stale ? 'rgba(245,158,11,0.03)' : idx % 2 === 0 ? '#14171F' : '#111419',
                        borderBottom: '1px solid #1C212B',
                        transition:   'background 0.1s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#1C212B'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = stale ? 'rgba(245,158,11,0.03)' : idx % 2 === 0 ? '#14171F' : '#111419'; }}
                    >
                      {/* Brand */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '14px' }}>{deal.brand.name}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>{deal.brand.city}</div>
                      </td>
                      {/* Category */}
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#9CA3AF' }}>{deal.brand.category}</td>
                      {/* Offer */}
                      <td style={{ padding: '12px 14px', maxWidth: '220px' }}>
                        <div style={{ fontSize: '13px', color: '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.offerTitle}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>ID #{deal.id}</div>
                      </td>
                      {/* Partner tier */}
                      <td style={{ padding: '12px 14px' }}>
                        <PartnerBadge status={deal.brand.partnerStatus} />
                      </td>
                      {/* Verified */}
                      <td style={{ padding: '12px 14px' }}>
                        {stale ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span style={{ color: '#F59E0B', fontSize: '12px' }}>⚠</span>
                              <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600 }}>{verifiedDays}d ago</span>
                            </div>
                            <button
                              onClick={() => {/* mark verified */}}
                              style={{ fontSize: '10px', color: '#D4AF37', background: 'transparent', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '9999px', padding: '2px 8px', cursor: 'pointer' }}
                            >
                              VERIFY NOW
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#34D399' }}>{verifiedDays === 0 ? 'Today' : `${verifiedDays}d ago`}</span>
                        )}
                      </td>
                      {/* Clicks */}
                      <td style={{ padding: '12px 14px', fontSize: '13px', color: '#9CA3AF', textAlign: 'right' }}>{deal.clicks}</td>
                      {/* Active toggle */}
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          onClick={() => toggleActive(deal)}
                          style={{
                            width:        '42px',
                            height:       '24px',
                            borderRadius: '9999px',
                            background:   deal.active ? '#D4AF37' : '#2A303C',
                            border:       'none',
                            cursor:       'pointer',
                            position:     'relative',
                            transition:   'background 0.2s',
                          }}
                          aria-label={deal.active ? 'Deactivate' : 'Activate'}
                        >
                          <span style={{ position: 'absolute', top: '3px', left: deal.active ? '21px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s' }} />
                        </button>
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link
                            href={`/admin/deals/${deal.id}/edit`}
                            style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#1C212B', border: '1px solid #2A303C', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '14px' }}
                            title="Edit"
                          >
                            ✏️
                          </Link>
                          <button
                            onClick={() => softDelete(deal.id)}
                            disabled={deleting === deal.id}
                            style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#1C212B', border: '1px solid rgba(186,26,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer' }}
                            title="Deactivate (soft delete)"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                      No deals match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
