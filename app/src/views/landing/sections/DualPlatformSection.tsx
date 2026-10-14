'use client';

import React, { useState } from 'react';

export const DualPlatformSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'both' | 'merchant' | 'go'>('both');

  const scrollToContact = () => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative py-24 sm:py-32 px-6 lg:px-10 overflow-hidden bg-[#070709] border-t border-b border-white/5 reveal-up">
      {/* Background ambient glows */}
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-xs font-bold tracking-widest uppercase border"
            style={{
              background: 'rgba(212,175,55,0.08)',
              borderColor: 'rgba(212,175,55,0.25)',
              color: '#D4AF37',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Two Connected Platforms. One Ecosystem.
          </div>

          <h2
            className="font-poppins font-black text-3xl sm:text-5xl lg:text-5xl tracking-tight mb-5"
            style={{ color: '#FAFAFA' }}
          >
            Powering Storefronts.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #C9A227 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Rewarding Members.
            </span>
          </h2>

          <p className="text-base sm:text-lg leading-relaxed text-white/60">
            Whether you are a retail store merchant building customer loyalty or a member claiming 40% OFF deals across Mumbai — Metro Cardz gives you dedicated, high-speed tools.
          </p>

          {/* Quick Filter Buttons for Mobile/Tablet */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'both'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              Show Both Platforms
            </button>
            <button
              onClick={() => setActiveTab('merchant')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'merchant'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              🏪 Merchant Suite
            </button>
            <button
              onClick={() => setActiveTab('go')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'go'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              ⚡ Metro Cardz GO
            </button>
          </div>
        </div>

        {/* Dual Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* PLATFORM 1: MERCHANT SUITE */}
          {(activeTab === 'both' || activeTab === 'merchant') && (
            <div
              className="relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between border transition-all duration-300 hover:border-amber-400/40 group"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                borderColor: 'rgba(212,175,55,0.2)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-amber-400/5 blur-3xl pointer-events-none" />

              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
                    >
                      <span className="material-symbols-outlined text-[24px]">storefront</span>
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300/80">
                        For Businesses &amp; Retailers
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white font-poppins">
                        Merchant Loyalty POS
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/25">
                    B2B Platform
                  </span>
                </div>

                <p className="text-sm sm:text-base text-white/70 mb-8 leading-relaxed">
                  Turn walk-in shoppers into loyal repeat customers. Counter staff can enroll members in 10 seconds via phone number or NFC card tap, triggering instant WhatsApp reward alerts without any app download.
                </p>

                {/* Features List */}
                <div className="space-y-4 mb-10">
                  {[
                    {
                      icon: 'flash_on',
                      title: '10-Second Counter Enrollment',
                      desc: 'Cashier issues digital or custom PVC card instantly by phone number.',
                    },
                    {
                      icon: 'chat',
                      title: 'Automated WhatsApp Notifications',
                      desc: 'Members receive real-time balance updates, scratch cards & birthday perks.',
                    },
                    {
                      icon: 'loyalty',
                      title: 'Multi-Tier Loyalty Rules',
                      desc: 'Automate Bronze, Silver, Gold & VIP reward multipliers and expiry cycles.',
                    },
                    {
                      icon: 'verified_user',
                      title: 'DPDP Act 2023 & DPA Ready',
                      desc: 'Built-in privacy consent, opt-out mechanisms & master bilateral data agreements.',
                    },
                  ].map((feat) => (
                    <div key={feat.title} className="flex items-start gap-3.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37' }}
                      >
                        <span className="material-symbols-outlined text-[17px]">{feat.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white/90">{feat.title}</h4>
                        <p className="text-xs text-white/50 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <a
                  href="/login"
                  className="px-6 py-3.5 rounded-2xl font-poppins font-bold text-sm inline-flex items-center justify-center gap-2 transition-all duration-300 hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                    color: '#0A0A0C',
                    boxShadow: '0 10px 25px rgba(212,175,55,0.25)',
                  }}
                >
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  <span>Merchant Portal Login →</span>
                </a>

                <button
                  onClick={scrollToContact}
                  className="px-5 py-3.5 rounded-2xl font-poppins font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/5 border border-white/15 text-white/80 cursor-pointer"
                >
                  <span>Request Store Demo</span>
                </button>
              </div>
            </div>
          )}

          {/* PLATFORM 2: METRO CARDZ GO & MEMBER HUB */}
          {(activeTab === 'both' || activeTab === 'go') && (
            <div
              className="relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between border transition-all duration-300 hover:border-amber-400/50 group"
              style={{
                background: 'linear-gradient(180deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                borderColor: 'rgba(212,175,55,0.3)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #FFD700 0%, #C9A227 100%)', color: '#08080A' }}
                    >
                      <span className="material-symbols-outlined text-[24px] font-bold">bolt</span>
                    </span>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300/90">
                        For Members &amp; Deal Hunters
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white font-poppins">
                        Metro Cardz GO Platform
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/35 animate-pulse">
                    ⚡ 40% OFF Deals
                  </span>
                </div>

                <p className="text-sm sm:text-base text-white/70 mb-8 leading-relaxed">
                  Unlock unmatched lifestyle privileges across Mumbai. Get flat 30%–40% discounts on premium dining, rooftop lounges, weekend resorts, and water parks, plus self-service points lookup anytime.
                </p>

                {/* Features List */}
                <div className="space-y-4 mb-10">
                  {[
                    {
                      icon: 'percent',
                      title: 'Up to 40% OFF Mumbai Hotspots',
                      desc: 'Save big at top-rated restaurants, cafes, luxury resorts and adventure parks.',
                    },
                    {
                      icon: 'confirmation_number',
                      title: '1-Year Weekend & Resort Passes',
                      desc: 'Instant digital passes ready to present at venue reception counters.',
                    },
                    {
                      icon: 'account_balance_wallet',
                      title: 'Instant Self-Service Points Check',
                      desc: 'Lookup loyalty balance & card status by phone number without passwords.',
                    },
                    {
                      icon: 'wallet',
                      title: 'Digital Mobile Wallet Pass',
                      desc: 'Save your VIP card to Apple & Google Wallet for 1-tap counter presentation.',
                    },
                  ].map((feat) => (
                    <div key={feat.title} className="flex items-start gap-3.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'rgba(212,175,55,0.18)', color: '#FFD700' }}
                      >
                        <span className="material-symbols-outlined text-[17px]">{feat.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white/90">{feat.title}</h4>
                        <p className="text-xs text-white/50 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Button to Load GO Page */}
                <a
                  href="/go"
                  className="px-6 py-3.5 rounded-2xl font-poppins font-black text-sm inline-flex items-center justify-center gap-2 transition-all duration-300 hover:scale-102 active:scale-98 shadow-xl cursor-pointer group"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 50%, #C9A227 100%)',
                    color: '#08080A',
                    boxShadow: '0 12px 30px rgba(212,175,55,0.3)',
                  }}
                  title="Load Metro Cardz GO Lifestyle Deals Platform"
                >
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:rotate-12">bolt</span>
                  <span>Load GO Page ⚡</span>
                </a>

                {/* Member Check My Points */}
                <a
                  href="/check-membership"
                  className="px-5 py-3.5 rounded-2xl font-poppins font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all duration-300 hover:scale-102 active:scale-98 border border-amber-400/30 bg-amber-400/10 text-white hover:border-amber-400/60 cursor-pointer"
                  title="Lookup Your Live Points Balance"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ color: '#D4AF37' }}>stars</span>
                  <span>Check My Points</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
