'use client';

import React from 'react';

// We have 34 cards total, split into two rows for dynamic visual flow
const ROW1_CARDS = Array.from({ length: 17 }, (_, i) => `/images/real-cards/card_${i + 1}.jpg`);
const ROW2_CARDS = Array.from({ length: 17 }, (_, i) => `/images/real-cards/card_${i + 18}.jpg`);

// Duplicate for infinite scroll loop
const row1 = [...ROW1_CARDS, ...ROW1_CARDS];
const row2 = [...ROW2_CARDS, ...ROW2_CARDS];

export const PrintedGallerySection: React.FC = () => {
  return (
    <section id="gallery" className="py-24 overflow-hidden" style={{ background: '#0D0D0D' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mb-16">
        {/* Header */}
        <div className="text-center">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Real Work</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            Printed <span className="text-gold-gradient">Card Gallery</span>
          </h2>
          <p className="text-warm-grey text-base max-w-xl mx-auto">
            Take a look at the actual physical membership, loyalty, and privilege cards we have printed and delivered to top brands across India.
          </p>
        </div>
      </div>

      {/* Marquees */}
      <div className="flex flex-col gap-8 select-none">
        
        {/* Row 1: Scrolling Left */}
        <div 
          className="relative overflow-hidden" 
          style={{ 
            maskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)', 
            WebkitMaskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)' 
          }}
        >
          <div className="flex gap-6 animate-marquee w-max py-4">
            {row1.map((src, i) => (
              <div
                key={`row1-${i}`}
                className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  width: 290,
                  height: 183,
                  border: '1.5px solid rgba(201,162,39,0.15)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(1.05) translateY(-5px)';
                  el.style.borderColor = 'rgba(201,162,39,0.6)';
                  el.style.boxShadow = '0 12px 30px rgba(201,162,39,0.25)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(1) translateY(0)';
                  el.style.borderColor = 'rgba(201,162,39,0.15)';
                  el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
                }}
              >
                <img
                  src={src}
                  alt={`Real printed card sample ${i + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Scrolling Right */}
        <div 
          className="relative overflow-hidden" 
          style={{ 
            maskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)', 
            WebkitMaskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)' 
          }}
        >
          <div className="flex gap-6 animate-marquee-reverse w-max py-4">
            {row2.map((src, i) => (
              <div
                key={`row2-${i}`}
                className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  width: 290,
                  height: 183,
                  border: '1.5px solid rgba(201,162,39,0.15)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(1.05) translateY(-5px)';
                  el.style.borderColor = 'rgba(201,162,39,0.6)';
                  el.style.boxShadow = '0 12px 30px rgba(201,162,39,0.25)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.transform = 'scale(1) translateY(0)';
                  el.style.borderColor = 'rgba(201,162,39,0.15)';
                  el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
                }}
              >
                <img
                  src={src}
                  alt={`Real printed card sample ${i + 18}`}
                  className="w-full h-full object-cover pointer-events-none"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
