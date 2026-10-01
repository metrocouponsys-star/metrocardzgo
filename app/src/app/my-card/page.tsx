'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NFCCardReplica } from '@/components/deals/NFCCardReplica';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { BottomNav } from '@/components/deals/BottomNav';

// Demo member data — in production this comes from /api/v1/public/member via Hostinger MySQL
const DEMO_MEMBER = {
  name:       'Rahul Sharma',
  email:      'rahul.s@gmail.com',
  serialLast: '8821',
  cardSerial: '47829182938821',
  tier:       'GOLD VIP',
  points:     2840,
  usageCount: 47,
  status:     'Founder',
  validThru:  '12/28',
  referralCode: 'RAHUL9X5K',
};

const SAVED_DEALS = [
  { id: 1, brand: "Wet'nJoy Water Park", city: 'Lonavala', offer: '40% OFF Wave Passes', partnerStatus: 'direct_merchant' as const, saved: '2d ago' },
  { id: 2, brand: 'Smaaash VIP Arcade',  city: 'Mumbai',   offer: '50% Off Unlimited Bowling', partnerStatus: 'direct_merchant' as const, saved: '5d ago' },
];

export default function MyCardPage() {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyMemberId() {
    navigator.clipboard.writeText(DEMO_MEMBER.cardSerial).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ background: '#0D0F12', minHeight: '100dvh', color: '#F8FAFC', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>

      {/* Top nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(13,15,18,0.95)', borderBottom: '1px solid #2A303C', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: '#D4AF37' }}>Metro Cardz</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: '#6B7280', fontWeight: 600 }}>MY CARD</div>
          </div>
          <button style={{ background: '#14171F', border: '1px solid #2A303C', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#9CA3AF', fontSize: '14px' }} aria-label="Settings">⚙️</button>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 16px 100px' }}>

        {/* Member header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          {/* Avatar */}
          <div
            style={{
              width:           '56px',
              height:          '56px',
              borderRadius:    '50%',
              background:      'linear-gradient(135deg, #D4AF37 0%, #1C212B 100%)',
              border:          '2px solid #D4AF37',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        '24px',
              flexShrink:      0,
              boxShadow:       '0 0 20px -4px rgba(212,175,55,0.4)',
            }}
          >
            👤
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
              {DEMO_MEMBER.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: '"Space Mono", monospace', fontSize: '11px', color: '#9CA3AF' }}>
                CARD #MC-{DEMO_MEMBER.serialLast}
              </span>
              <span style={{ background: '#1C212B', border: '1px solid #D4AF37', color: '#FFF3D6', fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '9999px', letterSpacing: '0.08em' }}>
                {DEMO_MEMBER.tier}
              </span>
            </div>
          </div>
        </div>

        {/* NFC Card Replica */}
        <div style={{ marginBottom: '16px' }}>
          <NFCCardReplica
            memberName={DEMO_MEMBER.name}
            serialNumber={DEMO_MEMBER.cardSerial}
            validThru={DEMO_MEMBER.validThru}
            tier={DEMO_MEMBER.tier}
          />
        </div>

        {/* Card action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => setShowQr(!showQr)}
            style={{
              height:         '48px',
              background:     showQr ? '#1C212B' : 'linear-gradient(135deg, #E5C158, #D4AF37)',
              border:         '1px solid #D4AF37',
              borderRadius:   '12px',
              color:          showQr ? '#FFF3D6' : '#0D0F12',
              fontSize:       '13px',
              fontWeight:     700,
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '6px',
            }}
          >
            📱 {showQr ? 'Hide QR' : 'Show Card QR'}
          </button>
          <button
            onClick={copyMemberId}
            style={{
              height:         '48px',
              background:     '#1C212B',
              border:         '1px solid #2A303C',
              borderRadius:   '12px',
              color:          copied ? '#34D399' : '#F8FAFC',
              fontSize:       '13px',
              fontWeight:     600,
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '6px',
            }}
          >
            {copied ? '✓ Copied!' : '🔗 Copy Member ID'}
          </button>
        </div>

        {/* QR placeholder */}
        {showQr && (
          <div
            style={{
              background:   '#14171F',
              border:       '1px solid #3F3722',
              borderRadius: '16px',
              padding:      '24px',
              textAlign:    'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ width: '128px', height: '128px', background: '#0D0F12', borderRadius: '8px', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
              📲
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: '"Space Mono", monospace' }}>
              {DEMO_MEMBER.cardSerial}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'POINTS', value: DEMO_MEMBER.points.toLocaleString(), icon: '🏆' },
            { label: 'DEALS USED', value: `${DEMO_MEMBER.usageCount} ×`, icon: '✓' },
            { label: 'STATUS', value: DEMO_MEMBER.status, icon: '⭐' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background:   '#14171F',
                border:       '1px solid #2A303C',
                borderRadius: '12px',
                padding:      '14px 10px',
                textAlign:    'center',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>{stat.value}</div>
              <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: '#6B7280', fontWeight: 700 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Saved Deals & Passes */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>Saved Deals &amp; Passes</h2>
            <Link href="/go" style={{ fontSize: '12px', color: '#D4AF37', textDecoration: 'none' }}>Browse →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SAVED_DEALS.map((deal) => (
              <div
                key={deal.id}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  background:     '#14171F',
                  border:         '1px solid #2A303C',
                  borderRadius:   '12px',
                  padding:        '12px 16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '2px' }}>{deal.brand}</div>
                  <div style={{ fontSize: '12px', color: '#E5C158', fontWeight: 600 }}>{deal.offer}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{deal.city} • Saved {deal.saved}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <PartnerBadge status={deal.partnerStatus} showIcon={false} />
                  <Link href={`/deal/${deal.id}`} style={{ fontSize: '12px', color: '#D4AF37', textDecoration: 'none', fontWeight: 600 }}>View →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Privileges / Referral */}
        <div
          style={{
            background:   '#14171F',
            border:       '1px solid #3F3722',
            borderRadius: '16px',
            padding:      '16px',
            marginBottom: '20px',
            boxShadow:    '0 0 16px -4px rgba(212,175,55,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>🎁</span>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: '#D4AF37' }}>Invite &amp; Earn</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '12px', lineHeight: '20px' }}>
            Share your referral code and earn 500 points for every new member who activates their card.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0D0F12', border: '1px solid #2A303C', borderRadius: '10px', padding: '10px 14px', marginBottom: '10px' }}>
            <span style={{ fontFamily: '"Space Mono", monospace', fontSize: '16px', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em' }}>
              {DEMO_MEMBER.referralCode}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(DEMO_MEMBER.referralCode); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '14px', marginLeft: 'auto' }}
              aria-label="Copy referral code"
            >
              📋
            </button>
          </div>
        </div>

        {/* Support links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { icon: '💳', label: 'Card Replacement', desc: '2-3 business days' },
            { icon: '📞', label: '24/7 Concierge', desc: 'Priority member line' },
          ].map((item) => (
            <button
              key={item.label}
              style={{
                background:   '#14171F',
                border:       '1px solid #2A303C',
                borderRadius: '12px',
                padding:      '14px',
                cursor:       'pointer',
                textAlign:    'left',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginBottom: '2px' }}>{item.label}</div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>{item.desc}</div>
            </button>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
