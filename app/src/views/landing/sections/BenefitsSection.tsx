'use client';

import React from 'react';

/* ─── Benefit data ──────────────────────────────────────────────────────────── */
const BENEFITS = [
  {
    tag: 'Physical Cards',
    headline: 'Give Every Customer a',
    highlight: 'Premium Card',
    desc: 'Hand your customers a beautifully crafted PVC card with gold foil, QR code, hologram, and your brand — a tangible asset that keeps your business in their wallet every single day.',
    cta: 'Explore Card Designs',
    ctaHref: '#cards',
    image: '/images/cards/okhero.jpeg',
    imageAlt: 'Premium gold foil membership card by MetroCardz',
    imageType: 'card' as const,
  },
  {
    tag: 'Smart Dashboard',
    headline: 'Track Every Visit,',
    highlight: 'Automatically',
    desc: 'See every member\'s purchase history, points balance, and visit frequency in a single dashboard. Record purchases in seconds, manage tiers, and never lose a customer\'s data.',
    cta: 'See the Dashboard',
    ctaHref: '#contact',
    image: '/images/phone-dashboard.png',
    imageAlt: 'MetroCardz merchant dashboard on mobile phone',
    imageType: 'phone' as const,
  },
  {
    tag: 'Loyalty Engine',
    headline: 'Reward Loyalty With',
    highlight: 'Real Points',
    desc: 'Configure point-per-rupee rules, set tier thresholds (Silver → Gold → Platinum), and create a reward catalog your customers actually want. Points that drive repeat visits.',
    cta: 'Learn About Tiers',
    ctaHref: '#contact',
    image: null,
    imageAlt: 'Points and tier progression system',
    imageType: 'tier' as const,
  },
  {
    tag: 'WhatsApp Automation',
    headline: 'Bring Customers Back With',
    highlight: 'WhatsApp',
    desc: 'Automated birthday wishes, visit reminders, offer alerts, and point-balance updates — delivered straight to WhatsApp, where your customers already spend their time.',
    cta: 'See How It Works',
    ctaHref: '#contact',
    image: '/images/phone-whatsapp.png',
    imageAlt: 'WhatsApp notification from Metro Salon & Spa',
    imageType: 'phone' as const,
  },
  {
    tag: 'Self-Service',
    headline: 'Customers Check Their Own',
    highlight: 'Balance',
    desc: 'No app download needed. Customers scan the QR on their card or visit a simple link — they see their points, tier status, and available offers instantly in any browser.',
    cta: 'Try the Check Page',
    ctaHref: '/check-membership',
    image: null,
    imageAlt: 'Self-check membership balance page',
    imageType: 'browser' as const,
  },
];

