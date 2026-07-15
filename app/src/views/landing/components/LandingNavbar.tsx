'use client';
import React, { useEffect, useRef, useState } from 'react';

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Cards', href: '#cards' },
    { label: 'Industries', href: '#industries' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  const pageLinks = [
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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? 'rgba(13,13,13,0.95)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(201,162,39,0.15)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#hero" onClick={() => handleNav('#hero')} className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9">
            {/* Two overlapping card icons */}
            <div className="absolute inset-0 rounded-md rotate-6 opacity-60" style={{ background: 'linear-gradient(135deg, #7A5C12, #C9A227)' }} />
            <div className="absolute inset-0 rounded-md -rotate-3" style={{ background: 'linear-gradient(135deg, #D4AF37, #7A5C12)' }} />
            <span className="absolute inset-0 flex items-center justify-center font-poppins font-black text-black text-sm">M</span>
          </div>
          <div>
            <span className="font-poppins font-black text-warm-white tracking-tight text-base">Metro</span>
            <span className="font-poppins font-black text-gold tracking-tight text-base">Cardz</span>
          </div>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {links.map(link => (
            <li key={link.href}>
              <button
                onClick={() => handleNav(link.href)}
                className="text-warm-white/70 hover:text-gold text-sm font-medium tracking-wide transition-colors duration-200"
              >
                {link.label}
              </button>
            </li>
          ))}
          {pageLinks.map(link => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-warm-white/70 hover:text-gold text-sm font-medium tracking-wide transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA + Login */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            className="text-warm-white/60 hover:text-warm-white text-sm font-medium transition-colors"
          >
            Merchant Login
          </a>
          <button
            onClick={() => handleNav('#contact')}
            className="px-5 py-2 rounded-full text-sm font-semibold font-poppins text-rich-black transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)' }}
          >
            Get Free Mockup
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-warm-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-warm-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-warm-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-80' : 'max-h-0'}`}
        style={{ background: 'rgba(13,13,13,0.98)', borderTop: menuOpen ? '1px solid rgba(201,162,39,0.15)' : 'none' }}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          {links.map(link => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              className="text-warm-white/80 hover:text-gold text-base font-medium text-left transition-colors"
            >
              {link.label}
            </button>
          ))}
          <hr className="border-warm-white/10" />
          <a href="/login" className="text-warm-white/60 text-sm">Merchant Login</a>
          <button
            onClick={() => handleNav('#contact')}
            className="px-5 py-3 rounded-full text-sm font-semibold font-poppins text-rich-black text-center"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)' }}
          >
            Get Free Mockup
          </button>
        </div>
      </div>
    </nav>
  );
};
