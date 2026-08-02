import type { Metadata } from 'next';
import type { IndustryPage } from '@/lib/seo';
import { buildFAQSchema, buildBreadcrumbSchema, buildProductSchema, SITE_URL } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { FAQSection } from '@/components/seo/FAQSection';
import { Breadcrumb } from '@/components/seo/Breadcrumb';
import { IndustryDemoButton } from '@/components/seo/IndustryDemoButton';
import { CardShowcaseSection, type Category } from '@/views/landing/sections/CardShowcaseSection';

const CATEGORY_BY_SLUG: Record<string, Category> = {
  'restaurant-loyalty-cards': 'Food & Beverage',
  'salon-membership-cards': 'Wellness',
  'gym-membership-cards': 'Wellness',
  'hospital-health-cards': 'Healthcare',
  'retail-gift-cards': 'Retail',
  'supermarket-loyalty-cards': 'Retail',
  'corporate-id-cards': 'Retail',
};

const CARD_IMAGES_BY_SLUG: Record<string, { main: string; secondary: string; tag: string }> = {
  'corporate-id-cards': {
    main: '/images/cards/okhero.jpeg',
    secondary: '/images/cards/vip.jpeg',
    tag: 'Corporate VIP Card',
  },
  'restaurant-loyalty-cards': {
    main: '/images/cards/restaurant.jpeg',
    secondary: '/images/cards/restaurant2.jpeg',
    tag: 'Dining Privilege Card',
  },
  'salon-membership-cards': {
    main: '/images/cards/salon.jpeg',
    secondary: '/images/cards/gift.jpeg',
    tag: 'Salon Luxury Card',
  },
  'supermarket-loyalty-cards': {
    main: '/images/cards/supermarket.jpeg',
    secondary: '/images/cards/membership.png',
    tag: 'Supermarket Points Card',
  },
  'gym-membership-cards': {
    main: '/images/cards/gym.jpeg',
    secondary: '/images/cards/vip.jpeg',
    tag: 'Fitness VIP Card',
  },
  'hospital-health-cards': {
    main: '/images/cards/healthcare.jpeg',
    secondary: '/images/cards/membership.png',
    tag: 'Health Pass Card',
  },
  'retail-gift-cards': {
    main: '/images/cards/membership.png',
    secondary: '/images/cards/jewellery.jpeg',
    tag: 'Retail Gift Card',
  },
};

interface IndustryPageTemplateProps {
  data: IndustryPage;
}

// ─── Shared metadata generator — used by each industry page ──────────────────
export function generateIndustryMetadata(data: IndustryPage): Metadata {
  return {
    title: data.metaTitle,
    description: data.metaDescription,
    keywords: [data.primaryKeyword, 'custom membership card', 'PVC card printing India', 'loyalty card printing'],
    alternates: { canonical: `${SITE_URL}/${data.slug}/` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `${SITE_URL}/${data.slug}/`,
    },
  };
}

