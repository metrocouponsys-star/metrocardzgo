'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NFCCardReplica } from '@/components/deals/NFCCardReplica';
import { PartnerBadge } from '@/components/deals/PartnerBadge';
import { BottomNav } from '@/components/deals/BottomNav';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#F8F9FA',
  card:        '#FFFFFF',
  border:      '#E5E7EB',
  borderAmber: '#FDE68A',
  text:        '#111827',
  textMuted:   '#4B5563',
  textLight:   '#6B7280',
  amberDark:   '#B45309',
  amberLight:  '#FEF3C7',
  amber:       '#C59B27',
  green:       '#047857',
  shadow:      '0 1px 4px rgba(0,0,0,0.06)',
  shadowMd:    '0 4px 16px rgba(0,0,0,0.08)',
};

// Demo member data — in production this comes from /api/v1/public/member via Hostinger MySQL
const DEMO_MEMBER = {
  name:         'Rahul Sharma',
  email:        'rahul.s@gmail.com',
  serialLast:   '8821',
  cardSerial:   '47829182938821',
  tier:         'GOLD VIP',
  points:       2840,
  usageCount:   47,
  status:       'Founder',
  validThru:    '12/28',
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
    <div style={{ background: C.bg, minHeight: '100dvh', color: C.text, fontFamily: '"Inter", sans-serif' }}>

      {/* Top nav */}
      <header style={{
        position:     'sticky',
        top:          0,
        zIndex:       40,
        background:   'rgba(255,255,255,0.97)',
        borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow:    C.shadow,
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '16px', fontWeight: 700, color: C.text }}>Metro Cardz</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: C.amberDark, fontWeight: 700 }}>MY CARD</div>
          </div>
          <button style={{
            background:   '#F9FAFB',
            border:       `1px solid ${C.border}`,
            borderRadius: '10px',
            padding:      '8px',
            cursor:       'pointer',
            color:        C.textMuted,
            fontSize:     '14px',
          }} aria-label="Settings">⚙️</button>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 16px 100px' }}>

        {/* Member header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: '14px', padding: '16px', boxShadow: C.shadow }}>
          {/* Avatar */}
          <div
            style={{
              width:          '56px',
              height:         '56px',
              borderRadius:   '50%',
              background:     `linear-gradient(135deg, ${C.amberLight} 0%, ${C.borderAmber} 100%)`,
              border:         `2px solid ${C.borderAmber}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '24px',
              flexShrink:     0,
            }}
          >
            👤
          </div>
          <div>
            <h1 style={{ fontFamily: '"Syne", sans-serif', fontSize: '18px', fontWeight: 700, color: C.text, marginBottom: '4px' }}>
              {DEMO_MEMBER.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: '"Space Mono", monospace', fontSize: '11px', color: C.textLight }}>
                CARD #MC-{DEMO_MEMBER.serialLast}
              </span>
              <span style={{
                background:    C.amberLight,
                border:        `1px solid ${C.borderAmber}`,
                color:         C.amberDark,
                fontSize:      '9px',
                fontWeight:    700,
                padding:       '1px 6px',
                borderRadius:  '9999px',
                letterSpacing: '0.08em',
              }}>
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
              background:     showQr ? C.amberLight : `linear-gradient(135deg, ${C.amber} 0%, ${C.amberDark} 100%)`,
              border:         `1px solid ${C.borderAmber}`,
              borderRadius:   '12px',
              color:          showQr ? C.amberDark : '#FFFFFF',
              fontSize:       '13px',
              fontWeight:     700,
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '6px',
              fontFamily:     '"Inter", sans-serif',
            }}
          >
            📱 {showQr ? 'Hide QR' : 'Show Card QR'}
          </button>
          <button
            onClick={copyMemberId}
            style={{
              height:         '48px',
              background:     copied ? '#ECFDF5' : '#FFFFFF',
              border:         `1px solid ${copied ? '#A7F3D0' : C.border}`,
              borderRadius:   '12px',
              color:          copied ? C.green : C.textMuted,
              fontSize:       '13px',
              fontWeight:     600,
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '6px',
              fontFamily:     '"Inter", sans-serif',
            }}
          >
            {copied ? '✓ Copied!' : '🔗 Copy Member ID'}
          </button>
        </div>

        {/* QR placeholder */}
        {showQr && (
          <div
            style={{
              background:   '#FFFFFF',
              border:       `1px solid ${C.borderAmber}`,
              borderRadius: '16px',
              padding:      '24px',
              textAlign:    'center',
              marginBottom: '20px',
              boxShadow:    C.shadow,
            }}
          >
            <div style={{ width: '128px', height: '128px', background: '#F9FAFB', borderRadius: '8px', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', border: `1px solid ${C.border}` }}>
              📲
            </div>
            <div style={{ fontSize: '12px', color: C.textLight, fontFamily: '"Space Mono", monospace' }}>
              {DEMO_MEMBER.cardSerial}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'POINTS', value: DEMO_MEMBER.points.toLocaleString(), icon: '🏆', color: C.amberDark },
            { label: 'DEALS USED', value: `${DEMO_MEMBER.usageCount} ×`, icon: '✓', color: C.green },
            { label: 'STATUS', value: DEMO_MEMBER.status, icon: '⭐', color: C.amberDark },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background:   '#FFFFFF',
                border:       `1px solid ${C.border}`,
                borderRadius: '12px',
                padding:      '14px 10px',
                textAlign:    'center',
                boxShadow:    C.shadow,
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontFamily: '"Syne", sans-serif', fontSize: '17px', fontWeight: 700, color: stat.color, marginBottom: '2px' }}>{stat.value}</div>
              <div style={{ fontSize: '9px', letterSpacing: '0.08em', color: C.textLight, fontWeight: 700 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Saved Deals & Passes */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontFamily: '"Syne", sans-serif', fontSize: '17px', fontWeight: 700, color: C.text }}>Saved Deals & Passes</h2>
            <Link href="/go" style={{ fontSize: '12px', color: C.amberDark, textDecoration: 'none', fontWeight: 700 }}>Browse →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SAVED_DEALS.map((deal) => (
              <div
                key={deal.id}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  background:     '#FFFFFF',
                  border:         `1px solid ${C.border}`,
                  borderRadius:   '12px',
                  padding:        '12px 16px',
                  boxShadow:      C.shadow,
                  transition:     'border-color 0.15s',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: C.text, marginBottom: '2px' }}>{deal.brand}</div>
                  <div style={{ fontSize: '12px', color: C.amberDark, fontWeight: 600 }}>{deal.offer}</div>
                  <div style={{ fontSize: '11px', color: C.textLight, marginTop: '2px' }}>{deal.city} • Saved {deal.saved}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <PartnerBadge status={deal.partnerStatus} showIcon={false} />
                  <Link href={`/deal/${deal.id}`} style={{ fontSize: '12px', color: C.amberDark, textDecoration: 'none', fontWeight: 700 }}>View →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Member Privileges / Referral */}
        <div
          style={{
            background:   '#FFFFFF',
            border:       `1px solid ${C.borderAmber}`,
            borderRadius: '16px',
            padding:      '16px',
            marginBottom: '20px',
            boxShadow:    '0 2px 12px rgba(197,155,39,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>🎁</span>
            <h3 style={{ fontFamily: '"Syne", sans-serif', fontSize: '15px', fontWeight: 700, color: C.amberDark }}>Invite & Earn</h3>
          </div>
          <p style={{ fontSize: '13px', color: C.textMuted, marginBottom: '12px', lineHeight: '20px' }}>
            Share your referral code and earn 500 points for every new member who activates their card.
          </p>
          <div style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '8px',
            background:    C.amberLight,
            border:        `1px solid ${C.borderAmber}`,
            borderRadius:  '10px',
            padding:       '10px 14px',
            marginBottom:  '10px',
          }}>
            <span style={{ fontFamily: '"Space Mono", monospace', fontSize: '16px', fontWeight: 700, color: C.amberDark, letterSpacing: '0.1em' }}>
              {DEMO_MEMBER.referralCode}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(DEMO_MEMBER.referralCode); }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textLight, fontSize: '14px', marginLeft: 'auto' }}
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
                background:   '#FFFFFF',
                border:       `1px solid ${C.border}`,
                borderRadius: '12px',
                padding:      '14px',
                cursor:       'pointer',
                textAlign:    'left',
                boxShadow:    C.shadow,
                fontFamily:   '"Inter", sans-serif',
              }}
            >
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{item.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: C.text, marginBottom: '2px' }}>{item.label}</div>
              <div style={{ fontSize: '11px', color: C.textLight }}>{item.desc}</div>
            </button>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
