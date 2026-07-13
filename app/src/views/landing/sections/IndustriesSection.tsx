'use client';

import React, { useEffect, useRef, useState } from 'react';

// ─── Industry data ────────────────────────────────────────────────────────────
// Top 4: show real card image peek
// Remaining: show SVG line-art background pattern
const INDUSTRIES = [
  {
    id: 'retail',
    label: 'Retail Stores',
    icon: '🛍️',
    span: 'col-span-2',
    bg: 'from-blue-950/60 to-indigo-950/60',
    border: 'rgba(99,102,241,0.25)',
    href: '/retail-gift-cards/',
    cardImage: '/images/cards/membership.png',
    type: 'card-peek',
  },
  {
    id: 'restaurant',
    label: 'Restaurants & Cafés',
    icon: '🍽️',
    span: 'col-span-1',
    bg: 'from-orange-950/60 to-red-950/60',
    border: 'rgba(251,146,60,0.25)',
    href: '/restaurant-loyalty-cards/',
    cardImage: '/images/cards/restaurant.jpeg',
    type: 'card-peek',
  },
  {
    id: 'salon',
    label: 'Salons & Spas',
    icon: '💇',
    span: 'col-span-1',
    bg: 'from-pink-950/60 to-rose-950/60',
    border: 'rgba(244,114,182,0.25)',
    href: '/salon-membership-cards/',
    cardImage: '/images/cards/salon.jpeg',
    type: 'card-peek',
  },
  {
    id: 'super',
    label: 'Supermarkets',
    icon: '🛒',
    span: 'col-span-2',
    bg: 'from-violet-950/60 to-purple-950/60',
    border: 'rgba(167,139,250,0.25)',
    href: '/supermarket-loyalty-cards/',
    cardImage: '/images/cards/supermarket.jpeg',
    type: 'card-peek',
  },
  {
    id: 'gym',
    label: 'Gyms & Fitness',
    icon: '🏋️',
    span: 'col-span-1',
    bg: 'from-green-950/60 to-emerald-950/60',
    border: 'rgba(74,222,128,0.2)',
    href: '/gym-membership-cards/',
    cardImage: '/images/cards/gym.jpeg',
    type: 'card-peek',
  },
  {
    id: 'hospital',
    label: 'Hospitals & Clinics',
    icon: '🏥',
    span: 'col-span-1',
    bg: 'from-cyan-950/60 to-teal-950/60',
    border: 'rgba(34,211,238,0.2)',
    href: '/hospital-health-cards/',
    cardImage: '/images/cards/healthcare.jpeg',
    type: 'card-peek',
  },
  {
    id: 'corporate',
    label: 'Corporate',
    icon: '🏢',
    span: 'col-span-1',
    bg: 'from-slate-900/60 to-gray-900/60',
    border: 'rgba(148,163,184,0.2)',
    href: '/corporate-id-cards/',
    cardImage: '/images/cards/vip.jpeg',
    type: 'card-peek',
  },
  {
    id: 'auto',
    label: 'Two-Wheeler & Auto',
    icon: '🏍️',
    span: 'col-span-1',
    bg: 'from-lime-950/60 to-green-950/60',
    border: 'rgba(163,230,53,0.2)',
    href: '#contact',
    cardImage: '/images/cards/automotive.jpeg',
    type: 'card-peek',
  },
  {
    id: 'tutorial',
    label: 'Tutorial Classes',
    icon: '📚',
    span: 'col-span-1',
    bg: 'from-amber-950/60 to-yellow-950/60',
    border: 'rgba(251,191,36,0.2)',
    href: '#contact',
    cardImage: '/images/cards/gift.jpeg',
    type: 'card-peek',
  },
  {
    id: 'garments',
    label: 'Readymade Garments',
    icon: '👔',
    span: 'col-span-1',
    bg: 'from-red-950/60 to-rose-950/60',
    border: 'rgba(251,113,133,0.2)',
    href: '#contact',
    cardImage: '/images/cards/jewellery.jpeg',
    type: 'card-peek',
  },
];


