'use client';

import React, { useRef, useEffect } from 'react';

interface CSSCard3DProps {
  className?: string;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
  flipped?: boolean;
  interactive?: boolean; // mouse-parallax tilt
  maxTilt?: number; // degrees
  style?: React.CSSProperties;
}

export const CSSCard3D: React.FC<CSSCard3DProps> = ({
  className = '',
  frontContent,
  backContent,
  flipped = false,
  interactive = true,
  maxTilt = 12,
  style,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ rx: 0, ry: 0 });
  const currentRef = useRef({ rx: 0, ry: 0 });

  useEffect(() => {
    if (!interactive) return;
    const card = cardRef.current;
    if (!card) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      targetRef.current = { rx: -dy * maxTilt, ry: dx * maxTilt };
    };

    const onMouseLeave = () => {
      targetRef.current = { rx: 0, ry: 0 };
    };

    const animate = () => {
      const lerp = 0.08;
      currentRef.current.rx += (targetRef.current.rx - currentRef.current.rx) * lerp;
      currentRef.current.ry += (targetRef.current.ry - currentRef.current.ry) * lerp;
      if (card) {
        card.style.transform = `perspective(1000px) rotateX(${currentRef.current.rx}deg) rotateY(${currentRef.current.ry + (flipped ? 180 : 0)}deg)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onMouseLeave);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      card.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [interactive, maxTilt, flipped]);

  return (
    <div
      ref={cardRef}
      className={`membership-card ${flipped && !interactive ? 'flipped' : ''} ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        transition: interactive ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
    >
      {/* Front */}
      <div className="membership-card-front">{frontContent}</div>
      {/* Back */}
      {backContent && (
        <div className="membership-card-back">{backContent}</div>
      )}
    </div>
  );
};

export const GoldMemberCardFace: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`relative w-full h-full rounded-xl overflow-hidden ${className}`}
    style={{ background: 'radial-gradient(circle at 50% 30%, #202020 0%, #080808 100%)' }}
  >
    {/* Dual golden borders */}
    <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ border: '1.5px solid rgba(212, 175, 55, 0.45)', boxShadow: 'inset 0 0 25px rgba(201,162,39,0.12)' }} />
    <div className="absolute inset-[3px] rounded-[9px] pointer-events-none" style={{ border: '0.5px solid rgba(212, 175, 55, 0.15)' }} />
    
    {/* Geometric luxury background pattern (Fine gold lines) */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.22] pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M-10,95 Q30,65 50,100 T110,85" fill="none" stroke="#C9A227" strokeWidth="0.3" />
      <path d="M-10,85 Q35,55 60,90 T110,75" fill="none" stroke="#C9A227" strokeWidth="0.3" />
      <path d="M-10,75 Q40,45 70,80 T110,65" fill="none" stroke="#C9A227" strokeWidth="0.3" />
      <circle cx="90" cy="15" r="30" fill="none" stroke="#C9A227" strokeWidth="0.15" />
      <circle cx="90" cy="15" r="25" fill="none" stroke="#C9A227" strokeWidth="0.15" />
      <circle cx="90" cy="15" r="20" fill="none" stroke="#C9A227" strokeWidth="0.15" />
      <circle cx="90" cy="15" r="15" fill="none" stroke="#C9A227" strokeWidth="0.15" />
    </svg>
    
    {/* Foil reflection shine */}
    <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 45%, rgba(255,255,255,0.02) 100%)' }} />
    
    {/* Large Central Luxury Crest/Watermark */}
    <div className="absolute inset-0 flex items-center justify-center opacity-[0.09] pointer-events-none">
      <svg width="130" height="130" viewBox="0 0 100 100" fill="none" stroke="#C9A227">
        <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" strokeWidth="0.8" />
        <path d="M50 15 L80 32 L80 68 L50 85 L20 68 L20 32 Z" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="23" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="18" strokeWidth="0.4" />
        <path d="M50 22 L50 78 M22 50 L78 50" strokeWidth="0.4" />
        <path d="M30 30 L70 70 M30 70 L70 30" strokeWidth="0.4" />
      </svg>
    </div>
    
    {/* Top left — logo */}
    <div className="absolute top-4 left-5 flex items-center gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37, #7A5C12)', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
        <span className="text-black text-xs font-bold font-poppins">M</span>
      </div>
      <div>
        <span className="text-gold font-poppins font-black text-xs sm:text-sm tracking-widest uppercase drop-shadow-sm">MetroCardz</span>
        <span className="block text-[7px] text-warm-white/40 tracking-widest uppercase font-semibold leading-none">PREMIUM MEMBERSHIP</span>
      </div>
    </div>

    {/* Premium SIM Chip with gold contacts and hologram mix-blend */}
    <div className="absolute top-14 left-5">
      <div className="w-10 h-8 rounded-md relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #ffe082 0%, #ffb300 50%, #c67100 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.4)',
        border: '0.5px solid rgba(0,0,0,0.2)'
      }}>
        {/* Chip contact lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-1 opacity-70">
          <div className="border-r border-b border-black/25" />
          <div className="border-r border-b border-black/25" />
          <div className="border-b border-black/25" />
          <div className="border-r border-b border-black/25" />
          <div className="border-r border-b border-black/25" />
          <div className="border-b border-black/25" />
          <div className="border-r border-black/25" />
          <div className="border-r border-black/25" />
          <div />
        </div>
        {/* Holographic overlay */}
        <div className="absolute inset-0 opacity-15 bg-gradient-to-tr from-cyan-400 via-pink-400 to-yellow-300 mix-blend-overlay" />
      </div>
    </div>

    {/* NFC icon */}
    <div className="absolute top-14 left-18 opacity-40">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" stroke="#C9A227" strokeWidth="1.5" fill="none"/>
        <path d="M8 12c0-2.2 1.8-4 4-4" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 12c0-3.9 3.1-7 7-7" stroke="#C9A227" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      </svg>
    </div>

    {/* Card number with letter spacing & depth shadow */}
    <div className="absolute bottom-12 left-5 right-5">
      <p className="font-mono-card text-warm-white/95 tracking-[0.24em] text-xs sm:text-sm drop-shadow-md">
        1000 0000 0000 1110
      </p>
    </div>

    {/* Member name + validity */}
    <div className="absolute bottom-3 left-5 right-5 flex justify-between items-end">
      <div>
        <p className="text-[8px] tracking-widest uppercase font-bold text-gold/60 mb-0.5">MEMBER SINCE</p>
        <p className="font-poppins text-warm-white font-bold text-xs tracking-wide drop-shadow-sm">JOHN DOE</p>
      </div>
      <div className="text-right pr-9">
        <p className="text-[8px] tracking-widest uppercase font-bold text-gold/60 mb-0.5">VALID THRU</p>
        <p className="font-mono-card text-gold text-xs drop-shadow-sm">12/28</p>
      </div>
    </div>

    {/* Overlapping Brand Circles in bottom-right */}
    <div className="absolute bottom-3 right-5 flex items-center pointer-events-none">
      <div className="w-7 h-7 rounded-full opacity-35" style={{ background: 'linear-gradient(135deg, #D4AF37, #7A5C12)', marginRight: '-10px' }} />
      <div className="w-7 h-7 rounded-full opacity-20" style={{ background: 'linear-gradient(135deg, #FDF6E3, #D4AF37)' }} />
    </div>

    {/* Top right VIP badge */}
    <div className="absolute top-4 right-5">
      <span className="text-gold font-poppins font-black text-[10px] tracking-widest uppercase shimmer-gold bg-clip-text" style={{ WebkitTextFillColor: 'transparent' }}>VIP</span>
    </div>
  </div>
);

