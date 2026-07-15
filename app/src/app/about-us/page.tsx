import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'About Us — 23 Years of Trust | MetroCardz',
  description: 'Our legacy from Metro Couponz to Metro Cardz — 23 years of customer engagement, coupon books, and digital loyalty cards in Mumbai and Pune.',
};

export default function AboutUsPage() {
  const marketingLocations = [
    'Central Railway Stations', 'Western Railway Stations', 'CIDCO Railway Stations',
    'Andheri Metro Stations', 'Major Petrol Pumps', 'Shopping Areas',
    'Residential Societies', 'Corporate Parks', 'Educational Institutions',
    'Public Events', 'Exhibitions', 'Festivals'
  ];

  const corporateClients = [
    'Daikin', 'LG Electronics', 'Bosch', 'Samsung', 'Hyundai', 'Millennium Toyota',
    'Modi Hyundai', 'Vijay Sales', 'Star Health Insurance', 'LIC', 'Hathway',
    'DEN Networks', 'TOP 10 Mobiles', 'Kala Kendra', 'Mahesh Tutorials',
    'Arihant Builders', 'Regency Group', 'Puranik Builders', 'Konnak Builders',
    'Emperia Builders', 'L&T', 'Mahindra Tech', 'Motilal Oswal', 'WeWork', 'Yale'
  ];

  const foodBrands = [
    'KFC', "Domino's Pizza", 'Pizza Hut', 'Faasos', 'Barbeque Nation', "McDonald's",
    'Hotel Ambassador', 'Rude Lounge', 'Angrezi Dhaba', 'Farm House', 'MM Mithaiwala',
    'Dadar Darbar', 'Goa Portugues', 'Malwan Tadka'
  ];

  const entertainmentBrands = [
    'EsselWorld', 'Water Kingdom', 'Imagicaa', 'Wet N Joy', 'Kidzania',
    'Great Escape Water Park', 'Timezone', 'Broadway Cinemas'
  ];

  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 max-w-6xl mx-auto px-6 w-full space-y-16">
        
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-gold text-xs font-bold uppercase tracking-widest bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
            A Digital India Initiative by Metro Coupon
          </span>
          <h1 className="text-4xl md:text-6xl font-poppins font-black text-warm-white tracking-tight mt-3">
            Metro Couponz to <span className="text-gold">Metro Cardz</span>
          </h1>
          <p className="text-warm-grey text-base md:text-lg font-medium">
            23 Years of Trust • Relationships • Experience • Innovation
          </p>
        </section>

        {/* Greetings & Founder's Statement */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-t border-b border-gold/10 py-10">
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-2">
            <div className="w-20 h-20 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
              <span className="material-symbols-outlined text-gold text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <h2 className="text-xl font-bold font-poppins text-warm-white mt-3">Oliver</h2>
            <p className="text-gold text-xs uppercase tracking-widest">Founder, Metro Couponz & Cardz</p>
          </div>
          <div className="lg:col-span-8 text-warm-grey leading-relaxed text-sm md:text-base space-y-4">
            <p className="font-semibold text-warm-white text-lg">
              Greetings.
            </p>
            <p>
              After 23 successful years of building Metro Couponz as a trusted offline coupon and membership brand, we are now ready to expand through Metro Cardz, our future-ready digital platform. This proposal invites you to join us as a Strategic Joint Partner cum Investor by merging with Metro Couponz & Metro Cardz to build the next phase of growth together.
            </p>
            <p>
              For over 23 years, we have been dedicated to creating value for consumers, merchants, corporates, and leading brands for Fun, Food & Entertainment across Mumbai and Pune through innovative promotional campaigns, membership programmes, coupon booklets, and customer engagement solutions.
            </p>
            <p>
              Today, after successfully building a respected offline business, we are ready to transform our proven model into a powerful digital platform through Metro Cardz.
            </p>
          </div>
        </section>

        {/* 23-Year Legacy & Corporate Office */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold font-poppins text-gold">Our 23-Year Legacy</h3>
            <div className="text-warm-grey text-sm md:text-base space-y-3">
              <p>
                Metro Couponz was established with one simple objective—to bring together the best brands under one platform and provide genuine savings to consumers while generating measurable business for merchants.
              </p>
              <p>
                Long before digital marketplaces became popular, Metro Couponz had already created one of Mumbai's largest offline promotional networks through premium Membership Cards & printed coupon booklets, membership programmes, and cross-promotional campaigns.
              </p>
              <p>
                Over the past 23 years, we have invested not only financial resources but also our time, relationships, market knowledge, and reputation in building a trusted brand.
              </p>
            </div>
          </div>
          
          <div className="card bg-[#141414] border border-gold/15 p-6 rounded-2xl space-y-4">
            <span className="text-gold text-xs uppercase tracking-widest font-bold">Corporate Headquarters</span>
            <div className="space-y-4 text-warm-grey text-sm">
              <div>
                <span className="text-warm-white/40 block text-xs">Registered Address</span>
                <span className="text-warm-white font-bold block mt-1">
                  201, Damji Samji Trade Centre, Opp. Vidyavihar Railway Station (West), Mumbai – 400086
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-warm-white/40 block text-xs">GST Number</span>
                  <span className="text-warm-white font-mono font-bold block mt-0.5">27BIQPS9379R1ZK</span>
                </div>
                <div>
                  <span className="text-warm-white/40 block text-xs">Operational Area</span>
                  <span className="text-warm-white font-bold block mt-0.5">Mumbai & Pune</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Proven Results Stats */}
        <section className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold font-poppins text-warm-white">Our Proven Results</h3>
            <p className="text-warm-grey text-sm mt-1">Measurable outcomes delivered across decades of hard work.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-md">
            {[
              { val: '32%', desc: 'Certified Coupon Redemption', sub: 'EsselWorld & Water Kingdom' },
              { val: '38K+', desc: 'Customer Visits Generated', sub: 'Imagicaa Campaigns' },
              { val: '₹1.80Cr', desc: 'Royalty Revenue Accounted', sub: 'Promotional Campaigns' },
              { val: '24 Yrs', desc: 'Serving Mumbaikars', sub: 'Promotional Activities' },
              { val: '100s', desc: 'Trusted Brand Ties', sub: 'Merchants & Leading Chains' },
            ].map((stat, i) => (
              <div key={i} className="card bg-[#141414] p-md border border-gold/15 text-center flex flex-col justify-center space-y-1 hover:shadow-elevated transition-shadow duration-200">
                <span className="text-3xl font-poppins font-black text-gold">{stat.val}</span>
                <span className="text-warm-white font-bold text-xs block">{stat.desc}</span>
                <span className="text-warm-grey/50 text-[10px] block">{stat.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Building a Brand through Hard Work */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold font-poppins text-gold">Building a Brand Through Hard Work</h3>
            <p className="text-warm-grey text-sm mt-1">
              Our success was never achieved through advertising alone. It was built by physically reaching customers every single day with a dedicated team of over 75 professionals.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-md">
            {marketingLocations.map((loc, idx) => (
              <div key={idx} className="bg-[#121212] p-4 rounded-xl border border-outline-variant/20 flex items-center gap-2.5">
                <span className="text-gold text-sm">✦</span>
                <span className="text-sm font-semibold text-warm-white">{loc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Corporate Clients Section */}
        <section className="space-y-6 border-t border-gold/10 pt-10">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold font-poppins text-warm-white">Trusted Corporate Collaborators</h3>
            <p className="text-warm-grey text-sm mt-1">
              Metro Couponz produced customized Bulk Corporate Coupon Booklets containing BUY ONE GET ONE free privileges distributed to employees and associates of leading organizations.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {corporateClients.map((client, idx) => (
              <span key={idx} className="bg-gold/5 border border-gold/10 text-gold text-xs md:text-sm font-medium px-3.5 py-1.5 rounded-full">
                {client}
              </span>
            ))}
          </div>
        </section>

        {/* Brand Promoted Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-gold/10 pt-10">
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-poppins text-gold flex items-center gap-2">
              <span className="material-symbols-outlined text-gold">restaurant</span>
              Food, Pubs & Restaurant Partners
            </h3>
            <p className="text-warm-grey text-sm">
              Providing exclusive BUY ONE GET ONE Free offers, complimentary mocktails, mojitos, pub entries, garlic bread, and more.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {foodBrands.map((brand, idx) => (
                <span key={idx} className="bg-surface-container text-on-surface-variant text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {brand}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-poppins text-gold flex items-center gap-2">
              <span className="material-symbols-outlined text-gold">attractions</span>
              Entertainment & Family Attractions
            </h3>
            <p className="text-warm-grey text-sm">
              Driving mass-audience footfalls, loyalty visits, and promotional campaigns at leading amusement parks.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {entertainmentBrands.map((brand, idx) => (
                <span key={idx} className="bg-surface-container text-on-surface-variant text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Next Chapter: Metro Cardz */}
        <section className="bg-gradient-to-br from-primary/10 to-gold/10 border border-gold/20 p-8 rounded-3xl space-y-6">
          <div className="max-w-3xl space-y-3">
            <span className="text-gold text-xs uppercase tracking-widest font-black">Digital Transformation</span>
            <h3 className="text-2xl md:text-4xl font-bold font-poppins text-warm-white">The Next Chapter — Metro Cardz</h3>
            <p className="text-warm-grey text-sm md:text-base leading-relaxed">
              Consumer behavior has changed dramatically. Customers have moved from traditional offline printed coupon books to instant digital experiences on their smartphones.
            </p>
            <p className="text-warm-grey text-sm md:text-base leading-relaxed">
              Recognizing this shift, we spent the last four years researching digital platforms like Groupon, Nearbuy, Zomato, EazyDiner, and Dineout, and analyzing consumer dynamics. The result is a scalable, future-ready digital ecosystem—Metro Cardz—designed to help merchants attract, engage, reward, and retain customers more effectively than ever before.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-3">
            <a href="/login" className="btn-primary">
              Access Portal
            </a>
            <a href="/contact" className="btn-outline">
              Join as Partner / Investor
            </a>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}
