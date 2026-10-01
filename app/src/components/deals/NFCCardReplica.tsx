'use client';

/**
 * NFCCardReplica — physical NFC card mimic hero component.
 *
 * Standard credit card aspect ratio (1.586:1).
 * Visual finish: radial obsidian brushed gradient + auric gold border.
 * Features: NFC pulse animation, masked serial number, Metro Cardz branding.
 * Used on /my-card page as the identity hero element.
 */

interface NFCCardReplicaProps {
  memberName: string;
  serialNumber: string;   // last 4 digits shown, rest masked
  validThru?: string;     // e.g. "12/26"
  tier?: string;          // e.g. "GOLD VIP"
  className?: string;
}

export function NFCCardReplica({
  memberName,
  serialNumber,
  validThru = '12/28',
  tier = 'GOLD VIP',
  className = '',
}: NFCCardReplicaProps) {
  // Show only last 4 digits
  const maskedSerial = `•••• •••• •••• ${serialNumber.slice(-4)}`;

  return (
    <div
      className={`relative select-none ${className}`}
      style={{
        aspectRatio:  '1.586 / 1',
        borderRadius: '16px',
        background:   'radial-gradient(ellipse at 30% 30%, #1C212B 0%, #0D0F12 70%)',
        border:       '1px solid #D4AF37',
        boxShadow:    '0 0 32px 2px rgba(229,193,88,0.15), 0 16px 48px rgba(0,0,0,0.7)',
        overflow:     'hidden',
        // NFC breathing animation on the border
        animation:    'nfcBreathe 3s ease-in-out infinite',
      }}
      role="img"
      aria-label={`Metro Cardz ${tier} physical card for ${memberName}`}
    >
      {/* Brushed metal texture overlay */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          inset:      0,
          background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 6px)',
          borderRadius: 'inherit',
        }}
      />

      {/* Gold foil edge highlight */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          inset:      0,
          borderRadius: 'inherit',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, transparent 40%, transparent 60%, rgba(212,175,55,0.06) 100%)',
        }}
      />

      {/* Card content */}
      <div style={{ position: 'relative', height: '100%', padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

        {/* Top row: Logo + Tier badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width:          '28px',
                height:         '28px',
                borderRadius:   '6px',
                background:     'linear-gradient(135deg, #D4AF37 0%, #E9C349 100%)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="4" width="12" height="8" rx="1.5" stroke="#0D0F12" strokeWidth="1.2" />
                <path d="M2 7h12" stroke="#0D0F12" strokeWidth="1" />
                <circle cx="12" cy="10.5" r="1" fill="#0D0F12" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.05em', lineHeight: 1 }}>
                METRO CARDZ
              </div>
              <div style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '9px', color: '#9CA3AF', letterSpacing: '0.08em', lineHeight: 1, marginTop: '2px' }}>
                EXCLUSIVE PRESTIGE
              </div>
            </div>
          </div>

          {/* Tier badge */}
          <span
            style={{
              fontFamily:    '"Plus Jakarta Sans", sans-serif',
              fontSize:      '9px',
              fontWeight:    700,
              letterSpacing: '0.08em',
              color:         '#0D0F12',
              background:    'linear-gradient(135deg, #E5C158 0%, #D4AF37 100%)',
              padding:       '3px 8px',
              borderRadius:  '9999px',
            }}
          >
            {tier}
          </span>
        </div>

        {/* Middle: Chip + NFC icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* EMV chip */}
          <div
            aria-hidden="true"
            style={{
              width:        '28px',
              height:       '22px',
              background:   'linear-gradient(135deg, #D4AF37 0%, #8A6914 100%)',
              borderRadius: '4px',
              border:       '1px solid rgba(212,175,55,0.3)',
            }}
          />

          {/* NFC pulse icon */}
          <div style={{ position: 'relative', width: '24px', height: '24px' }} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 12c0-2.21 1.79-4 4-4" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M5 12c0-3.87 3.13-7 7-7" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              <path d="M2 12c0-5.52 4.48-10 10-10" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
              <circle cx="12" cy="12" r="2" fill="#D4AF37" />
            </svg>
          </div>

          <span style={{ fontSize: '10px', color: '#6B7280', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '0.05em' }}>
            TAP & PAY AUTHORIZED
          </span>
        </div>

        {/* Bottom: Serial + Name */}
        <div>
          <div
            style={{
              fontFamily:    '"Space Mono", monospace',
              fontSize:      '14px',
              color:         '#F8FAFC',
              letterSpacing: '0.1em',
              marginBottom:  '8px',
            }}
            aria-label={`Card number ending in ${serialNumber.slice(-4)}`}
          >
            {maskedSerial}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '9px', color: '#6B7280', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '0.08em', marginBottom: '2px' }}>
                CARDHOLDER
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.03em' }}>
                {memberName.toUpperCase()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: '#6B7280', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '0.08em', marginBottom: '2px' }}>
                VALID THRU
              </div>
              <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '12px', color: '#D4AF37', fontWeight: 700 }}>
                {validThru}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
