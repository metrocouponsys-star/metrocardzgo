'use client';

import React from 'react';

const BUSINESSES = [
  'Metro Retail', 'The Grand Salon', 'FitZone Gym', 'Coastal Seafood',
  'Green Harvest', 'City Hospital', 'SpeedMart', 'StyleCo',
  'DriveWell Auto', 'Bloom Spa', 'Campus Tutorials', 'FreshFoods',
  'Metro Retail', 'The Grand Salon', 'FitZone Gym', 'Coastal Seafood', // duplicate for marquee loop
  'Green Harvest', 'City Hospital', 'SpeedMart', 'StyleCo',
  'DriveWell Auto', 'Bloom Spa', 'Campus Tutorials', 'FreshFoods',
];

const TESTIMONIALS = [
  {
    quote: 'Our customers love the VIP gold cards. They feel premium and have significantly boosted repeat visits.',
    name: 'Priya Sharma',
    role: 'Owner, The Grand Salon',
    initials: 'PS',
    color: '#C9A227',
  },
  {
    quote: 'MetroCardz delivered 500 custom cards in under a week. The QR codes work perfectly with our loyalty app.',
    name: 'Rahul Mehta',
    role: 'Manager, FitZone Gym',
    initials: 'RM',
    color: '#4ade80',
  },
  {
    quote: 'The foil finish on our restaurant cards genuinely impressed our customers. Reorders every 3 months now.',
    name: 'Anita Krishnan',
    role: 'Director, Coastal Seafood',
    initials: 'AK',
    color: '#fb923c',
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 overflow-hidden" style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #0a0800 50%, #0D0D0D 100%)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Social Proof</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            Trusted by <span className="text-gold-gradient">500+ Businesses</span>
          </h2>
          <p className="text-warm-grey text-base max-w-lg mx-auto">
            From corner salons to restaurant chains — brands across India rely on us.
          </p>
        </div>

        {/* Marquee logo strip */}
        <div className="relative mb-16 overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
          <div className="flex gap-6 animate-marquee w-max">
            {BUSINESSES.map((biz, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap"
                style={{ background: 'rgba(201,162,39,0.07)', border: '1px solid rgba(201,162,39,0.18)', color: 'rgba(201,162,39,0.7)' }}
              >
                {biz}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial cards — styled as physical membership cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 relative overflow-hidden tilt-card"
              style={{
                background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)',
                border: '1.5px solid rgba(201,162,39,0.2)',
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseMove={e => {
                const el = e.currentTarget;
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
                const rx = -((e.clientY - cy) / (rect.height / 2)) * 5;
                const ry = ((e.clientX - cx) / (rect.width / 2)) * 5;
                el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
                el.style.borderColor = 'rgba(201,162,39,0.45)';
                el.style.boxShadow = '0 8px 40px rgba(201,162,39,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
                e.currentTarget.style.borderColor = 'rgba(201,162,39,0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Gold foil top line */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }} />

              {/* Quote icon */}
              <div className="text-4xl text-gold/20 font-poppins font-black mb-4 leading-none">"</div>

              {/* Quote text */}
              <p className="text-warm-white/80 text-sm leading-relaxed mb-6 italic">
                {t.quote}
              </p>

              {/* Author — styled like card number row */}
              <div className="flex items-center gap-3" style={{ borderTop: '1px solid rgba(201,162,39,0.1)', paddingTop: 16 }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-poppins font-bold text-sm" style={{ background: `${t.color}20`, border: `1.5px solid ${t.color}50`, color: t.color }}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-poppins font-bold text-warm-white text-sm">{t.name}</p>
                  <p className="text-warm-grey text-xs">{t.role}</p>
                </div>
                {/* Gold accent */}
                <div className="ml-auto text-gold/30 text-xs font-mono-card tracking-widest">★★★★★</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
