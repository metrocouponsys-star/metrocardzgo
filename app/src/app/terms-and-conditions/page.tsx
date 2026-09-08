import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'Terms & Conditions | MetroCardz',
  description: 'Terms of Service, business usage guidelines, and B2B SaaS agreements for MetroCardz.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 max-w-4xl mx-auto px-6">
        <div className="space-y-8">
          <div className="border-b border-gold/20 pb-4">
            <h1 className="text-3xl md:text-4xl font-poppins font-black text-gold">Terms & Conditions</h1>
            <p className="text-warm-grey text-sm mt-2">Last updated: July 15, 2026</p>
          </div>

          <div className="space-y-6 text-warm-grey leading-relaxed text-sm md:text-base">
            <p>
              These Terms & Conditions govern your access to and use of the <strong>MetroCardz</strong> B2B SaaS platform and membership card printing services. By signing up or registering, you agree to these terms.
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">1. Account Registration & Usage</h2>
            <p>
              Merchants are responsible for maintaining the confidentiality of their login credentials. Any staff accounts added to the system are the sole responsibility of the merchant owner.
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">2. Service Scope</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>MetroCardz provides cloud-based loyalty portals, transaction tracking, WhatsApp/SMS triggers, and pre-printed physical PVC card products.</li>
              <li>Actual PVC cards are manufactured and shipped based on designs approved by the merchant. Turnaround times are estimates and not guarantees.</li>
            </ul>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">3. Billing & Payments</h2>
            <p>
              Subscription fees are billed in advance on a monthly or annual cycle. SMS and WhatsApp credit top-ups are billed based on consumption. All payments must be made in Indian Rupees (INR) through our authorized payment gateways.
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">4. Content Ownership</h2>
            <p>
              Merchants retain all intellectual property rights to their uploaded business logos, offer names, and branding. MetroCardz retains all rights to the underlying loyalty engine code, templates, and card pass designs.
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">5. Data Collection Bond & Processing Agreement</h2>
            <p>
              Under this legally binding agreement and in strict compliance with the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong> of India:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Lawful Consent Warranty:</strong> The Merchant (Data Fiduciary) warrants and covenants that it has obtained lawful and explicit consent from each customer/member prior to registering their mobile number, name, and demographic data on the platform.</li>
              <li><strong>Confidentiality & Non-Sale Bond:</strong> MetroCardz (Data Processor) legally binds and guarantees that it will <strong>never sell, broker, leak, or share</strong> merchant or customer personal data with any third party, competitor, or external advertiser.</li>
              <li><strong>Purpose Limitation:</strong> Member records (points, visits, offers, vouchers) are processed strictly and exclusively to fulfill the merchant's customer loyalty and rewards program.</li>
              <li><strong>Data Security:</strong> All data is safeguarded with TLS in transit and AES-256 storage standards within secure servers located in India.</li>
            </ul>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">6. Limitation of Liability</h2>
            <p>
              MetroCardz shall not be liable for any indirect, incidental, or consequential damages resulting from the loss of customer loyalty points, network outages, or gateway delivery failures.
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">7. Governing Law</h2>
            <p>
              These Terms and Data Agreements shall be governed by and construed in accordance with the laws of India. Any disputes arising out of these terms shall be subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