// ─── Shared server-rendered page template ────────────────────────────────────
// All text content is in the server-rendered HTML — crawlers index it immediately.
export function IndustryPageTemplate({ data }: IndustryPageTemplateProps) {
  const faqSchema = buildFAQSchema(data.faqs);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/` },
    { name: 'Industries', url: `${SITE_URL}/#industries` },
    { name: data.title, url: `${SITE_URL}/${data.slug}/` },
  ]);
  const productSchema = buildProductSchema([{
    name: data.productName,
    description: data.productDescription,
    image: `${SITE_URL}/images/${data.slug}.jpg`,
    category: data.title,
    url: `${SITE_URL}/${data.slug}/`,
  }]);

  const cardData = CARD_IMAGES_BY_SLUG[data.slug] ?? CARD_IMAGES_BY_SLUG['corporate-id-cards'];

  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema, ...productSchema]} />

      {/* Page root — inherits the dark landing design */}
      {/* NOTE: Do NOT add overflow-x: hidden here — it creates a containing block
           for position:fixed children (IndustryNav), breaking click hit-tests
           on iOS Safari and Android. */}
      <div className="landing-root">

        {/* ─── Nav (same as landing page) ─── */}
        <IndustryNav />

        <main>
          {/* ─── Breadcrumb ─── */}
          <div style={{ background: '#0D0D0D', paddingTop: 64 }}>
            <Breadcrumb
              items={[
                { name: 'Home', href: '/' },
                { name: 'Industries', href: '/#industries' },
                { name: data.title, href: `/${data.slug}/` },
              ]}
            />
          </div>

          {/* ─── Hero ─── */}
          <section
            className="py-20 relative overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at 60% 40%, #1a120040 0%, #0D0D0D 70%)' }}
          >
            {/* Background grid texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(rgba(201,162,39,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }} />

            <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

                {/* Left Column — Content & CTAs */}
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 glass-gold">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    <span className="text-gold text-xs font-semibold tracking-widest uppercase">{data.title}</span>
                  </div>

                  {/* H1 — keyword-natural, server-rendered */}
                  <h1 className="font-poppins font-black text-4xl sm:text-5xl xl:text-6xl leading-tight tracking-tight text-warm-white mb-6">
                    {data.h1}
                  </h1>

                  {/* Answer-first paragraph (40-60 words) */}
                  <p className="text-warm-white/70 text-lg mb-4 leading-relaxed max-w-2xl">
                    {data.introParagraph}
                  </p>
                  <p className="text-warm-white/50 text-base mb-10 leading-relaxed max-w-2xl">
                    {data.secondParagraph}
                  </p>

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href="/#contact"
                      className="px-8 py-4 rounded-full font-poppins font-bold text-base text-rich-black inline-flex items-center justify-center transition-all duration-200 hover:scale-105"
                      style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 50%, #7A5C12 100%)', boxShadow: '0 0 30px rgba(201,162,39,0.4)' }}
                    >
                      ✦ Get Free Design Mockup
                    </a>
                    <a
                      href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20custom%20membership%20cards"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-4 rounded-full font-poppins font-semibold text-base text-gold border border-gold/40 hover:border-gold hover:bg-gold/5 transition-all duration-200 inline-flex items-center justify-center"
                    >
                      WhatsApp Us →
                    </a>
                  </div>

                  {/* ⚡ Live Interactive Demo Launcher for this specific merchant category */}
                  <IndustryDemoButton slug={data.slug} industryTitle={data.title} />

                  {/* Trust stats */}
                  <div className="mt-10 flex gap-8 flex-wrap">
                    {[
                      { num: '500+', label: 'Businesses Served' },
                      { num: '5–7', label: 'Days Delivery' },
                      { num: '100+', label: 'Min. Order' },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="font-poppins font-black text-2xl text-gold">{s.num}</p>
                        <p className="text-warm-white/50 text-xs tracking-wider uppercase">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column — 3D Floating Card Graphic */}
                <div className="lg:col-span-5 flex justify-center items-center relative py-6">
                  {/* Gold ambient background glow */}
                  <div
                    className="absolute w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
                  />

                  {/* Card Display Container */}
                  <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[1.586/1] select-none group">
                    {/* Secondary Card (Behind) */}
                    <div
                      className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:rotate-[14deg] group-hover:translate-x-3 group-hover:-translate-y-2"
                      style={{
                        transform: 'rotate(10deg) translate(16px, -12px) scale(0.92)',
                        border: '1px solid rgba(201,162,39,0.3)',
                        boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                        filter: 'brightness(0.75)',
                      }}
                    >
                      <img
                        src={cardData.secondary}
                        alt={`${data.title} card sample`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Main Card (Front) */}
                    <div
                      className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:rotate-[-4deg] group-hover:scale-[1.03]"
                      style={{
                        transform: 'rotate(-6deg) scale(1)',
                        border: '1px solid rgba(201,162,39,0.5)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 35px rgba(201,162,39,0.3)',
                      }}
                    >
                      {/* Glossy light reflection sheen */}
                      <div
                        className="absolute inset-0 pointer-events-none z-10 opacity-30"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
                        }}
                      />
                      <img
                        src={cardData.main}
                        alt={cardData.tag}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Floating pill badge 1 (Top-Right) */}
                    <div
                      className="absolute -top-4 -right-4 z-20 px-3.5 py-1.5 rounded-full text-xs font-semibold font-poppins text-warm-white flex items-center gap-1.5 shadow-xl"
                      style={{
                        background: 'rgba(13,13,13,0.9)',
                        border: '1px solid rgba(201,162,39,0.4)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <span className="text-gold">✦</span>
                      <span>{cardData.tag}</span>
                    </div>

                    {/* Floating pill badge 2 (Bottom-Left) */}
                    <div
                      className="absolute -bottom-4 -left-4 z-20 px-3.5 py-1.5 rounded-full text-xs font-semibold font-poppins text-warm-white flex items-center gap-1.5 shadow-xl"
                      style={{
                        background: 'rgba(13,13,13,0.9)',
                        border: '1px solid rgba(201,162,39,0.4)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <span className="text-gold">◈</span>
                      <span>CR80 PVC • Gold Foil</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ─── Features grid ─── */}
          <section className="py-20" style={{ background: '#0D0D0D' }}>
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
              <div className="text-center mb-12">
                <p className="text-gold text-xs font-semibold tracking-widest uppercase mb-3">What's Included</p>
                <h2 className="font-poppins font-black text-3xl sm:text-4xl text-warm-white mb-4">
                  Card <span className="text-gold-gradient">Features</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.features.map((feature, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-5 flex items-start gap-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,162,39,0.15)' }}
                  >
                    <span className="text-gold mt-0.5 flex-shrink-0 font-bold">✓</span>
                    <p className="text-warm-white/80 text-sm leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── Sample Card Showcase ─── */}
          <CardShowcaseSection defaultCategory={CATEGORY_BY_SLUG[data.slug] ?? 'All'} />

          {/* ─── Process strip ─── */}
          <section className="py-16" style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #0f0c00 50%, #0D0D0D 100%)' }}>
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
              <div className="text-center mb-10">
                <h2 className="font-poppins font-black text-3xl text-warm-white">
                  How It <span className="text-gold-gradient">Works</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { num: '01', title: 'Share Your Brand', icon: '✦' },
                  { num: '02', title: 'We Design', icon: '◈' },
                  { num: '03', title: 'Print & Finish', icon: '◉' },
                  { num: '04', title: 'Delivered to You', icon: '✔' },
                ].map(step => (
                  <div key={step.num} className="flex flex-col items-center text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl mb-4"
                      style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)', boxShadow: '0 0 20px rgba(201,162,39,0.3)' }}
                    >
                      <span style={{ color: '#0D0D0D' }}>{step.icon}</span>
                    </div>
                    <span className="font-poppins font-black text-xs text-gold tracking-widest mb-1">STEP {step.num}</span>
                    <h3 className="font-poppins font-bold text-warm-white text-sm">{step.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── FAQ with FAQPage schema ─── */}
          <FAQSection faqs={data.faqs} />

          {/* ─── Final CTA ─── */}
          <section className="py-20" style={{ background: '#0D0D0D' }}>
            <div className="max-w-2xl mx-auto px-6 text-center">
              <h2 className="font-poppins font-black text-3xl sm:text-4xl text-warm-white mb-4">
                Ready to Print Your <span className="text-gold-gradient">{data.title}?</span>
              </h2>
              <p className="text-warm-grey mb-8 text-base leading-relaxed">
                Share your brand details and get a free custom card mockup within 24 hours. No obligation.
              </p>
              <a
                href="/#contact"
                className="px-10 py-4 rounded-full font-poppins font-bold text-base text-rich-black inline-flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #C9A227 50%, #7A5C12 100%)', boxShadow: '0 0 40px rgba(201,162,39,0.4)' }}
              >
                ✦ Get My Free Mockup
              </a>
              <p className="text-warm-grey/40 text-xs mt-4">Free design mockup. No obligation. Reply within 24 hours.</p>
            </div>
          </section>
        </main>

        {/* ─── Footer (minimal, links back to home) ─── */}
        <IndustryFooter />
      </div>
    </>
  );
}

// ─── Minimal nav for industry pages ──────────────────────────────────────────
function IndustryNav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{ background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,162,39,0.15)' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2.5">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-md rotate-6 opacity-60" style={{ background: 'linear-gradient(135deg, #7A5C12, #C9A227)' }} />
            <div className="absolute inset-0 rounded-md -rotate-3" style={{ background: 'linear-gradient(135deg, #D4AF37, #7A5C12)' }} />
            <span className="absolute inset-0 flex items-center justify-center font-poppins font-black text-black text-sm">M</span>
          </div>
          <div>
            <span className="font-poppins font-black text-warm-white tracking-tight text-base">Metro</span>
            <span className="font-poppins font-black text-gold tracking-tight text-base">Cardz</span>
          </div>
        </a>
        <div className="flex items-center gap-4">
          <a href="/#industries" className="text-warm-white/60 hover:text-gold text-sm hidden md:block transition-colors">Industries</a>
          <a href="/#pricing" className="text-warm-white/60 hover:text-gold text-sm hidden md:block transition-colors">Pricing</a>
          <a
            href="/#contact"
            className="px-5 py-2 rounded-full text-sm font-semibold font-poppins text-rich-black transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #C9A227)' }}
          >
            Get Free Mockup
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Minimal footer for industry pages ───────────────────────────────────────
function IndustryFooter() {
  return (
    <footer style={{ background: '#080808', borderTop: '1px solid rgba(201,162,39,0.15)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-md rotate-6 opacity-60" style={{ background: 'linear-gradient(135deg, #7A5C12, #C9A227)' }} />
              <div className="absolute inset-0 rounded-md -rotate-3" style={{ background: 'linear-gradient(135deg, #D4AF37, #7A5C12)' }} />
              <span className="absolute inset-0 flex items-center justify-center font-poppins font-black text-black text-xs">M</span>
            </div>
            <span className="font-poppins font-black text-warm-white text-sm">Metro<span className="text-gold">Cardz</span></span>
          </div>
          <address className="not-italic flex flex-wrap items-center gap-6 text-sm">
            <a href="tel:+919876543210" className="text-warm-grey hover:text-gold transition-colors">+91 98765 43210</a>
            <a href="mailto:hello@metrocardz.in" className="text-warm-grey hover:text-gold transition-colors">hello@metrocardz.in</a>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="text-warm-grey hover:text-gold transition-colors">WhatsApp</a>
          </address>
          <p className="text-warm-grey/40 text-xs">© {new Date().getFullYear()} MetroCardz</p>
        </div>
      </div>
    </footer>
  );
}
