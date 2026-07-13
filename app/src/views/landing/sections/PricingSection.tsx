'use client';

import React, { useRef, useState } from 'react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹2,999',
    per: 'for 100 cards',
    popular: false,
    color: 'from-slate-900 to-gray-900',
    accent: 'rgba(201,162,39,0.5)',
    features: [
      'Custom front design',
      'Standard PVC card',
      'Your logo & branding',
      'Basic QR code',
      'Delivered in 7 days',
      '100 cards included',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: '₹7,499',
    per: 'for 500 cards',
    popular: true,
    color: 'from-yellow-950 to-amber-950',
    accent: '#C9A227',
    features: [
      'Front + back custom design',
      'Premium PVC card',
      'Gold foil printing',
      'QR code + offers grid',
      'Hologram sticker',
      'Delivered in 5 days',
      '500 cards included',
      'Free design mockup',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    per: 'quote on request',
    popular: false,
    color: 'from-indigo-950 to-blue-950',
    accent: 'rgba(201,162,39,0.5)',
    features: [
      'Everything in Business',
      'Smart chip / NFC enabled',
      'Embossed card number',
      'Multi-language support',
      'Bulk pricing (1000+)',
      'Dedicated account manager',
      'White-glove delivery',
      'Platform integration support',
    ],
  },
];

export const PricingSection: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const tiltRefs = useRef<Record<string, { rx: number; ry: number }>>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = -((e.clientY - cy) / (rect.height / 2)) * 6;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 6;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${id === 'business' ? 1.07 : 1.02})`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.currentTarget.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) scale(${id === 'business' ? 1.05 : 1})`;
  };

  return (
    <section id="pricing" className="py-24" style={{ background: '#0D0D0D' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Transparent Pricing</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            Choose Your <span className="text-gold-gradient">Package</span>
          </h2>
          <p className="text-warm-grey text-base max-w-lg mx-auto">
            All packages include free design revision. No hidden charges.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start md:items-center">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className="tilt-card rounded-2xl overflow-hidden relative"
              style={{
                background: `linear-gradient(135deg, #111 0%, #0d0d0d 100%)`,
                border: plan.popular ? '1.5px solid rgba(201,162,39,0.6)' : '1px solid rgba(201,162,39,0.15)',
                boxShadow: plan.popular ? '0 0 40px rgba(201,162,39,0.2), 0 0 80px rgba(201,162,39,0.08)' : 'none',
                transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                zIndex: plan.popular ? 2 : 1,
              }}
              onMouseMove={e => handleMouseMove(e, plan.id)}
              onMouseLeave={e => handleMouseLeave(e, plan.id)}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 py-2 text-center" style={{ background: 'linear-gradient(90deg, #7A5C12, #C9A227, #D4AF37, #C9A227, #7A5C12)' }}>
                  <span className="font-poppins font-black text-xs text-black tracking-widest uppercase">⭐ Most Popular</span>
                </div>
              )}

              <div className={`p-7 ${plan.popular ? 'pt-12' : ''}`}>
                {/* Plan name */}
                <p className="font-poppins font-bold text-sm tracking-widest uppercase mb-3" style={{ color: plan.popular ? '#C9A227' : 'rgba(201,162,39,0.5)' }}>
                  {plan.name}
                </p>

                {/* Price */}
                <div className="mb-1">
                  <span className="font-poppins font-black text-4xl text-warm-white">{plan.price}</span>
                </div>
                <p className="text-warm-grey text-sm mb-6">{plan.per}</p>

                {/* Divider */}
                <div className="h-px mb-6" style={{ background: 'rgba(201,162,39,0.15)' }} />

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="text-gold mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-warm-white/70 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full py-3.5 rounded-full font-poppins font-bold text-sm transition-all duration-200 hover:scale-105"
                  style={plan.popular
                    ? { background: 'linear-gradient(135deg, #D4AF37, #C9A227)', color: '#0D0D0D', boxShadow: '0 4px 20px rgba(201,162,39,0.4)' }
                    : { background: 'rgba(201,162,39,0.08)', color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)' }
                  }
                >
                  {plan.id === 'enterprise' ? 'Get Custom Quote' : 'Get Started'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom trust line */}
        <p className="text-center text-warm-grey/50 text-sm mt-10">
          Free design mockup included with every plan. No obligation.
        </p>
      </div>
    </section>
  );
};
