'use client';

import React, { useEffect, useRef } from 'react';

const features = [
  {
    id: 'premium',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="16,3 20,13 31,13 22,19 25,29 16,23 7,29 10,19 1,13 12,13" />
      </svg>
    ),
    headline: 'Premium Quality',
    desc: 'PVC cards with perfect finish, sharp edges and vibrant print.',
  },
  {
    id: 'custom',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 4l8 8-16 16H4v-8L20 4z" />
        <path d="M17 7l8 8" />
      </svg>
    ),
    headline: 'Fully Customizable',
    desc: 'Your logo, colors, design — we bring your brand to life.',
  },
  {
    id: 'print',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="8" width="20" height="14" rx="2" />
        <path d="M10 8V5h12v3" />
        <rect x="10" y="17" width="12" height="7" rx="1" />
        <circle cx="24" cy="13" r="1" fill="#C9A227" />
      </svg>
    ),
    headline: 'Advanced Printing',
    desc: 'Gold foil, holograms, QR codes, chip — all in one card.',
  },
  {
    id: 'benefits',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3z" />
        <path d="M11 16l3.5 3.5L21 11" />
      </svg>
    ),
    headline: 'Member Benefits',
    desc: 'Loyalty programs, offers grid, and discounts embedded in every card.',
  },
];

export const TrustStripSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = itemsRef.current.indexOf(entry.target as HTMLDivElement);
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, idx * 120);
          }
        });
      },
      { threshold: 0.2 }
    );
    itemsRef.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="py-16 relative"
      style={{
        background: '#0D0D0D',
        borderTop: '1px solid rgba(201,162,39,0.2)',
        borderBottom: '1px solid rgba(201,162,39,0.2)',
      }}
    >
      {/* Gold top accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gold" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {features.map((f, i) => (
            <div
              key={f.id}
              ref={el => { itemsRef.current[i] = el; }}
              className="reveal-up flex flex-col items-center text-center gap-4 px-4"
            >
              {/* Icon with gold ring */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.25)' }}
              >
                {f.icon}
              </div>
              <div>
                <h3 className="font-poppins font-bold text-warm-white text-base mb-1">{f.headline}</h3>
                <p className="text-warm-grey text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
