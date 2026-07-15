import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'Metro Cardz vs Alternatives — Compare Loyalty Card Solutions',
  description: 'Compare Metro Cardz with paper loyalty cards, WhatsApp blasts, Stamp Me, Loyalty Loop, and enterprise software. See why Metro Cardz wins on price and features.',
};

const features = [
  'Physical PVC Cards (printed)',
  'Digital card (no app needed)',
  'QR code scanning',
  'Loyalty points engine',
  'Coupon codes & vouchers',
  'Scratch cards / Lucky draws',
  'WhatsApp campaigns',
  'Expiry auto-reminders',
  'Google Wallet pass',
  'Analytics & CSV export',
  'Multi-outlet / multi-user',
  'Referral engine',
  'Card inventory tracking',
  'India-local support',
  'Setup time',
  'Monthly cost (entry)',
];

type Mark = '✅' | '❌' | '⚠️' | string;

const comparisons: { name: string; tag?: string; color: string; values: Mark[] }[] = [
  {
    name: 'Metro Cardz',
    tag: 'Best Value',
    color: 'text-gold border-gold/40 bg-gold/5',
    values: [
      '✅', '✅', '✅', '✅', '✅', '✅', '✅', '✅', '✅', '✅', '✅', '✅', '✅', '✅',
      '< 1 hour', '₹299/mo',
    ],
  },
  {
    name: 'Paper Stamp Card',
    color: 'text-warm-grey border-white/10',
    values: [
      '✅', '❌', '❌', '❌', '❌', '❌', '❌', '❌', '❌', '❌', '❌', '❌', '❌', '✅',
      'Instant', '₹0 (but no retention)',
    ],
  },
  {
    name: 'WhatsApp Blasts Only',
    color: 'text-warm-grey border-white/10',
    values: [
      '❌', '❌', '❌', '❌', '❌', '❌', '✅', '⚠️ Manual', '❌', '❌', '❌', '❌', '❌', '✅',
      'Days', '₹500–₹2000/mo',
    ],
  },
  {
    name: 'Loyalty Loop / Stamp Me',
    color: 'text-warm-grey border-white/10',
    values: [
      '❌', '⚠️ App required', '✅', '✅', '⚠️ Limited', '❌', '⚠️ Add-on', '⚠️ Add-on', '❌', '⚠️ Basic', '⚠️ Limited', '❌', '❌', '❌ HQ in AU/SG',
      '1–2 days', '₹1,500–₹5,000/mo',
    ],
  },
  {
    name: 'Enterprise CRM (Salesforce etc.)',
    color: 'text-warm-grey border-white/10',
    values: [
      '❌', '✅', '✅', '✅', '✅', '❌', '⚠️ Add-on', '✅', '⚠️ Connector', '✅', '✅', '⚠️ Custom dev', '❌', '❌ Global support',
      '3–6 months', '₹50,000+/mo',
    ],
  },
];

export default function AlternativesPage() {
  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 w-full">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 text-center space-y-4 mb-16">
          <span className="text-gold text-xs font-bold uppercase tracking-widest bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
            Alternatives Comparison
          </span>
          <h1 className="text-4xl md:text-5xl font-poppins font-black tracking-tight">
            How Does Metro Cardz <span className="text-gold">Compare?</span>
          </h1>
          <p className="text-warm-grey text-base md:text-lg">
            A transparent, feature-by-feature comparison of every loyalty option available to Indian businesses today.
          </p>
        </section>

        {/* Comparison Table */}
        <section className="max-w-7xl mx-auto px-4 mb-20 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 text-warm-grey text-xs uppercase tracking-widest w-48">Feature</th>
                {comparisons.map((c, i) => (
                  <th key={i} className={`p-4 text-center rounded-t-xl border ${c.color} relative`}>
                    {c.tag && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-black text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                        {c.tag}
                      </div>
                    )}
                    <span className="font-poppins font-bold text-sm block">{c.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feat, fi) => (
                <tr key={fi} className={`border-b border-white/5 ${fi % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                  <td className="p-4 text-warm-grey text-xs font-medium">{feat}</td>
                  {comparisons.map((c, ci) => (
                    <td
                      key={ci}
                      className={`p-4 text-center text-xs border-x ${ci === 0 ? 'border-gold/20 bg-gold/[0.03]' : 'border-white/5'}`}
                    >
                      <span className={`${c.values[fi] === '✅' ? 'text-green-400' : c.values[fi] === '❌' ? 'text-red-400/70' : 'text-yellow-400'}`}>
                        {c.values[fi]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Key Differentiators */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <h2 className="text-2xl md:text-3xl font-poppins font-black text-warm-white text-center mb-10">
            Why Metro Cardz Wins for Indian Businesses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'payments', title: 'India-First Pricing', desc: 'Priced in INR, built for Indian SMEs. Starting at ₹299/month — not $29. No forex conversion risk.' },
              { icon: 'credit_card', title: 'Physical + Digital', desc: 'The only platform that handles both printed PVC cards and digital wallet passes — a full card lifecycle.' },
              { icon: 'support_agent', title: 'Local Support', desc: 'Support via WhatsApp in IST business hours. Talk to a real person who understands Indian business culture.' },
            ].map((d, i) => (
              <div key={i} className="bg-[#111111] border border-gold/10 p-6 rounded-2xl space-y-3">
                <div className="w-11 h-11 bg-gold/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-gold text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>{d.icon}</span>
                </div>
                <h3 className="font-poppins font-bold text-warm-white text-sm">{d.title}</h3>
                <p className="text-warm-grey text-xs leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 text-center space-y-5">
          <h2 className="text-2xl font-poppins font-black text-warm-white">Switch Today — First 25 Members Free</h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/login" className="btn-primary">Start Free</a>
            <a href="/pricing" className="btn-outline">See Full Pricing</a>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
