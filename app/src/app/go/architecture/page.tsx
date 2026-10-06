'use client';

const separationCards = [
  {
    title: 'Metro Cardz GO',
    text: 'Customer discovery app for offers, categories, redemption, merchant scanning, and admin deal operations.',
    accent: '#EA580C',
  },
  {
    title: 'Legacy Metro Cardz',
    text: 'Membership, wallet, loyalty cards, points, and historical member operations remain separate.',
    accent: '#0F172A',
  },
  {
    title: 'Identity bridge',
    text: 'Read-only data sync for “My Card” only. No shared session, no shared database tables, no shared auth.',
    accent: '#F59E0B',
  },
];

const flowSteps = [
  'Customer lands on Metro Cardz GO and browses city and category-based offers.',
  'Member verifies mobile via OTP and receives a digital membership card.',
  'Customer clicks Get Coupon to generate a valid QR token for the selected deal.',
  'Merchant scans the QR and validates coupon status before redemption.',
  'Admin manages brands, merchants, offers, and reporting from a separate operational layer.',
];

const statuses = [
  ['PUBLIC LINK', 'Directory-only listing; no official partner claim.'],
  ['AFFILIATE', 'Approved referral path only.'],
  ['AUTHORISED PARTNER', 'Approved brand usage and partner permissions only.'],
  ['DIRECT MERCHANT', 'Formal business relationship and full direct access.'],
];

export default function GoArchitecturePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F6F3EE', color: '#111827', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 80px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: 999, background: '#FFF7ED', border: '1px solid #F9D2B0', color: '#C2410C', fontWeight: 800, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            System architecture
          </div>
          <h1 style={{ margin: '16px 0 10px', fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.06em', fontWeight: 800 }}>
            Metro Cardz GO product boundary
          </h1>
          <p style={{ margin: 0, maxWidth: 760, color: '#52525B', fontSize: 17, lineHeight: 1.7 }}>
            The app must be treated as a separate product from the legacy loyalty platform, with a single read-only identity bridge for member data.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 32 }}>
          {separationCards.map((card) => (
            <div key={card.title} style={{ background: '#fff', border: '1px solid #EAE3DD', borderRadius: 24, padding: 22, boxShadow: '0 14px 24px rgba(17, 24, 39, 0.04)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 999, background: card.accent, marginBottom: 12 }} />
              <h2 style={{ margin: '0 0 10px', fontSize: 22, letterSpacing: '-0.04em' }}>{card.title}</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#52525B' }}>{card.text}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #EAE3DD', borderRadius: 28, padding: 24, boxShadow: '0 16px 30px rgba(17,24,39,0.04)', marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 28, letterSpacing: '-0.05em' }}>Core workflow</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {flowSteps.map((step, index) => (
              <div key={step} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 14px', background: '#F9F7F5', borderRadius: 18, border: '1px solid #F1E7DF' }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                  {index + 1}
                </div>
                <p style={{ margin: 0, color: '#1F2937', lineHeight: 1.6, fontSize: 15 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #EAE3DD', borderRadius: 28, padding: 24, boxShadow: '0 16px 30px rgba(17,24,39,0.04)' }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 28, letterSpacing: '-0.05em' }}>Partner governance</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {statuses.map(([status, rule]) => (
              <div key={status} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, padding: '14px 16px', background: '#F9F7F5', borderRadius: 18, border: '1px solid #F1E7DF' }}>
                <div style={{ fontWeight: 800, color: '#C2410C', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 12, alignSelf: 'center' }}>{status}</div>
                <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.6 }}>{rule}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
