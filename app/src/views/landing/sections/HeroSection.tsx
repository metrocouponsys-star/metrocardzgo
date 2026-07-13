'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CSSCard3D, GoldMemberCardFace } from '../components/CSSCard3D';

// Floating gold particles
const Particles: React.FC = () => {
  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 5,
    opacity: 0.2 + Math.random() * 0.4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: '#C9A227',
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

export const HeroSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Slight delay so HTML paints before heavy card rig
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const scrollToContact = () => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  };
  const scrollToCards = () => {
    document.querySelector('#cards')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #1a120040 0%, #0D0D0D 70%)' }}
    >
      {/* Background radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(201,162,39,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <Particles />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-24 w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — copy */}
        <div className="text-center lg:text-left order-2 lg:order-1">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 glass-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            <span className="text-gold text-xs font-semibold tracking-widest uppercase">Premium Membership Cards</span>
          </div>

          {/* Headline */}
          <h1 className="font-poppins font-black text-5xl sm:text-6xl xl:text-7xl leading-[0.95] tracking-tight text-warm-white mb-5">
            MAKE UR OWN
            <br />
            <span className="text-gold-gradient">MEMBERSHIP</span>
            <br />
            CARDS
          </h1>

          {/* Tagline */}
          <p className="text-warm-grey text-lg sm:text-xl font-light tracking-wide italic mb-8">
            Your Card.&nbsp; Your Identity.&nbsp; Your Advantage.
          </p>

          {/* Body */}
          <p className="text-warm-white/60 text-base max-w-md mx-auto lg:mx-0 mb-10 leading-relaxed">
            Premium custom plastic cards for retail, restaurants, gyms, salons, hospitals and more — with foil, QR, chip, and your brand.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={scrollToContact}
              className="px-8 py-4 rounded-full font-poppins font-bold text-base text-rich-black transition-all duration-200 hover:scale-105 active:scale-95 animate-glow-pulse"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 50%, #7A5C12 100%)', boxShadow: '0 0 30px rgba(201,162,39,0.4)' }}
            >
              ✦ Design My Card
            </button>
            <button
              onClick={scrollToCards}
              className="px-8 py-4 rounded-full font-poppins font-semibold text-base text-gold border border-gold/40 hover:border-gold hover:bg-gold/5 transition-all duration-200"
            >
              See Sample Cards →
            </button>
          </div>

          {/* Trust stats */}
          <div className="mt-10 flex gap-8 justify-center lg:justify-start">
            {[
              { num: '500+', label: 'Businesses' },
              { num: '10K+', label: 'Cards Printed' },
              { num: '15+', label: 'Industries' },
            ].map(s => (
              <div key={s.label} className="text-center lg:text-left">
                <p className="font-poppins font-black text-2xl text-gold">{s.num}</p>
                <p className="text-warm-white/50 text-xs tracking-wider uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — 3D card */}
        <div className="relative order-1 lg:order-2 flex items-center justify-center">
          {/* Ambient glow ring */}
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full opacity-20 animate-glow-pulse" style={{ background: 'radial-gradient(circle, #C9A227, transparent 70%)', filter: 'blur(30px)' }} />

          {mounted && (
            <div className="perspective-card w-72 h-44 sm:w-96 sm:h-56 lg:w-[420px] lg:h-[264px] animate-float" style={{ filter: 'drop-shadow(0 40px 60px rgba(201,162,39,0.25))' }}>
              <CSSCard3D
                interactive={true}
                maxTilt={14}
                style={{ width: '100%', height: '100%' }}
                frontContent={<GoldMemberCardFace className="w-full h-full" />}
              />
            </div>
          )}

          {/* Floating feature badges */}
          {[
            { label: 'Gold Foil Finish', x: '-left-4 top-8', delay: '0s' },
            { label: 'QR Code Ready', x: '-right-4 bottom-10', delay: '0.8s' },
          ].map(badge => (
            <div
              key={badge.label}
              className={`absolute ${badge.x} glass-dark px-3 py-2 rounded-lg hidden sm:block`}
              style={{ animation: `float 5s ease-in-out ${badge.delay} infinite`, border: '1px solid rgba(201,162,39,0.25)' }}
            >
              <p className="text-gold text-xs font-semibold">✦ {badge.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-warm-white text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-warm-white/60 to-transparent" />
      </div>
    </section>
  );
};
