import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | MetroCardz',
  description: 'Learn about our subscription cancellation, refund window, and physical card printing policies.',
};

export default function RefundPolicyPage() {
  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 max-w-4xl mx-auto px-6">
        <div className="space-y-8">
          <div className="border-b border-gold/20 pb-4">
            <h1 className="text-3xl md:text-4xl font-poppins font-black text-gold">Refund & Cancellation Policy</h1>
            <p className="text-warm-grey text-sm mt-2">Last updated: July 15, 2026</p>
          </div>

          <div className="space-y-6 text-warm-grey leading-relaxed text-sm md:text-base">
            <p>
              Thank you for subscribing to <strong>MetroCardz</strong>. Please read our refund and cancellation policies carefully:
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">1. Subscription Cancellations</h2>
            <p>
              You can cancel your B2B SaaS subscription at any time directly through the Billing tab in your merchant settings. Upon cancellation, your portal will remain active until the end of the current paid billing cycle. No further recurring charges will be made.
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">2. Refund Window</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>SaaS Subscription:</strong> We offer a 7-day refund window for first-time subscriptions. If you are not satisfied with the portal within the first 7 days, contact support to request a full refund. Refunds will be processed back to the original payment method within 5–7 business days.</li>
              <li><strong>Physical Card Orders:</strong> Because physical membership PVC cards are custom-printed with your business branding, logo, and unique QR codes, once the card batch goes into production, these orders are **non-refundable** and cannot be cancelled.</li>
            </ul>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">3. Communication Credit Top-ups</h2>
            <p>
              Payments for SMS, WhatsApp notifications, or email credits are non-refundable. They do not expire and will remain in your account until consumed.
            </p>

            <h2 className="text-xl font-bold font-poppins text-warm-white mt-8 border-l-2 border-gold pl-3">4. Custom Mockup Designs</h2>
            <p>
              Initial mockup designs provided to merchants are free. No refund terms apply since no payment is taken for mockups before card production agreements are signed.
            </p>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
