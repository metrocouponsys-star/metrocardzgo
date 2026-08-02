'use client';

import React from 'react';

/* ─── Product modules ───────────────────────────────────────────────────────── */
const MODULES = [
  {
    icon: 'palette',
    name: 'Card Studio',
    desc: 'Premium physical card design & printing — gold foil, holograms, QR codes, chips, all in CR80 PVC.',
    href: '#cards',
  },
  {
    icon: 'trophy',
    name: 'Loyalty Engine',
    desc: 'Configurable points-per-rupee, multi-tier rewards (Silver → Gold → Platinum), and smart earning rules.',
    href: '#contact',
  },
  {
    icon: 'chat',
    name: 'Engagement Suite',
    desc: 'Automated WhatsApp & SMS campaigns — birthday wishes, visit reminders, offer alerts, and balance updates.',
    href: '#contact',
  },
  {
    icon: 'monitoring',
    name: 'Merchant Dashboard',
    desc: 'Real-time reports, member management, purchase history, and analytics — all in one clean dashboard.',
    href: '#contact',
  },
  {
    icon: 'smartphone',
    name: 'Customer Wallet',
    desc: 'Self-check page for customers to view points, tier, and offers — no app download needed, works in any browser.',
    href: '/check-membership',
  },
  {
    icon: 'group_add',
    name: 'Referral & Growth',
    desc: 'Built-in refer-and-earn program — your best customers bring in new ones, automatically rewarded.',
    href: '#contact',
  },
];

export const ProductSuiteSection: React.FC = () => {
  return (
    <section className="py-24" style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #0f0c00 50%, #0D0D0D 100%)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12 reveal-up">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Complete Platform</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            End-to-End <span className="text-gold-gradient">Customer Lifecycle Engine</span>
          </h2>
          <p className="text-warm-grey text-base max-w-xl mx-auto">
            Acquire, Engage, Reward, Retain, and Repeat — everything you need to grow repeat customer revenue.
          </p>
        </div>

        {/* Platform Overview Banner Graphic (from okkk.png) */}
        <div className="mb-16 reveal-up relative rounded-2xl overflow-hidden border border-gold/20 shadow-2xl group" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-primary/10 opacity-50 pointer-events-none" />
          <img
            src="/images/platform-overview.png"
            alt="Metro Cardz Complete Customer Lifecycle & Platform Overview"
            className="w-full h-auto object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.01]"
          />
        </div>

        {/* 3×2 Grid Header */}
        <div className="text-center mb-10 reveal-up">
          <h3 className="font-poppins font-bold text-2xl text-warm-white mb-2">Six Power Modules</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((m) => (
            <div
              key={m.name}
              className="reveal-up group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'rgba(201,162,39,0.03)',
                border: '1px solid rgba(201,162,39,0.12)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(201,162,39,0.35)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(201,162,39,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(201,162,39,0.12)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)' }}
              >
                <span className="material-symbols-outlined text-gold text-xl">{m.icon}</span>
              </div>

              {/* Name */}
              <h3 className="font-poppins font-bold text-warm-white text-lg mb-2">{m.name}</h3>

              {/* Desc */}
              <p className="text-warm-grey text-sm leading-relaxed mb-4">{m.desc}</p>

              {/* Link */}
              <a
                href={m.href}
                className="inline-flex items-center gap-1.5 text-gold text-xs font-semibold hover:text-warm-white transition-colors duration-200 group/link"
                onClick={(e) => {
                  if (m.href.startsWith('#')) {
                    e.preventDefault();
                    document.querySelector(m.href)?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Learn More
                <span className="inline-block transition-transform duration-200 group-hover/link:translate-x-1">→</span>
              </a>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14 reveal-up">
          <button
            onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 rounded-full font-poppins font-bold text-rich-black transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)', boxShadow: '0 0 30px rgba(201,162,39,0.3)' }}
          >
            Request a Free Demo
          </button>
        </div>
      </div>
    </section>
  );
};
