'use client';

import React, { useEffect, useRef, useState } from 'react';

const Particles: React.FC = () => {
  const particles = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    duration: 8 + Math.random() * 8,
    delay: Math.random() * 4,
    opacity: 0.18 + Math.random() * 0.22,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: '#F59E0B',
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
    const t = setTimeout(() => setMounted(true), 120);
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
      style={{ background: 'linear-gradient(180deg, #fffdfb 0%, #fff7f2 24%, #fff 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 right-0 w-96 h-96 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.18) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute bottom-10 left-0 w-80 h-80 rounded-full opacity-25" style={{ background: 'radial-gradient(circle, rgba(251, 146, 60, 0.18) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(234,88,12,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(234,88,12,0.4) 1px, transparent 1px)',
        backgroundSize: '54px 54px',
      }} />

      <Particles />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-24 w-full grid lg:grid-cols-[1.08fr_0.92fr] gap-12 items-center">
        <div className="text-center lg:text-left order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ background: '#FFF7ED', border: '1px solid #F9D2B0', color: '#C2410C' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-widest uppercase">Premium membership experiences</span>
          </div>

          <h1 className="font-poppins font-black mb-5 leading-[0.95] tracking-tight" style={{ fontSize: 'clamp(3rem, 6vw, 6rem)', color: '#111827' }}>
            Discover deals
            <span style={{ display: 'block', color: '#EA580C' }}>that feel premium.</span>
          </h1>

          <p className="text-lg sm:text-xl font-light mb-8" style={{ color: '#52525B' }}>
            Members save on dining, travel, wellness, and weekend escapes with a cleaner, smarter loyalty journey.
          </p>

          <p className="max-w-md mx-auto lg:mx-0 mb-10 leading-relaxed" style={{ color: '#475569', fontSize: '1rem' }}>
            Metro Cardz GO brings city discovery, instant redemption, and curated offers into one elegant lifestyle app experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={scrollToContact}
              className="px-8 py-4 rounded-full font-poppins font-bold text-base transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)', boxShadow: '0 18px 30px rgba(234,88,12,0.16)', color: '#fff' }}
            >
              Design my card
            </button>
            <button
              onClick={scrollToCards}
              className="px-8 py-4 rounded-full font-poppins font-semibold text-base border transition-all duration-200"
              style={{ background: '#fff', borderColor: '#E2E8F0', color: '#111827' }}
            >
              View sample deals →
            </button>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-center sm:text-left self-center mr-1" style={{ color: '#64748B' }}>
              Quick access
            </span>

            <a
              href="/check-membership"
              className="group relative inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl border transition-all duration-300 hover:scale-[1.02] active:scale-95"
              style={{ borderColor: '#F9D2B0', background: '#FFF7ED' }}
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#fff', color: '#EA580C' }}>
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              </span>
              <div className="text-left">
                <div className="text-[11px] font-medium leading-none" style={{ color: '#C2410C' }}>Member access</div>
                <div className="text-sm font-bold" style={{ color: '#111827' }}>Check points</div>
              </div>
            </a>

            <a
              href="/go/login"
              className="group relative inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl border transition-all duration-300 hover:scale-[1.02] active:scale-95"
              style={{ borderColor: '#E2E8F0', background: '#fff' }}
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                <span className="material-symbols-outlined text-[18px]">storefront</span>
              </span>
              <div className="text-left">
                <div className="text-[11px] font-medium leading-none" style={{ color: '#64748B' }}>Business</div>
                <div className="text-sm font-bold" style={{ color: '#111827' }}>GO portal</div>
              </div>
            </a>
          </div>

          <div className="mt-10 flex gap-8 justify-center lg:justify-start">
            {[
              { num: '500+', label: 'Businesses' },
              { num: '10K+', label: 'Cards printed' },
              { num: '15+', label: 'Categories' },
            ].map((s) => (
              <div key={s.label} className="text-center lg:text-left">
                <p className="font-poppins font-black text-2xl" style={{ color: '#EA580C' }}>{s.num}</p>
                <p className="text-xs tracking-wider uppercase" style={{ color: '#64748B' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative order-1 lg:order-2 flex items-center justify-center">
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.28) 0%, transparent 70%)', filter: 'blur(45px)' }} />

          <div className="relative z-10 w-full max-w-[580px] transition-transform duration-500 hover:scale-[1.02]">
            <div
              style={{
                background: '#fff',
                borderRadius: 28,
                border: '1px solid #F1E7DF',
                boxShadow: '0 28px 50px rgba(15, 23, 42, 0.08)',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'relative', height: 430, backgroundImage: 'linear-gradient(180deg, rgba(17,24,39,0.12), rgba(17,24,39,0.28)), url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.28) 100%)' }} />
                <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                    Curated offers
                  </div>
                  <h2 style={{ margin: '16px 0 6px', fontSize: '2.1rem', lineHeight: 1.05, letterSpacing: '-0.06em', color: '#fff' }}>Weekend wins<br />made easy</h2>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, padding: 18, background: '#fff' }}>
                {[
                  { label: 'Dining', value: '8 offers', tone: '#FFF7ED', color: '#EA580C' },
                  { label: 'Stay', value: '12 stays', tone: '#F5F3FF', color: '#7C3AED' },
                  { label: 'Family', value: '14 deals', tone: '#ECFEFF', color: '#0F766E' },
                ].map((item) => (
                  <div key={item.label} style={{ background: item.tone, borderRadius: 16, padding: '12px 10px', textAlign: 'center', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{item.label}</div>
                    <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {mounted && (
              <div style={{ position: 'absolute', left: -30, bottom: 20, width: 180, transform: 'rotate(-10deg)' }}>
                <div style={{ borderRadius: 18, background: 'linear-gradient(135deg, #FFEDD5 0%, #fff 100%)', border: '1px solid #F8D7C0', boxShadow: '0 18px 28px rgba(15, 23, 42, 0.08)', padding: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C2410C' }}>Member card</div>
                  <div style={{ marginTop: 10, fontSize: 20, fontWeight: 800, color: '#111827' }}>Metro</div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>Wallet • Rewards • Offers</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
        <span className="text-xs tracking-widest uppercase" style={{ color: '#64748B' }}>Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-slate-400 to-transparent" />
      </div>
    </section>
  );
};
