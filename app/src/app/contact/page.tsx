'use client';
import React, { useState } from 'react';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';
import { useToastStore } from '@/store/toastStore';

export default function ContactPage() {
  const { addToast } = useToastStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', businessName: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      addToast('error', 'Please fill in your name and mobile number.');
      return;
    }
    setSending(true);
    // Simulate sending form data
    await new Promise(r => setTimeout(r, 1200));
    addToast('success', 'Thank you! Our card specialists will reach out to you shortly.');
    setForm({ name: '', email: '', phone: '', businessName: '', message: '' });
    setSending(false);
  };

  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 max-w-6xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-5xl font-poppins font-black text-gold">Get In Touch</h1>
          <p className="text-warm-grey text-sm md:text-base mt-3">
            Want to order custom membership cards or have questions about the loyalty engine? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card bg-[#141414] border border-gold/10 p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold font-poppins text-warm-white">Talk to Card Specialists</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-gold text-[20px]">phone_iphone</span>
                  <div>
                    <span className="text-xs uppercase text-warm-white/50 block">Mobile Support</span>
                    <a href="tel:+919876543210" className="text-sm font-bold text-warm-white hover:text-gold transition-colors">+91 98765 43210</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-gold text-[20px]">chat</span>
                  <div>
                    <span className="text-xs uppercase text-warm-white/50 block">WhatsApp Click-to-Chat</span>
                    <a 
                      href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20custom%20membership%20cards" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm font-bold text-warm-white hover:text-gold transition-colors"
                    >
                      Connect on WhatsApp
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-gold text-[20px]">mail</span>
                  <div>
                    <span className="text-xs uppercase text-warm-white/50 block">Email Inquiry</span>
                    <a href="mailto:hello@metrocardz.in" className="text-sm font-bold text-warm-white hover:text-gold transition-colors">hello@metrocardz.in</a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-gold text-[20px]">schedule</span>
                  <div>
                    <span className="text-xs uppercase text-warm-white/50 block">Business Hours</span>
                    <span className="text-sm font-bold text-warm-white">Mon–Sat, 10 AM–7 PM IST</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="card bg-[#141414] border border-gold/10 p-6 md:p-8 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold font-poppins text-warm-white">Request a Call / Free Design Mockup</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-warm-white/50 mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Arjun Sharma"
                    className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-[#1a1a1a] text-body-md text-warm-white placeholder:text-warm-white/30 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-warm-white/50 mb-1.5 block">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 98765 43210"
                    className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-[#1a1a1a] text-body-md text-warm-white placeholder:text-warm-white/30 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-warm-white/50 mb-1.5 block">Business Name</label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                    placeholder="e.g. Glamour Spa"
                    className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-[#1a1a1a] text-body-md text-warm-white placeholder:text-warm-white/30 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-warm-white/50 mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="e.g. you@example.com"
                    className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-[#1a1a1a] text-body-md text-warm-white placeholder:text-warm-white/30 focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-warm-white/50 mb-1.5 block">Message / Requirements</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Describe your card printing count or loyalty program design needs..."
                  className="w-full p-4 rounded-xl border border-outline-variant bg-[#1a1a1a] text-body-md text-warm-white placeholder:text-warm-white/30 focus:outline-none focus:border-gold transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-full text-sm font-semibold font-poppins text-rich-black transition-all duration-200 hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)' }}
              >
                {sending ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
