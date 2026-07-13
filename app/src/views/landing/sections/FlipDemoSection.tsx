'use client';

import React, { useState } from 'react';

const CardFront: React.FC = () => (
  <div className="w-full h-full rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a, #0D0D0D)' }}>
    <div className="absolute inset-0 rounded-2xl" style={{ border: '1.5px solid rgba(201,162,39,0.5)', boxShadow: 'inset 0 0 30px rgba(201,162,39,0.05)' }} />
    {/* Foil stripe */}
    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #7A5C12, #D4AF37, #FDF6E3, #D4AF37, #7A5C12)' }} />

    {/* Logo area */}
    <div className="absolute top-6 left-6 flex items-center gap-2">
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37, #7A5C12)' }}>
        <span className="text-black font-poppins font-black text-sm">M</span>
      </div>
      <div>
        <p className="font-poppins font-black text-gold text-base leading-none">MetroCardz</p>
        <p className="text-warm-white/40 text-xs tracking-widest uppercase">Membership</p>
      </div>
    </div>

    {/* VIP badge */}
    <div className="absolute top-5 right-5 px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg, #D4AF37, #7A5C12)' }}>
      <span className="font-poppins font-black text-black text-xs tracking-widest">VIP</span>
    </div>

    {/* Chip */}
    <div className="absolute top-20 left-6">
      <div className="w-12 h-9 rounded-md relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227, #7A5C12)' }}>
        <div className="absolute inset-0.5 rounded grid grid-cols-2 gap-px">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-black/20 rounded-sm" />)}
        </div>
      </div>
    </div>

    {/* Card number */}
    <div className="absolute bottom-14 left-6 right-6">
      <p className="font-mono-card text-warm-white/50 tracking-[0.3em] text-sm">1000 •••• •••• 1110</p>
    </div>

    {/* Footer */}
    <div className="absolute bottom-5 left-6 right-6 flex justify-between items-end">
      <div>
        <p className="text-warm-white/40 text-[10px] tracking-widest uppercase">Card Holder</p>
        <p className="font-poppins text-warm-white font-bold text-sm tracking-wide">JOHN DOE</p>
      </div>
      <div className="text-right">
        <p className="text-warm-white/40 text-[10px] tracking-widest uppercase">Valid Thru</p>
        <p className="font-mono-card text-gold text-sm">12/28</p>
      </div>
    </div>

    {/* Foil glow */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />
  </div>
);

const CardBack: React.FC = () => (
  <div className="w-full h-full rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0f0f, #1a1a1a)' }}>
    <div className="absolute inset-0 rounded-2xl" style={{ border: '1.5px solid rgba(201,162,39,0.4)' }} />
    {/* Magnetic stripe */}
    <div className="absolute top-8 left-0 right-0 h-9" style={{ background: 'linear-gradient(180deg, #1a1a1a, #0d0d0d, #1a1a1a)' }} />
    {/* Signature strip */}
    <div className="absolute top-20 left-6 right-6 h-8 rounded flex items-center px-3" style={{ background: 'linear-gradient(90deg, #f5f5f5, #eeeeee)', border: '1px solid #ddd' }}>
      <p className="text-black/30 text-xs italic font-light">John Doe</p>
    </div>

    {/* QR Code */}
    <div className="absolute bottom-6 right-6 flex flex-col items-center gap-1">
      <div className="w-16 h-16 rounded-md p-1.5" style={{ background: '#fff' }}>
        <div className="w-full h-full grid grid-cols-7 gap-px">
          {[...Array(49)].map((_, i) => {
            const isCorner = (r: number, c: number) => (r < 2 && c < 2) || (r < 2 && c >= 5) || (r >= 5 && c < 2);
            const r = Math.floor(i / 7), c = i % 7;
            const filled = isCorner(r, c) || Math.random() > 0.45;
            return <div key={i} className="rounded-sm" style={{ background: filled ? '#0D0D0D' : 'transparent' }} />;
          })}
        </div>
      </div>
      <p className="text-warm-white/30 text-[9px] tracking-wider">SCAN ME</p>
    </div>

    {/* Offer icons grid */}
    <div className="absolute left-6 bottom-6 grid grid-cols-3 gap-3">
      {['10%', '20%', '₹50', '5%', 'FREE', '2X'].map((offer, i) => (
        <div key={i} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.25)' }}>
          <span className="text-gold font-poppins font-bold text-[10px]">{offer}</span>
        </div>
      ))}
    </div>

    {/* Terms strip */}
    <div className="absolute bottom-0 left-0 right-0 px-4 py-2" style={{ background: 'rgba(201,162,39,0.05)', borderTop: '1px solid rgba(201,162,39,0.1)' }}>
      <p className="text-warm-white/20 text-[8px] leading-tight">
        Terms & Conditions apply. Card is non-transferable. metrocardz.in
      </p>
    </div>

    {/* Back label */}
    <div className="absolute top-3 left-6">
      <p className="text-warm-white/30 text-xs tracking-widest uppercase">Back</p>
    </div>
  </div>
);

export const FlipDemoSection: React.FC = () => {
  const [flipped, setFlipped] = useState(false);

  return (
    <section className="py-24" style={{ background: 'radial-gradient(ellipse at 50% 50%, #1a120020 0%, #0D0D0D 70%)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
        {/* Header */}
        <div className="mb-16 reveal-up">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Interactive Demo</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            Flip It. <span className="text-gold-gradient">Feel It.</span>
          </h2>
          <p className="text-warm-grey text-base max-w-lg mx-auto">
            Click the card to see the front and back. Every card features your brand on the front and smart offers on the back.
          </p>
        </div>

        {/* Card flip container */}
        <div className="flex justify-center">
          <div
            className="perspective-card cursor-pointer relative"
            style={{ width: 'min(380px, 90vw)', height: 'min(240px, 56vw)' }}
            onClick={() => setFlipped(f => !f)}
          >
            {/* Ambient glow */}
            <div className="absolute -inset-8 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)', filter: 'blur(30px)' }} />

            <div
              style={{
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                <CardFront />
              </div>
              {/* Back */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <CardBack />
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <div className="mt-8 min-h-12 transition-all duration-300">
          <p className="text-warm-white font-poppins font-semibold text-lg">
            {flipped ? 'Back — Offers, QR & Loyalty Rewards' : 'Front — Your Brand, Your Design'}
          </p>
          <p className="text-warm-grey text-sm mt-1">
            {flipped ? 'Smart QR, 6-offer grid, member terms' : 'Gold foil, chip, custom logo & member ID'}
          </p>
        </div>

        {/* Flip hint */}
        <button
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-200 hover:scale-105"
          style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)' }}
          onClick={() => setFlipped(f => !f)}
        >
          <span className="text-gold text-sm font-semibold">
            {flipped ? '← Flip to Front' : 'Tap to Flip →'}
          </span>
        </button>
      </div>
    </section>
  );
};
