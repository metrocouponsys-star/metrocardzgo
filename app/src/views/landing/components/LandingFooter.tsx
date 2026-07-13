'use client';

import React from 'react';

export const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(201,162,39,0.15)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-md rotate-6 opacity-60" style={{ background: 'linear-gradient(135deg, #7A5C12, #C9A227)' }} />
                <div className="absolute inset-0 rounded-md -rotate-3" style={{ background: 'linear-gradient(135deg, #D4AF37, #7A5C12)' }} />
                <span className="absolute inset-0 flex items-center justify-center font-poppins font-black text-black text-sm">M</span>
              </div>
              <div>
                <span className="font-poppins font-black text-warm-white tracking-tight text-base">Metro</span>
                <span className="font-poppins font-black text-gold tracking-tight text-base">Cardz</span>
              </div>
            </div>
            <p className="text-warm-grey text-sm leading-relaxed max-w-sm mb-5">
              Premium custom membership cards for businesses across India. Gold foil, QR codes, holograms — all in your brand.
            </p>

            {/* NAP — Name, Address, Phone: crawlable by Google */}
            <address className="not-italic mb-5 space-y-1.5">
              <p className="text-warm-white/50 text-xs tracking-widest uppercase mb-2">Contact</p>
              <p>
                <a href="tel:+919876543210" className="text-warm-grey hover:text-gold text-sm transition-colors flex items-center gap-1.5">
                  <span className="text-gold text-xs">✦</span>
                  +91 98765 43210
                </a>
              </p>
              <p>
                <a href="mailto:hello@metrocardz.in" className="text-warm-grey hover:text-gold text-sm transition-colors flex items-center gap-1.5">
                  <span className="text-gold text-xs">✦</span>
                  hello@metrocardz.in
                </a>
              </p>
              <p>
                <a
                  href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20custom%20membership%20cards"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-warm-grey hover:text-gold text-sm transition-colors flex items-center gap-1.5"
                >
                  <span className="text-gold text-xs">✦</span>
                  WhatsApp Us
                </a>
              </p>
              <p className="text-warm-grey text-sm flex items-center gap-1.5">
                <span className="text-gold text-xs">✦</span>
                Mon–Sat, 10am–7pm IST
              </p>
            </address>

            {/* Social */}
            <div className="flex gap-3">
              {[
                { s: 'f', href: 'https://www.facebook.com/metrocardz', label: 'Facebook' },
                { s: 'in', href: 'https://www.linkedin.com/company/metrocardz', label: 'LinkedIn' },
                { s: 'ig', href: 'https://www.instagram.com/metrocardz', label: 'Instagram' },
                { s: 'wa', href: 'https://wa.me/919876543210', label: 'WhatsApp' },
              ].map(item => (
                <a
                  key={item.s}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="w-9 h-9 rounded-full flex items-center justify-center font-poppins font-bold text-xs transition-all hover:scale-110"
                  style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)', color: 'rgba(201,162,39,0.7)' }}
                >
                  {item.s}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-poppins font-bold text-warm-white text-sm tracking-widest uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Sample Cards', id: '#cards' },
                { label: 'Printed Gallery', id: '#gallery' },
                { label: 'Industries', id: '#industries' },
                { label: 'Our Process', id: '#process' },
                { label: 'Pricing', id: '#pricing' },
                { label: 'Contact Us', id: '#contact' },
              ].map(link => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollTo(link.id)}
                    className="text-warm-grey hover:text-gold text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <a href="/login" className="text-warm-grey hover:text-gold text-sm transition-colors duration-200">
                  Merchant Login
                </a>
              </li>
            </ul>
          </div>

          {/* Industry pages */}
          <div>
            <h4 className="font-poppins font-bold text-warm-white text-sm tracking-widest uppercase mb-4">Industries</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Gym Cards', href: '/gym-membership-cards/' },
                { label: 'Salon Cards', href: '/salon-membership-cards/' },
                { label: 'Restaurant Cards', href: '/restaurant-loyalty-cards/' },
                { label: 'Gift Cards', href: '/retail-gift-cards/' },
                { label: 'Hospital Cards', href: '/hospital-health-cards/' },
                { label: 'Supermarket Cards', href: '/supermarket-loyalty-cards/' },
                { label: 'Corporate Cards', href: '/corporate-id-cards/' },
              ].map(link => (
                <li key={link.href}>
                  <a href={link.href} className="text-warm-grey hover:text-gold text-sm transition-colors duration-200">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: '1px solid rgba(201,162,39,0.1)' }}>
          <p className="text-warm-grey/40 text-xs">
            © {currentYear} MetroCardz. All rights reserved.
          </p>
          <div className="flex gap-5">
            {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map(link => (
              <a key={link} href="#" className="text-warm-grey/40 hover:text-warm-grey/70 text-xs transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

