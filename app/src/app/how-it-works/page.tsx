import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'How It Works — Metro Cardz | 3-Step Loyalty Card Setup',
  description: 'Get your custom loyalty cards live in 3 simple steps: create your programme, print and distribute cards, and watch customers redeem and earn loyalty points.',
};

const steps = [
  {
    num: '01',
    icon: 'add_business',
    title: 'Create Your Programme',
    subtitle: 'Set up in under 10 minutes',
    color: 'from-gold/20 to-gold/5',
    border: 'border-gold/30',
    points: [
      'Create your merchant account and log in to the portal',
      'Define membership types (Silver, Gold, Platinum)',
      'Set up offers, points rules, and reward catalog',
      'Choose your card design — gold foil, holographic, or standard PVC',
    ],
  },
  {
    num: '02',
    icon: 'local_shipping',
    title: 'Print & Distribute',
    subtitle: 'Cards delivered to your door',
    color: 'from-primary/20 to-primary/5',
    border: 'border-primary/30',
    points: [
      'We print cards with your logo, brand colors, and unique QR codes',
      'Cards are delivered to your business within 5–7 working days',
      'Hand cards to customers at POS — that\'s it. No app needed.',
      'Optionally share the member\'s digital card link via WhatsApp',
    ],
  },
  {
    num: '03',
    icon: 'qr_code_scanner',
    title: 'Scan, Reward, Retain',
    subtitle: 'Seamless in-store experience',
    color: 'from-green-500/20 to-green-500/5',
    border: 'border-green-500/30',
    points: [
      'Staff open the Metro Cardz portal and click "Scan / Search Customer"',
      'Scan the QR code on the card or search by name / phone number',
      'Redeem offers with one tap — points update instantly',
      'Auto reminders sent before expiry — customers return on their own',
    ],
  },
];

const faqs = [
  { q: 'Do customers need to download an app?', a: 'No. Customers receive a unique card link by WhatsApp or SMS. They bookmark it — it works like an app on any smartphone browser without any install.' },
  { q: 'How do staff scan cards?', a: 'Staff use the Metro Cardz merchant portal (works on any device with a camera). They can scan the QR code or simply search by name / phone number.' },
  { q: 'How long does card printing take?', a: 'Standard PVC cards ship within 3–5 working days. Premium gold foil and holographic cards take 5–7 working days. Minimum order is 100 cards.' },
  { q: 'Can I manage multiple locations?', a: 'Yes. You can add unlimited staff accounts per location, each with scoped access. The platform supports multi-outlet operation out of the box.' },
  { q: 'What if a customer loses their card?', a: 'No problem. Each member has a permanent digital card link that works independent of the physical card. The QR can also be re-issued.' },
  { q: 'Is there a contract or lock-in?', a: 'Metro Cardz is month-to-month — cancel any time. Annual plans get a 20% discount. No lock-in, no setup fees.' },
];

export default function HowItWorksPage() {
  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 w-full">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 text-center space-y-4 mb-20">
          <span className="text-gold text-xs font-bold uppercase tracking-widest bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
            Simple Setup
          </span>
          <h1 className="text-4xl md:text-6xl font-poppins font-black tracking-tight">
            Live in <span className="text-gold">3 Steps</span>
          </h1>
          <p className="text-warm-grey text-base md:text-lg">
            Most businesses are fully operational in under an hour. No technical knowledge required.
          </p>
        </section>

        {/* Steps */}
        <section className="max-w-6xl mx-auto px-6 mb-20">
          <div className="relative">
            {/* Connector Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold/30 via-primary/30 to-green-500/30 hidden lg:block" style={{ transform: 'translateX(-50%)' }} />
            
            <div className="space-y-12">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'lg:dir-rtl' : ''}`}
                >
                  {/* Content side */}
                  <div className={`space-y-5 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-5xl font-poppins font-black text-transparent bg-clip-text bg-gradient-to-br ${step.color.replace('from-', 'from-').replace('to-', 'to-')}`} style={{ WebkitTextStroke: '1px rgba(201,162,39,0.3)' }}>
                        {step.num}
                      </span>
                      <div>
                        <h2 className="text-xl md:text-2xl font-poppins font-black text-warm-white">{step.title}</h2>
                        <p className="text-warm-grey text-xs">{step.subtitle}</p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {step.points.map((point, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span className="text-gold mt-0.5 shrink-0">✦</span>
                          <span className="text-warm-grey text-sm leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Visual side */}
                  <div className={`${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className={`bg-gradient-to-br ${step.color} border ${step.border} p-8 rounded-3xl flex flex-col items-center justify-center gap-4 min-h-[200px]`}>
                      <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gold text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                      </div>
                      <span className="text-warm-white font-poppins font-bold text-base">{step.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-6 mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-poppins font-black text-warm-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-[#111111] border border-gold/10 rounded-xl overflow-hidden"
              >
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
        <section className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-gold/10 to-primary/10 border border-gold/20 p-10 rounded-3xl text-center space-y-5">
            <h2 className="text-2xl md:text-3xl font-poppins font-black text-warm-white">Start Your Free Trial Today</h2>
            <p className="text-warm-grey text-sm">No credit card. First 25 members free. Cards shipped within a week.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href="/login" className="btn-primary">Create Account Free</a>
              <a href="/contact" className="btn-outline">Book a Demo</a>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
