import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'Privacy Policy | MetroCardz',
  description: 'Learn about our data collection, security, and DPDP Act 2023 compliance guidelines.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 max-w-4xl mx-auto px-6">
        <div className="space-y-8">
          <div className="border-b border-gold/20 pb-4">
            <h1 className="text-3xl md:text-4xl font-poppins font-black text-gold">Privacy Policy</h1>
            <p className="text-warm-grey text-sm mt-2">Last updated: July 15, 2026</p>
          </div>

          <div className="space-y-6 text-warm-grey leading-relaxed text-sm md:text-base">
            <p>
              Welcome to <strong>MetroCardz</strong>. We value your trust, and we are committed to protecting the personal data of our merchants and their loyalty program customers.
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">1. Information We Collect</h2>
            <p>
              To run the custom loyalty programs, we collect and process information on behalf of merchants:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Merchant Profile:</strong> Business name, address, category, WhatsApp number, and representative name.</li>
              <li><strong>Customer Profiles:</strong> Customer names, mobile numbers, dates of birth (for birthday reminders), and anniversary dates (optional).</li>
              <li><strong>Loyalty Data:</strong> Stamp counts, points balances, transaction histories, and redemption logs.</li>
            </ul>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">2. How We Use Your Data</h2>
            <p>
              We process data solely to provide and improve the MetroCardz services, including:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Validating and recording customer loyalty point accruals and redemptions.</li>
              <li>Automating birthday, anniversary, and membership renewal notifications via SMS/WhatsApp as configured by the merchant.</li>
              <li>Providing analytics, charts, and report exports inside the merchant dashboard.</li>
            </ul>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">3. DPDP Act 2023 Compliance</h2>
            <p>
              In alignment with India's <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Role:</strong> MetroCardz operates as a Data Processor. The respective merchant is the Data Fiduciary responsible for obtaining proper customer consent.</li>
              <li><strong>Rights:</strong> End-customers can request access to, correction of, or erasure of their loyalty records by contacting their respective merchant.</li>
              <li><strong>Retention:</strong> We store customer data only as long as necessary to fulfill the loyalty program obligations or until requested otherwise.</li>
            </ul>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">4. Security Measures</h2>
            <p>
              All customer personal data is transmitted securely via TLS encryption and stored in secure cloud environments within local data centers in India. No customer phone numbers or PII are sold or shared with third-party advertising companies.
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">5. Contact Information</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our data grievance officer at <a href="mailto:privacy@metrocardz.in" className="text-gold hover:underline">privacy@metrocardz.in</a>.
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
