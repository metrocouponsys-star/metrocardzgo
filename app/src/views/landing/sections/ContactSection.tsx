'use client';

import React, { useState, useRef } from 'react';
import { GoldMemberCardFace } from '../components/CSSCard3D';

const INDUSTRIES = [
  'Retail Store', 'Restaurant / Café', 'Salon & Spa', 'Gym & Fitness',
  'Hospital & Clinic', 'Supermarket', 'Corporate', 'Automotive / Two-Wheeler',
  'Tutorial Classes', 'Readymade Garments', 'Other',
];

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export const ContactSection: React.FC = () => {
  const [form, setForm] = useState({ name: '', business: '', industry: '', phone: '', email: '', message: '' });
  const [formState, setFormState] = useState<FormState>('idle');
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const rx = -((e.clientY - cy) / (rect.height / 2)) * 10;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 10;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const onMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    // Fallback: open mailto with form data
    const subject = encodeURIComponent(`Card Design Request — ${form.business}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nBusiness: ${form.business}\nIndustry: ${form.industry}\nPhone: ${form.phone}\nEmail: ${form.email}\n\nMessage:\n${form.message}`
    );
    window.open(`mailto:hello@metrocardz.in?subject=${subject}&body=${body}`);
    setTimeout(() => {
      setFormState('success');
    }, 500);
  };

  return (
    <section id="contact" className="py-24 overflow-hidden" style={{ background: '#0D0D0D' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">Get Started</p>
          <h2 className="font-poppins font-black text-4xl sm:text-5xl text-warm-white mb-4">
            Get Your <span className="text-gold-gradient">Free Design Mockup</span>
          </h2>
          <p className="text-warm-grey text-base max-w-lg mx-auto">
            Share your details and we'll send you a custom card mockup within 24 hours. No obligation.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Left — form */}
          <div className="order-2 lg:order-1">
            {formState === 'success' ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)' }}>
                  <span className="text-3xl text-black">✓</span>
                </div>
                <h3 className="font-poppins font-black text-2xl text-warm-white mb-3">Request Sent!</h3>
                <p className="text-warm-grey">We'll send your free mockup within 24 hours. Check your email!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-warm-white/50 mb-1.5">Your Name *</label>
                    <input
                      type="text" name="name" required value={form.name} onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl text-sm text-warm-white placeholder:text-warm-grey/50 outline-none transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,39,0.2)' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(201,162,39,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(201,162,39,0.2)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  {/* Business */}
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-warm-white/50 mb-1.5">Business Name *</label>
                    <input
                      type="text" name="business" required value={form.business} onChange={handleChange}
                      placeholder="Your Business"
                      className="w-full px-4 py-3 rounded-xl text-sm text-warm-white placeholder:text-warm-grey/50 outline-none transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,39,0.2)' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(201,162,39,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(201,162,39,0.2)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-warm-white/50 mb-1.5">Industry</label>
                  <select
                    name="industry" value={form.industry} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl text-sm text-warm-white outline-none transition-all duration-200 appearance-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,39,0.2)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(201,162,39,0.6)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(201,162,39,0.2)'; }}
                  >
                    <option value="" style={{ background: '#1a1a1a' }}>Select your industry</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind} style={{ background: '#1a1a1a' }}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-warm-white/50 mb-1.5">Phone *</label>
                    <input
                      type="tel" name="phone" required value={form.phone} onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl text-sm text-warm-white placeholder:text-warm-grey/50 outline-none transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,39,0.2)' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(201,162,39,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(201,162,39,0.2)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold tracking-widest uppercase text-warm-white/50 mb-1.5">Email *</label>
                    <input
                      type="email" name="email" required value={form.email} onChange={handleChange}
                      placeholder="you@business.com"
                      className="w-full px-4 py-3 rounded-xl text-sm text-warm-white placeholder:text-warm-grey/50 outline-none transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,39,0.2)' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(201,162,39,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(201,162,39,0.2)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase text-warm-white/50 mb-1.5">Design Notes</label>
                  <textarea
                    name="message" value={form.message} onChange={handleChange} rows={3}
                    placeholder="Tell us about your card design vision, quantities, special finishes..."
                    className="w-full px-4 py-3 rounded-xl text-sm text-warm-white placeholder:text-warm-grey/50 outline-none transition-all duration-200 resize-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,162,39,0.2)' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(201,162,39,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,162,39,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(201,162,39,0.2)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className="w-full py-4 rounded-xl font-poppins font-bold text-base text-rich-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)', boxShadow: '0 0 30px rgba(201,162,39,0.3)' }}
                >
                  {formState === 'submitting' ? '✦ Sending...' : '✦ Get My Free Mockup'}
                </button>
                <p className="text-center text-warm-grey/40 text-xs">Free design mockup. No obligation. Reply within 24 hours.</p>
              </form>
            )}
          </div>

          {/* Right — ambient tilt card */}
          <div
            className="order-1 lg:order-2 flex items-center justify-center"
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
          >
            <div className="relative">
              {/* Glow */}
              <div className="absolute -inset-12 opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #C9A227, transparent 70%)', filter: 'blur(30px)' }} />

              <div
                ref={cardRef}
                className="w-72 h-44 sm:w-80 sm:h-48"
                style={{ transition: 'transform 0.15s ease-out', filter: 'drop-shadow(0 30px 50px rgba(201,162,39,0.2))' }}
              >
                <GoldMemberCardFace className="w-full h-full" />
              </div>

              {/* Feature tags */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  { label: 'Gold Foil Print', icon: '✦' },
                  { label: 'QR Code Ready', icon: '◉' },
                  { label: 'Custom Design', icon: '◈' },
                  { label: '24h Mockup', icon: '⚡' },
                ].map(tag => (
                  <div key={tag.label} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(201,162,39,0.06)', border: '1px solid rgba(201,162,39,0.15)' }}>
                    <span className="text-gold text-xs">{tag.icon}</span>
                    <span className="text-warm-white/70 text-xs font-medium">{tag.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
