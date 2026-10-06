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
        background: scrolled ? 'rgba(10,10,12,0.92)' : 'rgba(12,12,14,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(201,162,39,0.15)' : '1px solid rgba(201,162,39,0.05)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#hero" onClick={() => handleNav('#hero')} className="flex items-center gap-2.5 group">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0C0C0E',
              fontWeight: 900,
              fontSize: 17,
              fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 8px 20px rgba(201,162,39,0.25)',
            }}
          >
            M
          </div>
          <div>
            <span className="font-poppins font-black tracking-tight text-base" style={{ color: '#FAFAFA' }}>Metro</span>
            <span
              className="font-poppins font-black tracking-tight text-base"
              style={{
                background: 'linear-gradient(135deg, #D4AF37, #C9A227)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Cardz
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => handleNav(link.href)}
                className="text-sm font-medium tracking-wide transition-colors duration-200"
                style={{ color: 'rgba(250,250,250,0.55)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(250,250,250,0.9)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250,250,250,0.55)')}
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
                style={{ color: 'rgba(250,250,250,0.55)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(250,250,250,0.9)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250,250,250,0.55)')}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2.5">
          <a
            href="/check-membership"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-200"
            style={{
              borderColor: 'rgba(201,162,39,0.35)',
              background: 'rgba(201,162,39,0.08)',
              color: '#D4AF37',
            }}
          >
            <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
            Check Points
          </a>
          <a
            href="/go/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-200"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(250,250,250,0.7)',
            }}
          >
            <span className="material-symbols-outlined text-[14px]">storefront</span>
            GO Portal
          </a>
          <button
            onClick={() => handleNav('#contact')}
            className="px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 ml-1"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
              color: '#0C0C0E',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(201,162,39,0.2)',
            }}
          >
            Get Free Mockup
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-1.5">
          <a
            href="/check-membership"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold active:scale-95"
            style={{ borderColor: 'rgba(201,162,39,0.3)', background: 'rgba(201,162,39,0.08)', color: '#D4AF37' }}
          >
            <span className="material-symbols-outlined text-[14px]">qr_code_scanner</span>
            Points
          </a>
          <a
            href="/go/login"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold active:scale-95"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(250,250,250,0.7)' }}
          >
            <span className="material-symbols-outlined text-[14px]">storefront</span>
            GO
          </a>
          <button
            type="button"
            className="flex flex-col justify-center items-center gap-1.5 p-2 rounded-lg cursor-pointer touch-manipulation select-none"
            style={{
              WebkitTapHighlightColor: 'transparent',
              minWidth: '40px',
              minHeight: '40px',
              background: 'rgba(255,255,255,0.06)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-0.5 transition-transform duration-300 pointer-events-none ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ background: 'rgba(250,250,250,0.8)' }} />
            <span className={`block w-5 h-0.5 transition-opacity duration-300 pointer-events-none ${menuOpen ? 'opacity-0' : ''}`} style={{ background: 'rgba(250,250,250,0.8)' }} />
            <span className={`block w-5 h-0.5 transition-transform duration-300 pointer-events-none ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ background: 'rgba(250,250,250,0.8)' }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden ${menuOpen ? 'max-h-96 opacity-100 py-2' : 'max-h-0 opacity-0 py-0'}`}
        style={{
          transition: 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease',
          background: 'rgba(10,10,12,0.97)',
          borderTop: menuOpen ? '1px solid rgba(201,162,39,0.12)' : 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <a
              href="/check-membership"
              className="flex flex-col items-center justify-center p-3 rounded-xl border text-center active:scale-95 transition-transform"
              style={{ borderColor: 'rgba(201,162,39,0.3)', background: 'rgba(201,162,39,0.08)', color: '#D4AF37' }}
            >
              <span className="material-symbols-outlined text-[22px] mb-1">qr_code_scanner</span>
              <span className="text-xs font-bold leading-tight">Check Points</span>
            </a>
            <a
              href="/go/login"
              className="flex flex-col items-center justify-center p-3 rounded-xl border text-center active:scale-95 transition-transform"
              style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(250,250,250,0.7)' }}
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
              style={{ color: 'rgba(250,250,250,0.6)', background: 'none', border: 'none' }}
            >
              {link.label}
            </button>
          ))}
          <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
          {pageLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-base font-medium py-1"
              style={{ color: 'rgba(250,250,250,0.6)' }}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => handleNav('#contact')}
            className="px-5 py-3 rounded-full text-sm font-semibold text-center cursor-pointer touch-manipulation active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
              color: '#0C0C0E',
              border: 'none',
            }}
          >
            Get Free Mockup
          </button>
        </div>
      </div>
    </nav>
  );
};