/* ─── Tier Graphic (rendered via CSS) ────────────────────────────────────── */
const TierGraphic: React.FC = () => {
  const tiers = [
    { name: 'Silver', pts: '0 – 999', pct: 33, color: '#A0AEC0' },
    { name: 'Gold', pts: '1,000 – 2,999', pct: 66, color: '#C9A227' },
    { name: 'Platinum', pts: '3,000+', pct: 100, color: '#E5E4E2' },
  ];
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(201,162,39,0.04)', border: '1px solid rgba(201,162,39,0.15)' }}>
        <p className="font-poppins font-bold text-warm-white text-base">Tier Progression</p>
        {tiers.map((t) => (
          <div key={t.name} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-poppins font-semibold text-sm" style={{ color: t.color }}>{t.name}</span>
              <span className="text-warm-white/40 text-xs">{t.pts} pts</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${t.pct}%`, background: `linear-gradient(90deg, ${t.color}88, ${t.color})` }}
              />
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(201,162,39,0.1)' }}>
          <span className="material-symbols-outlined text-gold text-lg">emoji_events</span>
          <span className="text-warm-white/50 text-xs">Members earn 1 point per ₹10 spent</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Browser Check-Page Mockup (rendered via CSS) ──────────────────────── */
const BrowserMockup: React.FC = () => (
  <div className="w-full max-w-sm mx-auto">
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(201,162,39,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 mx-3 px-3 py-1 rounded-md text-[10px] text-warm-white/30" style={{ background: 'rgba(255,255,255,0.05)' }}>
          metrocardz.in/check-membership
        </div>
      </div>
      {/* Page content */}
      <div className="p-5 space-y-4" style={{ background: '#0f0f0f' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D4AF37, #7A5C12)' }}>
            <span className="font-poppins font-black text-black text-xs">M</span>
          </div>
          <p className="font-poppins font-bold text-warm-white text-sm">Rahul Mehta</p>
          <p className="text-warm-white/40 text-xs">Gold Member</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.15)' }}>
          <p className="text-warm-white/50 text-[10px] uppercase tracking-wider">Points Balance</p>
          <p className="font-poppins font-black text-gold text-2xl">2,450</p>
          <p className="text-warm-white/30 text-[10px]">550 pts to Platinum</p>
        </div>
        <div className="space-y-2">
          {[
            { store: 'Sunset Salon', pts: '+120', date: '01 Aug' },
            { store: 'Coffee Hub', pts: '+80', date: '30 Jul' },
          ].map((tx) => (
            <div key={tx.store} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <p className="text-warm-white text-xs font-medium">{tx.store}</p>
                <p className="text-warm-white/30 text-[10px]">{tx.date}</p>
              </div>
              <span className="text-green-400 text-xs font-semibold">{tx.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main Section ─────────────────────────────────────────────────────────── */
export const BenefitsSection: React.FC = () => {
  return (
    <section id="benefits" className="py-24" style={{ background: '#0D0D0D' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section header */}
        <div className="text-center mb-20 reveal-up">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Platform Benefits</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            Everything Your Business <span className="text-gold-gradient">Needs</span>
          </h2>
          <p className="text-warm-grey text-base max-w-xl mx-auto">
            From premium physical cards to automated WhatsApp reminders — one platform that drives customers back through your door.
          </p>
        </div>

        {/* Alternating benefit blocks */}
        <div className="space-y-28">
          {BENEFITS.map((b, i) => {
            const isEven = i % 2 === 0;
            return (
              <div
                key={b.tag}
                className="reveal-up grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
              >
                {/* Text column */}
                <div className={`space-y-5 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  {/* Tag pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <span className="text-gold text-xs font-semibold tracking-wider uppercase">{b.tag}</span>
                  </div>

                  {/* Headline */}
                  <h3 className="font-poppins font-black text-3xl sm:text-4xl text-warm-white leading-tight">
                    {b.headline}
                    <br />
                    <span className="text-gold-gradient">{b.highlight}</span>
                  </h3>

                  {/* Description */}
                  <p className="text-warm-grey text-base leading-relaxed max-w-lg">
                    {b.desc}
                  </p>

                  {/* CTA */}
                  <a
                    href={b.ctaHref}
                    className="inline-flex items-center gap-2 text-gold font-semibold text-sm hover:text-warm-white transition-colors duration-200 group"
                    onClick={(e) => {
                      if (b.ctaHref.startsWith('#')) {
                        e.preventDefault();
                        document.querySelector(b.ctaHref)?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    {b.cta}
                    <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </a>
                </div>

                {/* Image column */}
                <div className={`flex items-center justify-center ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  {b.imageType === 'card' && b.image && (
                    <div className="relative">
                      {/* Ambient glow */}
                      <div className="absolute -inset-10 opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)', filter: 'blur(40px)' }} />
                      <img
                        src={b.image}
                        alt={b.imageAlt}
                        className="relative rounded-2xl w-full max-w-md animate-float"
                        style={{
                          boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(201,162,39,0.15)',
                          border: '1px solid rgba(201,162,39,0.2)',
                        }}
                        loading="lazy"
                      />
                    </div>
                  )}

                  {b.imageType === 'phone' && b.image && (
                    <div className="relative">
                      <div className="absolute -inset-10 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)', filter: 'blur(40px)' }} />
                      <img
                        src={b.image}
                        alt={b.imageAlt}
                        className="relative w-64 sm:w-72 lg:w-80 animate-float"
                        style={{
                          filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.6))',
                        }}
                        loading="lazy"
                      />
                    </div>
                  )}

                  {b.imageType === 'tier' && <TierGraphic />}

                  {b.imageType === 'browser' && <BrowserMockup />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-24 reveal-up">
          <button
            onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 rounded-full font-poppins font-bold text-rich-black transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)', boxShadow: '0 0 30px rgba(201,162,39,0.3)' }}
          >
            Get Started — It&apos;s Free
          </button>
        </div>
      </div>
    </section>
  );
};
