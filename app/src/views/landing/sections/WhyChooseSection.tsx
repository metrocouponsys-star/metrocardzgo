'use client';

import React from 'react';

/* ─── USP bullets ───────────────────────────────────────────────────────────── */
const REASONS = [
  {
    icon: 'verified',
    headline: '23 Years of Trust',
    desc: 'Real merchants, real results — since before digital loyalty existed.',
  },
  {
    icon: 'devices',
    headline: 'No App Needed',
    desc: 'Works in any browser, on any phone — zero downloads required.',
  },
  {
    icon: 'forum',
    headline: 'WhatsApp-Native',
    desc: 'Reminders where your customers already are — not buried in email.',
  },
  {
    icon: 'currency_rupee',
    headline: 'Built for India',
    desc: 'UPI billing, local support, rupee pricing — designed for Indian businesses.',
  },
];

export const WhyChooseSection: React.FC = () => {
  return (
    <section className="py-24" style={{ background: '#0D0D0D' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16 reveal-up">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Why Us</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            Why Choose <span className="text-gold-gradient">Metro Cardz</span>
          </h2>
          <p className="text-warm-grey text-base max-w-lg mx-auto">
            The only membership card platform built from the ground up for Indian businesses.
          </p>
        </div>

        {/* Bullets grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {REASONS.map((r) => (
            <div
              key={r.headline}
              className="reveal-up text-center lg:text-left space-y-3"
            >
              {/* Icon circle */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto lg:mx-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(201,162,39,0.05))',
                  border: '1px solid rgba(201,162,39,0.25)',
                }}
              >
                <span className="material-symbols-outlined text-gold text-xl">{r.icon}</span>
              </div>

              {/* Headline */}
              <h3 className="font-poppins font-bold text-warm-white text-lg">{r.headline}</h3>

              {/* Desc */}
              <p className="text-warm-grey text-sm leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Divider + CTA */}
        <div className="mt-16 pt-10 text-center reveal-up" style={{ borderTop: '1px solid rgba(201,162,39,0.1)' }}>
          <p className="text-warm-grey text-base mb-6">
            Join <span className="text-gold font-semibold">500+ businesses</span> already using Metro Cardz to grow customer loyalty.
          </p>
          <button
            onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 rounded-full font-poppins font-bold text-rich-black transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)', boxShadow: '0 0 30px rgba(201,162,39,0.3)' }}
          >
            Start For Free Today
          </button>
        </div>
      </div>
    </section>
  );
};
