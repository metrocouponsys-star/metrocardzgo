import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'Company Information | MetroCardz',
  description: 'Registered business details, corporate registration, GST info, and address for MetroCardz.',
};

export default function CompanyInfoPage() {
  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 max-w-4xl mx-auto px-6">
        <div className="space-y-8">
          <div className="border-b border-gold/20 pb-4">
            <h1 className="text-3xl md:text-4xl font-poppins font-black text-gold">Company Information</h1>
            <p className="text-warm-grey text-sm mt-2">Institutional trust and corporate registration details.</p>
          </div>

          <div className="space-y-6 text-warm-grey leading-relaxed text-sm md:text-base">
            <p>
              MetroCardz is operated by its parent corporate entity registered in India.
            </p>

            <div className="card bg-[#141414] border border-gold/15 p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-bold font-poppins text-warm-white">Corporate Identity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base">
                <div>
                  <span className="text-warm-white/50 text-xs uppercase tracking-widest block">Registered Entity Name</span>
                  <span className="font-bold text-warm-white">MetroCardz Technology Solutions Private Limited</span>
                </div>
                <div>
                  <span className="text-warm-white/50 text-xs uppercase tracking-widest block">Corporate Identification Number (CIN)</span>
                  <span className="font-bold text-warm-white font-mono">U72900KA2026PTC184766</span>
                </div>
                <div>
                  <span className="text-warm-white/50 text-xs uppercase tracking-widest block">Registered Business Address</span>
                  <span className="font-bold text-warm-white">12, MG Road, Ashok Nagar, Bengaluru, Karnataka 560001</span>
                </div>
                <div>
                  <span className="text-warm-white/50 text-xs uppercase tracking-widest block">Official Support Contact</span>
                  <span className="font-bold text-warm-white">hello@metrocardz.in</span>
                </div>
              </div>
            </div>

            <p>
              For corporate partnerships, vendor compliance queries, or business verification requests, please reach out to our corporate relations office at the registered address above.
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
