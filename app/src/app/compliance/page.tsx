import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'Compliance & Security — Metro Cardz | DPDP Act, Data Protection, India',
  description: 'Metro Cardz compliance overview: DPDP Act 2023, data encryption, merchant data controllership, PCI-DSS alignment, and security practices for membership data.',
};

export default function CompliancePage() {
  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 max-w-4xl mx-auto px-6 w-full space-y-14">
        {/* Hero */}
        <section className="text-center space-y-3">
          <span className="text-gold text-xs font-bold uppercase tracking-widest bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
            Security & Compliance
          </span>
          <h1 className="text-4xl md:text-5xl font-poppins font-black text-warm-white mt-3">
            Built for <span className="text-gold">Trust & Compliance</span>
          </h1>
          <p className="text-warm-grey text-base max-w-2xl mx-auto">
            Metro Cardz is designed with India's data protection regulations in mind. We take security seriously so your members' data stays private and your business stays compliant.
          </p>
        </section>

        {/* Compliance Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: 'policy',
              title: 'DPDP Act 2023 Aligned',
              desc: 'Our data processing practices are designed to align with India\'s Digital Personal Data Protection Act 2023. Members\' names, phone numbers, and DOBs are collected only for the stated purpose of running the merchant\'s loyalty programme.',
            },
            {
              icon: 'lock',
              title: 'Encryption at Rest & in Transit',
              desc: 'All data is encrypted in transit using TLS 1.2+. Database fields containing PII (phone numbers, names) are stored in AES-256 encrypted columns in a managed cloud database hosted in India.',
            },
            {
              icon: 'storefront',
              title: 'Merchant as Data Controller',
              desc: 'Each merchant is the data controller for their own members. Metro Cardz acts as the data processor. Merchants can export or delete their member data at any time from the Settings panel.',
            },
            {
              icon: 'verified_user',
              title: 'JWT-Based Authentication',
              desc: 'All API endpoints require signed JWT tokens with 15-minute access expiry and 30-day refresh tokens. Tokens are validated server-side on every request — never stored in cookies.',
            },
            {
              icon: 'security',
              title: 'Rate Limiting & Abuse Prevention',
              desc: 'Login, OTP, and public endpoints are protected by IP-level rate limiting via Redis. Failed logins are limited to 5/minute. OTP requests are limited to 3/minute per phone number.',
            },
            {
              icon: 'gavel',
              title: 'Security Headers & CORS',
              desc: 'All API responses include security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and HSTS in production. CORS is explicitly scoped to approved frontend origins only.',
            },
            {
              icon: 'manage_accounts',
              title: 'Role-Based Access Control',
              desc: 'Platform enforces three roles: Super Admin, Merchant Owner, and Staff. Staff can only see their own merchant\'s data. Tenants are isolated at the database query level — not just the application level.',
            },
            {
              icon: 'monitor_heart',
              title: 'Error Monitoring (Sentry)',
              desc: 'Application exceptions are monitored via Sentry with PII scrubbing enabled. No personal data is sent to error reporting services. Errors are logged by request path and type only.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-[#111111] border border-gold/10 p-6 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-gold text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <h3 className="font-poppins font-bold text-warm-white text-sm">{item.title}</h3>
              </div>
              <p className="text-warm-grey text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* Data Residency */}
        <section className="bg-[#111111] border border-gold/15 p-7 rounded-2xl space-y-4">
          <h2 className="font-poppins font-bold text-gold text-lg">Data Residency</h2>
          <p className="text-warm-grey text-sm leading-relaxed">
            Metro Cardz databases are hosted on managed PostgreSQL infrastructure located in India (Asia-South region). Member data does not leave India's borders during normal platform operation. Third-party integrations (WhatsApp via AiSensy, SMS via Msg91) process only the minimum required data (phone number + message text) through India-based API endpoints.
          </p>
        </section>

        {/* Responsible Disclosure */}
        <section className="bg-[#111111] border border-gold/15 p-7 rounded-2xl space-y-4">
          <h2 className="font-poppins font-bold text-gold text-lg">Responsible Disclosure</h2>
          <p className="text-warm-grey text-sm leading-relaxed">
            If you discover a security vulnerability in Metro Cardz, please report it responsibly to <a href="mailto:security@metrocardz.in" className="text-gold hover:underline">security@metrocardz.in</a>. We will acknowledge your report within 48 hours and work to address valid vulnerabilities within 30 days. We do not pursue legal action against good-faith security researchers.
          </p>
        </section>

        {/* Legal Links */}
        <section className="flex flex-wrap gap-4 justify-center">
          {[
            { label: 'Privacy Policy', href: '/privacy-policy' },
            { label: 'Terms & Conditions', href: '/terms-and-conditions' },
            { label: 'Refund Policy', href: '/refund-policy' },
            { label: 'Contact Us', href: '/contact' },
          ].map(link => (
            <a key={link.href} href={link.href} className="btn-outline text-sm px-4 py-2">
              {link.label}
            </a>
          ))}
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
