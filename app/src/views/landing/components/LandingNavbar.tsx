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

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const navLinks = [
    { label: 'Cards', href: '#cards' },
    { label: 'Industries', href: '#industries' },
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'ROI Calculator', href: '/roi-calculator' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNav = (href: string) => {
    setMenuOpen(false);
    if (href.startsWith('#')) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/' + href;
        return;
      }
      const el = document.querySelector(href);
      if (el) {
        const navHeight = 72;
        const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - navHeight,
          behavior: 'smooth',
        });
      }
    } else {
      window.location.href = href;
    }
  };

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 w-full"
      style={{
        transition: 'background-color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        background: scrolled ? 'rgba(10,10,14,0.96)' : 'rgba(12,12,16,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(201,162,39,0.2)' : '1px solid rgba(201,162,39,0.08)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-18">
        {/* Brand Logo */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            handleNav('#hero');
          }}
          className="flex items-center gap-2.5 group shrink-0 select-none py-1"
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #C9A227 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0C0C0E',
              fontWeight: 900,
              fontSize: 18,
              fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
            }}
          >
            M
          </div>
          <div className="flex items-baseline">
            <span className="font-poppins font-black tracking-tight text-lg sm:text-xl text-white">
              Metro
            </span>
            <span
              className="font-poppins font-black tracking-tight text-lg sm:text-xl"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #C9A227 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Cardz
            </span>
          </div>
        </a>

        {/* Desktop Nav Links (Visible on xl screens >= 1280px) */}
        <ul className="hidden xl:flex items-center gap-6 shrink-0">
          {navLinks.map((link) => (
            <li key={link.label}>
              <button
                type="button"
                onClick={() => handleNav(link.href)}
                className="text-sm font-semibold tracking-wide transition-colors duration-200 cursor-pointer"
                style={{
                  color: 'rgba(250,250,250,0.65)',
                  background: 'none',
                  border: 'none',
                  padding: '6px 2px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD700')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250,250,250,0.65)')}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Laptop Nav Links (Compact version for lg: 1024px to 1279px) */}
        <ul className="hidden lg:flex xl:hidden items-center gap-4 shrink-0">
          {navLinks.slice(0, 4).map((link) => (
            <li key={link.label}>
              <button
                type="button"
                onClick={() => handleNav(link.href)}
                className="text-xs font-semibold tracking-wide transition-colors duration-200 cursor-pointer"
                style={{
                  color: 'rgba(250,250,250,0.7)',
                  background: 'none',
                  border: 'none',
                  padding: '4px 2px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD700')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250,250,250,0.7)')}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop & Laptop Action Buttons (Visible >= 1024px) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {/* Member Check Points (Shown on xl) */}
          <a
            href="/check-membership"
            className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              borderColor: 'rgba(201,162,39,0.35)',
              background: 'rgba(201,162,39,0.08)',
              color: '#D4AF37',
            }}
            title="Check Your Card Loyalty Points & Offers"
          >
            <span className="material-symbols-outlined text-[15px]">qr_code_scanner</span>
            Check Points
          </a>

          {/* Merchant Login */}
          <a
            href="/login"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 hover:border-amber-400/50"
            style={{
              borderColor: 'rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: '#FAFAFA',
            }}
            title="Merchant Portal Login — Store POS & Loyalty Management"
          >
            <span className="material-symbols-outlined text-[15px]" style={{ color: '#D4AF37' }}>
              storefront
            </span>
            Merchant Login
          </a>

          {/* Metro Cardz GO Platform Button */}
          <a
            href="/go"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #C9A227 100%)',
              color: '#08080A',
              boxShadow: '0 4px 16px rgba(201,162,39,0.35)',
            }}
            title="Metro Cardz GO Platform — 40% OFF Dining, Resorts & Lifestyle"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Load GO</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/20 text-black">
              40% OFF
            </span>
          </a>
        </div>

        {/* Mobile & Tablet Top Right Controls (< 1024px) */}
        <div className="lg:hidden flex items-center gap-2 shrink-0">
          {/* Quick GO CTA button */}
          <a
            href="/go"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black tracking-tight active:scale-95 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              color: '#0A0A0C',
            }}
            title="Load GO Page"
          >
            <span className="material-symbols-outlined text-[15px] font-bold">bolt</span>
            <span>GO</span>
            <span className="text-[9px] px-1 rounded bg-black/15 font-black">40%</span>
          </a>

          {/* Quick Merchant Portal icon */}
          <a
            href="/login"
            className="flex items-center justify-center w-9 h-9 rounded-full border active:scale-95 transition-transform"
            style={{
              borderColor: 'rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: '#D4AF37',
            }}
            title="Merchant Login"
            aria-label="Merchant Login"
          >
            <span className="material-symbols-outlined text-[18px]">storefront</span>
          </a>

          {/* Hamburger Menu Toggle Button (Apple HIG 44px touch target) */}
          <button
            type="button"
            className="flex items-center justify-center w-11 h-11 rounded-xl cursor-pointer active:scale-95 transition-colors"
            style={{
              WebkitTapHighlightColor: 'transparent',
              background: menuOpen ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.08)',
              border: menuOpen ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.12)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <div className="w-5 h-4 relative flex flex-col justify-between items-center pointer-events-none">
              <span
                className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${
                  menuOpen ? 'rotate-45 translate-y-[7px] bg-amber-400' : 'bg-white/90'
                }`}
              />
              <span
                className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${
                  menuOpen ? 'opacity-0 scale-0' : 'bg-white/90'
                }`}
              />
              <span
                className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${
                  menuOpen ? '-rotate-45 -translate-y-[7px] bg-amber-400' : 'bg-white/90'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Visible when menuOpen is true on < 1024px screens) */}
      <div
        className={`lg:hidden transition-all duration-300 ease-in-out ${
          menuOpen
            ? 'max-h-[calc(100dvh-4.25rem)] opacity-100 visible pointer-events-auto'
            : 'max-h-0 opacity-0 invisible pointer-events-none'
        }`}
        style={{
          background: 'rgba(9,9,12,0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(201,162,39,0.15)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div
          className="px-5 py-5 flex flex-col gap-5 max-w-lg mx-auto"
          style={{
            paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {/* Platform Launchpad Cards (3 Core Options) */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
                Choose Platform
              </span>
              <span className="text-[10px] text-white/40">Instant Access</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Tile 1: Merchant Login */}
              <a
                href="/login"
                className="flex flex-col items-center justify-center p-3 rounded-2xl border text-center active:scale-95 transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#FAFAFA',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-1.5"
                  style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
                >
                  <span className="material-symbols-outlined text-[19px]">storefront</span>
                </div>
                <span className="text-[11px] font-bold leading-tight">Merchant</span>
                <span className="text-[9px] text-white/50 mt-0.5">POS Counter</span>
              </a>

              {/* Tile 2: Check My Points */}
              <a
                href="/check-membership"
                className="flex flex-col items-center justify-center p-3 rounded-2xl border text-center active:scale-95 transition-all"
                style={{
                  borderColor: 'rgba(201,162,39,0.3)',
                  background: 'rgba(201,162,39,0.08)',
                  color: '#D4AF37',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-1.5"
                  style={{ background: 'rgba(201,162,39,0.25)', color: '#FFD700' }}
                >
                  <span className="material-symbols-outlined text-[19px]">qr_code_scanner</span>
                </div>
                <span className="text-[11px] font-bold leading-tight">Check Points</span>
                <span className="text-[9px] text-amber-300/60 mt-0.5">No Login Req</span>
              </a>

              {/* Tile 3: Load GO Page */}
              <a
                href="/go"
                className="flex flex-col items-center justify-center p-3 rounded-2xl text-center active:scale-95 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                  color: '#0A0A0C',
                  boxShadow: '0 4px 16px rgba(212,175,55,0.25)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 bg-black/15"
                  style={{ color: '#0A0A0C' }}
                >
                  <span className="material-symbols-outlined text-[19px] font-bold">bolt</span>
                </div>
                <span className="text-[11px] font-black leading-tight">Load GO</span>
                <span className="text-[9px] font-extrabold text-black/70 mt-0.5">40% OFF Deals</span>
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col divide-y divide-white/5 pt-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNav(link.href)}
                className="flex items-center justify-between py-3 text-sm font-semibold text-left transition-colors cursor-pointer text-white/80 active:text-amber-400"
                style={{ background: 'none', border: 'none' }}
              >
                <span>{link.label}</span>
                <span className="text-xs text-white/30">→</span>
              </button>
            ))}
            <a
              href="/about-us"
              className="flex items-center justify-between py-3 text-sm font-semibold text-left transition-colors text-white/80 active:text-amber-400"
            >
              <span>About MetroCardz</span>
              <span className="text-xs text-white/30">→</span>
            </a>
          </div>

          {/* CTA Mockup Button */}
          <button
            type="button"
            onClick={() => handleNav('#contact')}
            className="w-full py-3.5 px-6 rounded-2xl font-poppins font-black text-sm text-center cursor-pointer active:scale-98 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #C9A227 100%)',
              color: '#08080A',
              border: 'none',
              boxShadow: '0 8px 24px rgba(212,175,55,0.3)',
            }}
          >
            ✦ Get Free Card Mockup (24h)
          </button>

          {/* Direct Support & Contact Info */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-around gap-2 text-xs text-white/50">
            <a
              href="tel:+919876543210"
              className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] text-amber-400">call</span>
              +91 98765 43210
            </a>
            <span>•</span>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] text-emerald-400">chat</span>
              WhatsApp
            </a>
            <span>•</span>
            <a
              href="mailto:hello@metrocardz.in"
              className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] text-amber-400">mail</span>
              Email
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