// ─── Line-art SVG patterns per industry ──────────────────────────────────────
const IndustryPattern = ({ pattern }: { pattern: string }) => {
  const paths: Record<string, React.ReactNode> = {
    gym: (
      // Dumbbell + diagonal speed lines
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="10" y="36" width="8" height="16" rx="3" stroke="#C9A227" strokeWidth="1.2"/>
        <rect x="6" y="33" width="8" height="22" rx="3" stroke="#C9A227" strokeWidth="1"/>
        <rect x="102" y="36" width="8" height="16" rx="3" stroke="#C9A227" strokeWidth="1.2"/>
        <rect x="106" y="33" width="8" height="22" rx="3" stroke="#C9A227" strokeWidth="1"/>
        <line x1="18" y1="44" x2="102" y2="44" stroke="#C9A227" strokeWidth="2" strokeLinecap="round"/>
        <line x1="30" y1="20" x2="50" y2="60" stroke="#C9A227" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.5"/>
        <line x1="50" y1="20" x2="70" y2="60" stroke="#C9A227" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.5"/>
        <line x1="70" y1="20" x2="90" y2="60" stroke="#C9A227" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.5"/>
      </svg>
    ),
    hospital: (
      // Medical cross + ECG heartbeat line
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="48" y="20" width="24" height="48" rx="4" stroke="#C9A227" strokeWidth="1.2"/>
        <rect x="36" y="32" width="48" height="24" rx="4" stroke="#C9A227" strokeWidth="1.2"/>
        <path d="M10 55 L25 55 L32 35 L40 68 L50 48 L58 55 L110 55"
          stroke="#C9A227" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    corporate: (
      // Building lines + grid
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="35" y="10" width="50" height="65" rx="2" stroke="#C9A227" strokeWidth="1.2"/>
        <line x1="35" y1="25" x2="85" y2="25" stroke="#C9A227" strokeWidth="0.7"/>
        <line x1="35" y1="38" x2="85" y2="38" stroke="#C9A227" strokeWidth="0.7"/>
        <line x1="35" y1="51" x2="85" y2="51" stroke="#C9A227" strokeWidth="0.7"/>
        <line x1="55" y1="10" x2="55" y2="75" stroke="#C9A227" strokeWidth="0.7"/>
        <line x1="70" y1="10" x2="70" y2="75" stroke="#C9A227" strokeWidth="0.7"/>
        {/* Windows */}
        <rect x="41" y="15" width="8" height="6" rx="1" stroke="#C9A227" strokeWidth="0.6"/>
        <rect x="60" y="15" width="8" height="6" rx="1" stroke="#C9A227" strokeWidth="0.6"/>
        <rect x="41" y="30" width="8" height="6" rx="1" stroke="#C9A227" strokeWidth="0.6"/>
        <rect x="60" y="30" width="8" height="6" rx="1" stroke="#C9A227" strokeWidth="0.6"/>
      </svg>
    ),
    auto: (
      // Motorcycle silhouette outline
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Front wheel */}
        <circle cx="90" cy="55" r="16" stroke="#C9A227" strokeWidth="1.2"/>
        <circle cx="90" cy="55" r="5" stroke="#C9A227" strokeWidth="0.8"/>
        {/* Rear wheel */}
        <circle cx="30" cy="55" r="16" stroke="#C9A227" strokeWidth="1.2"/>
        <circle cx="30" cy="55" r="5" stroke="#C9A227" strokeWidth="0.8"/>
        {/* Frame */}
        <path d="M30 55 L50 30 L70 30 L90 55" stroke="#C9A227" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M60 30 L75 18 L85 30" stroke="#C9A227" strokeWidth="1" strokeLinecap="round"/>
        {/* Handlebar */}
        <path d="M80 28 L92 22" stroke="#C9A227" strokeWidth="1" strokeLinecap="round"/>
        {/* Seat */}
        <path d="M50 30 Q60 26 70 30" stroke="#C9A227" strokeWidth="1.2" strokeLinecap="round"/>
        {/* Speed lines */}
        <line x1="0" y1="50" x2="18" y2="50" stroke="#C9A227" strokeWidth="0.7" strokeLinecap="round" opacity="0.6"/>
        <line x1="0" y1="55" x2="12" y2="55" stroke="#C9A227" strokeWidth="0.7" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
    tutorial: (
      // Open book + pencil
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Open book */}
        <path d="M20 20 L60 15 L60 70 L20 75 Z" stroke="#C9A227" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M60 15 L100 20 L100 75 L60 70 Z" stroke="#C9A227" strokeWidth="1.2" strokeLinejoin="round"/>
        <line x1="60" y1="15" x2="60" y2="70" stroke="#C9A227" strokeWidth="1.5"/>
        {/* Page lines left */}
        <line x1="28" y1="30" x2="56" y2="28" stroke="#C9A227" strokeWidth="0.6"/>
        <line x1="28" y1="38" x2="56" y2="36" stroke="#C9A227" strokeWidth="0.6"/>
        <line x1="28" y1="46" x2="56" y2="44" stroke="#C9A227" strokeWidth="0.6"/>
        {/* Page lines right */}
        <line x1="64" y1="28" x2="92" y2="30" stroke="#C9A227" strokeWidth="0.6"/>
        <line x1="64" y1="36" x2="92" y2="38" stroke="#C9A227" strokeWidth="0.6"/>
        <line x1="64" y1="44" x2="92" y2="46" stroke="#C9A227" strokeWidth="0.6"/>
        {/* Pencil */}
        <path d="M100 15 L110 5 L115 10 L105 20 Z" stroke="#C9A227" strokeWidth="0.8" strokeLinejoin="round"/>
        <line x1="100" y1="15" x2="105" y2="20" stroke="#C9A227" strokeWidth="0.8"/>
      </svg>
    ),
    garments: (
      // Shirt/hanger outline
      <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Hanger */}
        <path d="M60 12 Q60 5 68 8 Q72 10 70 15" stroke="#C9A227" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M60 15 L20 32 L30 40 L45 33 L45 72 L75 72 L75 33 L90 40 L100 32 L60 15"
          stroke="#C9A227" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
        {/* Collar */}
        <path d="M50 33 Q60 42 70 33" stroke="#C9A227" strokeWidth="1" strokeLinecap="round"/>
        {/* Button line */}
        <line x1="60" y1="42" x2="60" y2="70" stroke="#C9A227" strokeWidth="0.7" strokeDasharray="2 3"/>
        <circle cx="60" cy="48" r="1.5" stroke="#C9A227" strokeWidth="0.6"/>
        <circle cx="60" cy="56" r="1.5" stroke="#C9A227" strokeWidth="0.6"/>
        <circle cx="60" cy="64" r="1.5" stroke="#C9A227" strokeWidth="0.6"/>
      </svg>
    ),
  };
  return paths[pattern] ?? null;
};

