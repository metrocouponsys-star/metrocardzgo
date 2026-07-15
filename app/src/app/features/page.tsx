import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'Features — Metro Cardz | Loyalty & Membership Card Platform',
  description: 'Explore Metro Cardz features: digital membership cards, QR scanning, loyalty points, coupon codes, scratch cards, gift vouchers, lucky draws, and WhatsApp campaigns.',
};

const merchantFeatures = [
  { icon: 'credit_card', title: 'Custom Membership Cards', desc: 'Gold foil, holographic, PVC cards printed and shipped in your brand. QR codes auto-generated for every member.' },
  { icon: 'qr_code_scanner', title: 'Instant QR Redemption', desc: 'Staff scan the customer\'s card or phone in under 2 seconds. No app needed — works on any camera phone.' },
  { icon: 'people', title: 'Member Directory', desc: 'Full CRUD member management with search, filters by membership type, status, expiry, and loyalty points balance.' },
  { icon: 'campaign', title: 'WhatsApp Campaigns', desc: 'One-click bulk WhatsApp blasts to your members via AiSensy/Interakt. Birthday greetings, expiry reminders, offers.' },
  { icon: 'bar_chart', title: 'Analytics & Reports', desc: 'Redemption history, new member growth, top customers, points flow, and CSV export for offline analysis.' },
  { icon: 'group_add', title: 'Multi-Outlet Management', desc: 'Unlimited staff accounts per merchant. Admin and owner roles with scoped access control per outlet.' },
  { icon: 'inventory_2', title: 'Card Inventory Tracking', desc: 'Platform-level card batch management. Track printed, allocated, linked, and retired physical cards.' },
  { icon: 'storefront', title: 'Multiple Membership Tiers', desc: 'Create Silver, Gold, Platinum membership types with different offer sets, prices, and durations per tier.' },
];

const customerFeatures = [
  { icon: 'wallet', title: 'Digital Card (No App Needed)', desc: 'Members receive a secure link to their card. Bookmark it — works like an app with zero install friction.' },
  { icon: 'card_giftcard', title: 'Points & Rewards', desc: 'Earn points on every transaction. Redeem for items from the reward catalog — free chai to spa sessions.' },
  { icon: 'confirmation_number', title: 'Coupon Codes', desc: 'Get unique coupon codes for discounts, buy-one-get-one, or service upgrades. Works at POS instantly.' },
  { icon: 'redeem', title: 'Gift Vouchers', desc: 'Merchants can issue prepaid gift vouchers. Customers share or use — full redemption tracking.' },
  { icon: 'casino', title: 'Scratch Cards & Lucky Draws', desc: 'Gamified engagement: instant-win scratch cards and monthly lucky draws to boost repeat visits.' },
  { icon: 'person_check', title: 'Self-Check Status Page', desc: 'Members check their own points, offers, and expiry from a public URL — no login required.' },
  { icon: 'add_to_wallet', title: 'Google Wallet Pass', desc: 'Save your membership to Google Wallet for Android. Always updated, always accessible offline.' },
  { icon: 'star_rate', title: 'Feedback & Ratings', desc: 'Members leave a star rating after redemption. Merchants see trends without leaving the portal.' },
];

const loyaltyFeatures = [
  { icon: 'bolt', title: 'Flexible Points Rules', desc: 'Set earning rules per visit, per rupee spent, or per offer redeemed. Auto-apply on scan.' },
  { icon: 'recycling', title: 'Referral Engine', desc: 'Every member gets a unique referral code. Referrer and referee both earn bonus points on signup.' },
  { icon: 'notification_important', title: 'Auto Expiry Reminders', desc: 'Configurable rules fire WhatsApp or SMS at 30, 15, and 7 days before expiry — fully automated.' },
  { icon: 'calendar_today', title: 'Birthday & Anniversary Triggers', desc: 'Auto-send birthday offers on the member\'s special day with no manual work.' },
];

export default function FeaturesPage() {
  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 w-full">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 text-center space-y-4 mb-20">
          <span className="text-gold text-xs font-bold uppercase tracking-widest bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
            Platform Features
          </span>
          <h1 className="text-4xl md:text-6xl font-poppins font-black text-warm-white tracking-tight mt-3">
            Everything You Need to Run a{' '}
            <span className="text-gold">Loyalty Programme</span>
          </h1>
          <p className="text-warm-grey text-base md:text-lg max-w-2xl mx-auto">
            From physical card printing to digital wallet passes — Metro Cardz covers the full membership lifecycle so you can focus on delighting your customers.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <a href="/login" className="btn-primary">Start Free</a>
            <a href="/pricing" className="btn-outline">View Pricing</a>
          </div>
        </section>

        {/* Merchant Features */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <span className="text-gold text-xs uppercase tracking-widest font-bold">For Merchants</span>
            <h2 className="text-2xl md:text-4xl font-poppins font-black text-warm-white mt-2">Run Your Programme Effortlessly</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {merchantFeatures.map((f, i) => (
              <div
                key={i}
                className="group bg-[#111111] border border-gold/10 hover:border-gold/30 p-5 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,162,39,0.08)] space-y-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <span className="material-symbols-outlined text-gold text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <h3 className="font-poppins font-bold text-warm-white text-sm">{f.title}</h3>
                <p className="text-warm-grey text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Customer Features */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <span className="text-gold text-xs uppercase tracking-widest font-bold">For Customers</span>
            <h2 className="text-2xl md:text-4xl font-poppins font-black text-warm-white mt-2">A Membership They'll Actually Use</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {customerFeatures.map((f, i) => (
              <div
                key={i}
                className="group bg-[#111111] border border-gold/10 hover:border-gold/30 p-5 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,162,39,0.08)] space-y-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <span className="material-symbols-outlined text-gold text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <h3 className="font-poppins font-bold text-warm-white text-sm">{f.title}</h3>
                <p className="text-warm-grey text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Loyalty Engine */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <span className="text-gold text-xs uppercase tracking-widest font-bold">Loyalty Engine</span>
            <h2 className="text-2xl md:text-4xl font-poppins font-black text-warm-white mt-2">Automation That Runs While You Sleep</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {loyaltyFeatures.map((f, i) => (
              <div
                key={i}
                className="group bg-gradient-to-br from-gold/5 to-transparent border border-gold/15 hover:border-gold/30 p-5 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,162,39,0.08)] space-y-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <span className="material-symbols-outlined text-gold text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                </div>
                <h3 className="font-poppins font-bold text-warm-white text-sm">{f.title}</h3>
                <p className="text-warm-grey text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-primary/10 via-gold/5 to-transparent border border-gold/20 p-10 rounded-3xl text-center space-y-5">
            <h2 className="text-2xl md:text-4xl font-poppins font-black text-warm-white">
              Ready to launch your loyalty programme?
            </h2>
            <p className="text-warm-grey text-sm md:text-base">Get started free — first 25 members on us. No credit card required.</p>
            <div className="flex items-center justify-center gap-4">
              <a href="/login" className="btn-primary">Get Started Free</a>
              <a href="/contact" className="btn-outline">Talk to Sales</a>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
