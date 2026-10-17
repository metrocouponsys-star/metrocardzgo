'use client';

import React, { useEffect, useRef, useState } from 'react';

const Particles: React.FC = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    duration: 10 + Math.random() * 10,
    delay: Math.random() * 5,
    opacity: 0.12 + Math.random() * 0.18,
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
            background: '#D4AF37',
            opacity: p.opacity,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

export const HeroSection: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
      style={{ background: 'linear-gradient(160deg, #0C0C0E 0%, #111114 60%, #0A0A0D 100%)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,162,39,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.6) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, transparent 65%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(255,107,53,0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <Particles />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:py-28 w-full grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">

        {/* Left — Copy (order-1 on mobile & desktop so users see headline first) */}
        <div
          className="text-center lg:text-left order-1 lg:order-1"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(20px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(201,162,39,0.1)',
              border: '1px solid rgba(201,162,39,0.3)',
              color: '#D4AF37',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37', animation: 'pulse 2s ease infinite' }} />
            <span className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase">India's Premium Card Printers</span>
          </div>

          {/* Headline */}
          <h1
            className="font-poppins font-black mb-5 leading-[1.02] tracking-tight break-words"
            style={{ fontSize: 'clamp(2.2rem, 5.2vw, 5.8rem)', color: '#FAFAFA' }}
          >
            Custom Membership
            <span
              style={{
                display: 'block',
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #C9A227 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Cards &amp; Loyalty.
            </span>
          </h1>

          <p className="text-lg sm:text-xl font-light mb-4" style={{ color: 'rgba(250,250,250,0.65)' }}>
            Premium PVC cards with gold foil, holograms, QR codes, and your brand — delivered across India.
          </p>

          <p
            className="max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed"
            style={{ color: 'rgba(250,250,250,0.45)', fontSize: '1rem' }}
          >
            Design, print, and manage loyalty programs for restaurants, salons, gyms, retail stores, and hospitals — all from one platform.
          </p>

          {/* High-Impact Multi-Platform Initiating Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start">
            {/* 1. Button to Load GO Page */}
            <a
              href="/go"
              className="px-6 py-3.5 rounded-full font-poppins font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl group cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #C9A227 100%)',
                boxShadow: '0 16px 36px rgba(212,175,55,0.35)',
                color: '#08080A',
              }}
              title="Load Metro Cardz GO — Lifestyle Deals, Dining & Water Parks"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-12">bolt</span>
              <span>Load GO Page</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/20 text-black">
                40% OFF
              </span>
            </a>

            {/* 2. Merchant Login */}
            <a
              href="/login"
              className="px-6 py-3.5 rounded-full font-poppins font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 border cursor-pointer hover:border-amber-400/60"
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(212,175,55,0.3)',
                color: '#FAFAFA',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
              title="Merchant Portal Login — Store Counter POS & Loyalty Management"
            >
              <span className="material-symbols-outlined text-[19px]" style={{ color: '#D4AF37' }}>storefront</span>
              <span>Merchant Login</span>
            </a>

            {/* 3. Member Check My Points */}
            <a
              href="/check-membership"
              className="px-6 py-3.5 rounded-full font-poppins font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 border cursor-pointer hover:border-amber-400/60"
              style={{
                background: 'rgba(212,175,55,0.1)',
                borderColor: 'rgba(212,175,55,0.25)',
                color: '#FAFAFA',
              }}
              title="Member Points Lookup — Instant Balance & Digital Card Pass"
            >
              <span className="material-symbols-outlined text-[19px]" style={{ color: '#D4AF37' }}>stars</span>
              <span>Check My Points</span>
            </a>
          </div>

          {/* Secondary Quick Action Links */}
          <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs">
            <button
              onClick={scrollToContact}
              className="text-white/60 hover:text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Get Free Custom Card Mockup</span>
              <span className="text-[10px]">↗</span>
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={scrollToCards}
              className="text-white/60 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Explore 8+ Luxury Finishes</span>
              <span className="text-[10px]">↓</span>
            </button>
          </div>

          {/* Dedicated 3-Card Multi-Platform Initiator Launchpad */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
                  Select Your Platform
                </span>
              </div>
              <span className="text-[11px] text-amber-400/80 font-medium hidden sm:inline">
                Instant access • No delays
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Merchant Platform */}
              <a
                href="/login"
                className="group relative p-3.5 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:bg-white/[0.07] active:scale-98"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: 'rgba(212,175,55,0.18)', color: '#D4AF37' }}
                  >
                    <span className="material-symbols-outlined text-[19px]">storefront</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    B2B Suite
                  </span>
                </div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                  Merchant Login
                  <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
                </div>
                <p className="text-[11px] mt-1 leading-snug text-white/50">
                  POS counter login, issue member cards &amp; automate WhatsApp rewards.
                </p>
              </a>

              {/* Card 2: Check My Points */}
              <a
                href="/check-membership"
                className="group relative p-3.5 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/50 hover:bg-amber-400/[0.06] active:scale-98"
                style={{
                  background: 'rgba(212,175,55,0.04)',
                  borderColor: 'rgba(212,175,55,0.22)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: 'rgba(212,175,55,0.25)', color: '#FFD700' }}
                  >
                    <span className="material-symbols-outlined text-[19px]">qr_code_scanner</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    No Login Req.
                  </span>
                </div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                  Check My Points
                  <span className="text-xs transition-transform group-hover:translate-x-1">→</span>
                </div>
                <p className="text-[11px] mt-1 leading-snug text-white/50">
                  Lookup live points balance, card tier &amp; available cashback offers.
                </p>
              </a>

              {/* Card 3: Button to Load GO Page */}
              <a
                href="/go"
                className="group relative p-3.5 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:bg-gradient-to-br hover:from-amber-400/10 hover:to-transparent active:scale-98"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(0,0,0,0.4) 100%)',
                  borderColor: 'rgba(212,175,55,0.3)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #FFD700 0%, #C9A227 100%)', color: '#08080A' }}
                  >
                    <span className="material-symbols-outlined text-[19px] font-bold">bolt</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                    ⚡ 40% OFF
                  </span>
                </div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                  Load GO Page
                  <span className="text-xs transition-transform group-hover:translate-x-1">⚡</span>
                </div>
                <p className="text-[11px] mt-1 leading-snug text-white/50">
                  Exclusive dining, luxury resorts &amp; water parks passes across Mumbai.
                </p>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 flex gap-10 justify-center lg:justify-start">
            {[
              { num: '500+', label: 'Businesses' },
              { num: '10K+', label: 'Cards Printed' },
              { num: '15+', label: 'Industries' },
            ].map((s) => (
              <div key={s.label} className="text-center lg:text-left">
                <p
                  className="font-poppins font-black text-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #D4AF37, #C9A227)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {s.num}
                </p>
                <p className="text-xs tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Card showcase */}
        <div
          className="relative order-2 lg:order-2 flex items-center justify-center w-full"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(16px)',
            transition: 'opacity 0.7s 0.1s ease, transform 0.7s 0.1s ease',
          }}
        >
          <div
            className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full opacity-25 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />

          <div className="relative z-10 w-full max-w-[520px] transition-transform duration-500 hover:scale-[1.02]">
            <div
              style={{
                borderRadius: 28,
                border: '1px solid rgba(201,162,39,0.2)',
                boxShadow: '0 32px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                overflow: 'hidden',
              }}
            >
              {/* Hero image */}
              <div
                className="h-[300px] sm:h-[380px] lg:h-[400px]"
                style={{
                  position: 'relative',
                  backgroundImage:
                    'linear-gradient(180deg, rgba(12,12,14,0.1), rgba(12,12,14,0.5)), url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(12,12,14,0.55) 100%)',
                  }}
                />
                <div style={{ position: 'absolute', left: 22, right: 22, bottom: 24 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: 'rgba(12,12,14,0.5)',
                      border: '1px solid rgba(212,175,55,0.35)',
                      color: '#D4AF37',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    Premium Card Printing
                  </div>
                  <h2
                    style={{
                      margin: '14px 0 6px',
                      fontSize: '2rem',
                      lineHeight: 1.1,
                      letterSpacing: '-0.05em',
                      color: '#fff',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 800,
                    }}
                  >
                    Your Brand.<br />Every Wallet.
                  </h2>
                </div>
              </div>

              {/* Stats strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                  padding: 16,
                  background: '#111114',
                  borderTop: '1px solid rgba(201,162,39,0.15)',
                }}
              >
                {[
                  { label: 'Gold Foil', value: 'Available', color: '#D4AF37' },
                  { label: 'Hologram', value: 'Security', color: '#9CA3AF' },
                  { label: 'QR Code', value: 'Enabled', color: '#34D399' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 12,
                      padding: '11px 8px',
                      border: '1px solid rgba(255,255,255,0.07)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: item.color }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating card badge */}
            {mounted && (
              <div
                className="absolute left-2 sm:-left-6 bottom-4 sm:bottom-6 w-36 sm:w-44 -rotate-3 sm:-rotate-8 pointer-events-none transition-all duration-300"
              >
                <div
                  style={{
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
                    boxShadow: '0 20px 30px rgba(0,0,0,0.4)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.55)' }}>
                    Member Card
                  </div>
                  <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: '#0C0C0E', fontFamily: 'Poppins, sans-serif' }}>Metro</div>
                  <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>Gold • Platinum • Silver</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: 0.4 }}>
        <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Scroll</span>
        <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, rgba(212,175,55,0.6), transparent)' }} />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
};
