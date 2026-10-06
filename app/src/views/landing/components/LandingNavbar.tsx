'use client';
import React, { useEffect, useRef, useState } from 'react';

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Cards', href: '#cards' },
    { label: 'Industries', href: '#industries' },
    { label: 'Contact', href: '#contact' },
  ];

  const pageLinks = [
    { label: 'Check Membership', href: '/check-membership' },
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'About', href: '/about-us' },
  ];

  const handleNav = (href: string) => {
    setMenuOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = '/' + href;
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        transition: 'background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        background: scrolled ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(18px)',
        borderBottom: scrolled ? '1px solid rgba(226,232,240,0.9)' : '1px solid rgba(226,232,240,0.2)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxShadow: scrolled ? '0 10px 30px rgba(15, 23, 42, 0.06)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        <a href="#hero" onClick={() => handleNav('#hero')} className="flex items-center gap-2.5 group">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              boxShadow: '0 12px 20px rgba(234,88,12,0.18)',
            }}
          >
            M
          </div>
          <div>
            <span className="font-poppins font-black tracking-tight text-base" style={{ color: '#111827' }}>Metro</span>
            <span className="font-poppins font-black tracking-tight text-base" style={{ color: '#EA580C' }}>Cardz</span>
          </div>
        </a>

        <ul className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => handleNav(link.href)}
                className="text-sm font-medium tracking-wide transition-colors duration-200"
                style={{ color: '#475569' }}
              >
                {link.label}
              </button>
            </li>
          ))}
          {pageLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-sm font-medium tracking-wide transition-colors duration-200"
                style={{ color: '#475569' }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-2.5">
          <a
            href="/check-membership"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-200"
            style={{ borderColor: '#F6D3B6', background: '#FFF7ED', color: '#C2410C' }}
          >
            <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
            Check Points
          </a>
          <a
            href="/go/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-200"
            style={{ borderColor: '#E2E8F0', background: '#fff', color: '#1F2937' }}
          >
            <span className="material-symbols-outlined text-[15px]">storefront</span>
            GO Portal
          </a>
          <button
            onClick={() => handleNav('#contact')}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ml-1"
            style={{ background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)', color: '#fff' }}
          >
            Get Free Mockup
          </button>
        </div>

        <div className="md:hidden flex items-center gap-1.5">
          <a
            href="/check-membership"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold active:scale-95"
            style={{ borderColor: '#F6D3B6', background: '#FFF7ED', color: '#C2410C' }}
          >
            <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
            Points
          </a>
          <a
            href="/go/login"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold active:scale-95"
            style={{ borderColor: '#E2E8F0', background: '#fff', color: '#1F2937' }}
          >
            <span className="material-symbols-outlined text-[14px]">storefront</span>
            Login
          </a>
          <button
            type="button"
            className="flex flex-col justify-center items-center gap-1.5 p-2 rounded-lg cursor-pointer touch-manipulation select-none"
            style={{ WebkitTapHighlightColor: 'transparent', minWidth: '40px', minHeight: '40px', background: 'rgba(255,255,255,0.6)' }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-0.5 transition-transform duration-300 pointer-events-none ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ background: '#111827' }} />
            <span className={`block w-5 h-0.5 transition-opacity duration-300 pointer-events-none ${menuOpen ? 'opacity-0' : ''}`} style={{ background: '#111827' }} />
            <span className={`block w-5 h-0.5 transition-transform duration-300 pointer-events-none ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ background: '#111827' }} />
          </button>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden ${menuOpen ? 'max-h-96 opacity-100 py-2' : 'max-h-0 opacity-0 py-0'}`}
        style={{
          transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease',
          background: 'rgba(255,255,255,0.92)',
          borderTop: menuOpen ? '1px solid rgba(226,232,240,0.9)' : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-200">
            <a
              href="/check-membership"
              className="flex flex-col items-center justify-center p-3 rounded-xl border text-center active:scale-95 transition-transform"
              style={{ borderColor: '#F6D3B6', background: '#FFF7ED', color: '#C2410C' }}
            >
              <span className="material-symbols-outlined text-[22px] mb-1">qr_code_scanner</span>
              <span className="text-xs font-bold leading-tight">Check Points</span>
            </a>
            <a
              href="/go/login"
              className="flex flex-col items-center justify-center p-3 rounded-xl border text-center active:scale-95 transition-transform"
              style={{ borderColor: '#E2E8F0', background: '#fff', color: '#1F2937' }}
            >
              <span className="material-symbols-outlined text-[22px] mb-1">storefront</span>
              <span className="text-xs font-bold leading-tight">GO Portal</span>
            </a>
          </div>

          {links.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => handleNav(link.href)}
              className="text-base font-medium text-left transition-colors cursor-pointer touch-manipulation active:opacity-70 py-1"
              style={{ color: '#475569' }}
            >
              {link.label}
            </button>
          ))}
          <hr className="border-slate-200" />
          {pageLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-base font-medium py-1"
              style={{ color: '#475569' }}
            >
              {link.label}
            </a>
          ))}
          <a href="/go/login" className="text-base font-medium py-1" style={{ color: '#475569' }}>Merchant Login</a>
          <button
            type="button"
            onClick={() => handleNav('#contact')}
            className="px-5 py-3 rounded-full text-sm font-semibold text-center cursor-pointer touch-manipulation active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)', color: '#fff' }}
          >
            Get Free Mockup
          </button>
        </div>
      </div>
    </nav>
  );
};