// ─── Individual tile ──────────────────────────────────────────────────────────
const IndustryTile = React.forwardRef<
  HTMLAnchorElement,
  { ind: typeof INDUSTRIES[0]; index: number }
>(({ ind, index }, ref) => {
  const [hovered, setHovered] = useState(false);
  const isWide = ind.span === 'col-span-2';

  return (
    <a
      ref={ref}
      href={ind.href}
      className={`reveal-up group relative rounded-2xl overflow-hidden cursor-pointer ${isWide ? 'sm:col-span-2' : 'col-span-1'}`}
      style={{
        minHeight: isWide ? 164 : 136,
        background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)',
        border: `1px solid ${hovered ? ind.border.replace('0.2', '0.6').replace('0.25', '0.7') : ind.border}`,
        transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s ease, border-color 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 48px rgba(0,0,0,0.5), 0 4px 16px ${ind.border}` : 'none',
        display: 'block',
        textDecoration: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${ind.bg}`} />

      {/* ── CARD PEEK (top 4 industries) ─────────────────────────── */}
      {ind.type === 'card-peek' && ind.cardImage && (
        <div
          className="absolute"
          style={{
            right: isWide ? -10 : -14,
            bottom: isWide ? -18 : -20,
            width: isWide ? 180 : 155,
            height: isWide ? 114 : 97,
            transform: hovered
              ? 'rotate(-10deg) scale(1.05) translateY(-4px)'
              : 'rotate(-12deg) scale(1)',
            transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
            zIndex: 1,
          }}
        >
          {/* Fade-out mask so the card bleeds off the edge cleanly */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 10,
              background: 'linear-gradient(135deg, transparent 35%, rgba(13,13,13,0.7) 100%)',
              zIndex: 2,
            }}
          />
          <img
            src={ind.cardImage}
            alt={ind.label}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              opacity: hovered ? 1 : 0.82,
              transition: 'opacity 0.28s ease',
            }}
          />
        </div>
      )}

      {/* ── LINE-ART PATTERN (remaining industries) ───────────────── */}
      {ind.type === 'pattern' && ind.pattern && (
        <div
          className="absolute"
          style={{
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '75%',
            height: '80%',
            opacity: hovered ? 0.15 : 0.1,
            transition: 'opacity 0.28s ease',
            zIndex: 1,
          }}
        >
          <IndustryPattern pattern={ind.pattern} />
        </div>
      )}

      {/* ── Icon badge (all tiles) ─────────────────────────────────── */}
      <div
        className="absolute top-3 left-3 flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(201,162,39,0.15)',
          border: '1px solid rgba(201,162,39,0.3)',
          transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
          transform: hovered ? 'scale(1.12)' : 'scale(1)',
          zIndex: 3,
        }}
      >
        <span style={{ fontSize: 14 }}>{ind.icon}</span>
      </div>

      {/* ── Text block ────────────────────────────────────────────── */}
      <div className="absolute bottom-3 left-4 right-4" style={{ zIndex: 3 }}>
        <p className="font-poppins font-bold text-warm-white text-sm leading-tight">{ind.label}</p>

        {/* "Custom Cards Available" — fades out; "View Cards →" fades in on hover */}
        <div style={{ position: 'relative', height: 16, marginTop: 4, overflow: 'hidden' }}>
          <p
            className="text-xs tracking-wider absolute inset-0"
            style={{
              color: 'rgba(201,162,39,0.55)',
              opacity: hovered ? 0 : 1,
              transition: 'opacity 0.18s ease',
            }}
          >
            Custom Cards Available
          </p>
          <p
            className="text-xs font-semibold absolute inset-0"
            style={{
              color: '#C9A227',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.2s ease 0.05s, transform 0.2s ease 0.05s',
            }}
          >
            View Cards →
          </p>
        </div>
      </div>
    </a>
  );
});

IndustryTile.displayName = 'IndustryTile';

// ─── Section ──────────────────────────────────────────────────────────────────
export const IndustriesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const tilesRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = tilesRef.current.indexOf(entry.target as HTMLAnchorElement);
            setTimeout(() => entry.target.classList.add('visible'), idx * 60);
          }
        });
      },
      { threshold: 0.1 }
    );
    tilesRef.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="industries" ref={sectionRef} className="py-24" style={{ background: '#0D0D0D' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Every Business</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            Industries <span className="text-gold-gradient">We Serve</span>
          </h2>
          <p className="text-warm-grey text-base max-w-xl mx-auto">
            From retail chains to neighbourhood salons — we've designed membership cards for every kind of business.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-fr">
          {INDUSTRIES.map((ind, i) => (
            <IndustryTile
              key={ind.id}
              ind={ind}
              index={i}
              ref={el => { tilesRef.current[i] = el; }}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
