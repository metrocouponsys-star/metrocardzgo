import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'Pricing — Metro Cardz | Loyalty Card Plans for Indian Businesses',
  description: 'Metro Cardz pricing plans starting at ₹299/month. Free tier for first 25 members. Starter, Growth, and Pro plans with custom card printing included.',
};

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: '/forever',
    tag: null,
    desc: 'Perfect for testing before committing.',
    color: 'border-white/10',
    cta: 'Start Free',
    ctaStyle: 'btn-outline',
    features: [
      '25 members',
      'Digital card link',
      'QR redemption',
      'Basic loyalty points',
      '1 membership type',
      'Email support',
      '— No physical cards',
      '— No campaigns',
    ],
  },
  {
    name: 'Starter',
    price: '₹299',
    period: '/month',
    tag: null,
    desc: 'For local businesses just launching their loyalty programme.',
    color: 'border-gold/20',
    cta: 'Get Started',
    ctaStyle: 'btn-outline',
    features: [
      '500 members',
      'Digital card link',
      'QR redemption',
      'Full loyalty engine',
      '3 membership types',
      '100 cards/batch (first batch free)',
      'WhatsApp campaigns',
      'Basic reports + CSV',
      '2 staff accounts',
      'WhatsApp support',
    ],
  },
  {
    name: 'Growth',
    price: '₹699',
    period: '/month',
    tag: 'Most Popular',
    desc: 'For established businesses scaling their customer base.',
    color: 'border-gold/50',
    cta: 'Choose Growth',
    ctaStyle: 'btn-primary',
    features: [
      '2,000 members',
      'Digital + Google Wallet pass',
      'QR redemption',
      'Full loyalty engine',
      'Unlimited membership types',
      '250 premium cards/batch',
      'WhatsApp & SMS campaigns',
      'Advanced analytics',
      '5 staff accounts',
      'Coupon codes & vouchers',
      'Scratch cards & lucky draws',
      'Referral engine',
      'Priority support',
    ],
  },
  {
    name: 'Pro',
    price: '₹1,499',
    period: '/month',
    tag: null,
    desc: 'For multi-outlet chains and high-volume programmes.',
    color: 'border-white/15',
    cta: 'Contact Sales',
    ctaStyle: 'btn-outline',
    features: [
      'Unlimited members',
      'Digital + Google Wallet pass',
      'QR redemption',
      'Full loyalty engine',
      'Unlimited membership types',
      '500+ premium cards/batch',
      'WhatsApp, SMS & Email campaigns',
      'Full analytics suite',
      'Unlimited staff accounts',
      'All Growth features',
      'Multi-outlet management',
      'API access (webhook)',
      'Dedicated account manager',
      'SLA: 4-hour response',
    ],
  },
];

const faqs = [
  { q: 'Are card printing costs included in the plan?', a: 'The Starter plan includes the first batch of 100 standard PVC cards free. Subsequent batches and premium finishes (gold foil, holographic) are billed separately at our card print pricing page.' },
  { q: 'Can I change plans mid-month?', a: 'Yes. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period. No data is lost on downgrade.' },
  { q: 'Is there a contract or minimum commitment?', a: 'All plans are month-to-month. Annual billing saves 20% and is available for Starter, Growth, and Pro. No lock-in.' },
  { q: 'What payment methods are accepted?', a: 'UPI, debit/credit cards, net banking, and bank transfer. All billing is in Indian Rupees (INR). GST invoice provided for every transaction.' },
  { q: 'Do you offer a free trial for paid plans?', a: 'Yes — all paid plans have a 14-day free trial. No credit card required to start the trial.' },
];

export default function PricingPage() {
  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 w-full">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 text-center space-y-4 mb-16">
          <span className="text-gold text-xs font-bold uppercase tracking-widest bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
            Pricing
          </span>
          <h1 className="text-4xl md:text-6xl font-poppins font-black tracking-tight">
            Simple, <span className="text-gold">Transparent</span> Pricing
          </h1>
          <p className="text-warm-grey text-base md:text-lg">
            All prices in Indian Rupees. GST charged separately. Annual billing saves 20%.
          </p>
        </section>

        {/* Pricing Grid */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative bg-[#111111] border rounded-2xl p-6 flex flex-col gap-5 ${plan.color} ${plan.name === 'Growth' ? 'ring-1 ring-gold/40 shadow-[0_0_40px_rgba(201,162,39,0.12)]' : ''}`}
              >
                {plan.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gold text-black text-[11px] font-black px-3 py-1 rounded-full">
                    {plan.tag}
                  </div>
                )}
                <div>
                  <h3 className="font-poppins font-black text-warm-white text-lg">{plan.name}</h3>
                  <p className="text-warm-grey text-xs mt-1">{plan.desc}</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-poppins font-black text-warm-white">{plan.price}</span>
                  <span className="text-warm-grey text-sm mb-1">{plan.period}</span>
                </div>
                <a href="/login" className={`${plan.ctaStyle} text-center text-sm`}>
                  {plan.cta}
                </a>
                <ul className="space-y-2.5 mt-2 flex-1">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className={`flex items-start gap-2 text-xs ${feat.startsWith('—') ? 'text-warm-grey/30' : 'text-warm-grey'}`}>
                      <span className={`shrink-0 mt-0.5 ${feat.startsWith('—') ? 'text-warm-grey/20' : 'text-green-400'}`}>
                        {feat.startsWith('—') ? '✕' : '✓'}
                      </span>
                      <span>{feat.replace('— ', '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Annual Discount Banner */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-poppins font-black text-warm-white text-lg">Save 20% with Annual Billing</h3>
              <p className="text-warm-grey text-sm">Pay upfront for the year and save the equivalent of 2.4 months. Cancel anytime — we'll prorate a refund.</p>
            </div>
            <a href="/contact" className="btn-primary whitespace-nowrap">
              Get Annual Quote
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 mb-20">
          <h2 className="text-2xl font-poppins font-black text-warm-white text-center mb-8">Pricing FAQs</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-[#111111] border border-gold/10 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                  <span className="font-semibold text-warm-white text-sm pr-4">{faq.q}</span>
                  <span className="text-gold shrink-0 transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-warm-grey text-sm leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 text-center space-y-4">
          <h2 className="text-2xl font-poppins font-black text-warm-white">Not Sure Which Plan?</h2>
          <p className="text-warm-grey text-sm">Talk to us on WhatsApp — we'll recommend the right plan for your business size and needs.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a href="/login" className="btn-primary">Start Free Trial</a>
            <a href="/contact" className="btn-outline">Talk to Sales</a>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
