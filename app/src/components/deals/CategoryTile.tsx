'use client';

interface CategoryTileProps {
  name: string;
  slug: string;
  icon: string;
  bestOffer?: string;   // e.g. "40% OFF" or "1+1 DEAL"
  brands?: string;      // e.g. "Wet'nJoy, Imagicaa"
  onClick?: () => void;
  href?: string;
}

import Link from 'next/link';

/**
 * CategoryTile — icon-led tappable tile for the NFC landing /go page.
 * 2×4 grid layout. Gold offer badge top-right.
 * Matches the nfc_landing_go Stitch screen design exactly.
 */
export function CategoryTile({
  name, slug, icon, bestOffer, brands, onClick, href
}: CategoryTileProps) {
  const dest = href ?? `/category/${slug}`;

  return (
    <Link
      href={dest}
      onClick={onClick}
      className="block animate-card-reveal active:scale-95 transition-transform"
      style={{
        background:     '#14171F',
        border:         '1px solid #2A303C',
        borderRadius:   '16px',
        padding:        '16px',
        position:       'relative',
        overflow:       'hidden',
        minHeight:      '120px',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'space-between',
        textDecoration: 'none',
        cursor:         'pointer',
        transition:     'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(212,175,55,0.4)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 20px -2px rgba(212,175,55,0.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = '#2A303C';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
      }}
      aria-label={`Browse ${name} deals${bestOffer ? ` — ${bestOffer}` : ''}`}
    >
      {/* Offer badge — top right */}
      {bestOffer && (
        <span
          style={{
            position:       'absolute',
            top:            '10px',
            right:          '10px',
            background:     'rgba(212,175,55,0.15)',
            border:         '1px solid rgba(212,175,55,0.35)',
            color:          '#E5C158',
            fontSize:       '10px',
            fontWeight:     700,
            letterSpacing:  '0.06em',
            fontFamily:     '"Plus Jakarta Sans", sans-serif',
            padding:        '2px 8px',
            borderRadius:   '9999px',
            lineHeight:     '16px',
          }}
        >
          {bestOffer}
        </span>
      )}

      {/* Icon */}
      <div
        style={{
          width:          '40px',
          height:         '40px',
          background:     '#1C212B',
          border:         '1px solid #2A303C',
          borderRadius:   '10px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '20px',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Text */}
      <div>
        <div
          style={{
            fontFamily:     'Syne, sans-serif',
            fontSize:       '16px',
            fontWeight:     600,
            color:          '#FFFFFF',
            lineHeight:     '22px',
            marginBottom:   '2px',
          }}
        >
          {name}
        </div>
        {brands && (
          <div
            style={{
              fontSize:   '11px',
              color:      '#6B7280',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              lineHeight: '14px',
              overflow:   'hidden',
              display:    '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical' as const,
            }}
          >
            {brands}
          </div>
        )}
      </div>
    </Link>
  );
}
