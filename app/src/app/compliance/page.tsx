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
              desc: 'Login, OTP, and public endpoints are protected by IP-level rate limiting (in-memory sliding window). Failed logins are limited to 5/minute. OTP requests are limited to 3/minute per phone number.',
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
          <h2 className="font-poppins font-bold text-gold text-lg">Data Residency & Infrastructure Security</h2>
          <p className="text-warm-grey text-sm leading-relaxed">
            Metro Cardz databases are hosted in managed Tier-4 data centers located in India (Asia-South region). Member demographic data does not leave India&apos;s borders during normal platform operation. Multi-tenant database queries are strictly isolated per merchant at the API boundary, satisfying Section 43A of the Information Technology Act, 2000.
          </p>
        </section>

        {/* DPDP Section 8(6) Data Breach Protocol */}
        <section className="bg-[#111111] border border-gold/15 p-7 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gold text-[22px]">notification_important</span>
            <h2 className="font-poppins font-bold text-gold text-lg">Data Breach Response Protocol (DPDP Act Sec 8(6))</h2>
          </div>
          <p className="text-warm-grey text-sm leading-relaxed">
            Metro Cardz maintains a documented 24-to-72 hour Incident Response Plan (IRP) in full alignment with India&apos;s Digital Personal Data Protection Act, 2023:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-black/40 border border-gold/10 rounded-xl space-y-2">
              <span className="text-xs font-mono font-bold text-gold uppercase tracking-wider block">Hours 0 – 24</span>
              <h4 className="font-bold text-warm-white text-sm">Containment & Forensics</h4>
              <p className="text-warm-grey text-xs">Immediate token revocation, secret rotation, and server firewall IP isolation to neutralize exposure.</p>
            </div>
            <div className="p-4 bg-black/40 border border-gold/10 rounded-xl space-y-2">
              <span className="text-xs font-mono font-bold text-gold uppercase tracking-wider block">Hours 24 – 48</span>
              <h4 className="font-bold text-warm-white text-sm">Data Fiduciary Briefing</h4>
              <p className="text-warm-grey text-xs">Direct escalation and formal briefing to affected store merchants (Data Fiduciaries) regarding affected record scopes.</p>
            </div>
            <div className="p-4 bg-black/40 border border-gold/10 rounded-xl space-y-2">
              <span className="text-xs font-mono font-bold text-gold uppercase tracking-wider block">Hours 48 – 72</span>
              <h4 className="font-bold text-warm-white text-sm">DPBI Statutory Filing</h4>
              <p className="text-warm-grey text-xs">Statutory notification filed with the Data Protection Board of India (DPBI) and affected data principals with remediation measures.</p>
            </div>
          </div>
        </section>

        {/* Merchant Data Processing Agreement (DPA) */}
        <section className="bg-[#111111] border border-gold/15 p-7 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gold text-[22px]">gavel</span>
            <h2 className="font-poppins font-bold text-gold text-lg">Merchant Data Processing Agreement & Confidentiality Bond</h2>
          </div>
          <p className="text-warm-grey text-sm leading-relaxed">
            Every merchant operating on Metro Cardz executes a legally binding Data Processing Agreement (DPA) under IT Act Sections 43A, 72, and 72A. Metro Cardz covenants under penalty of law:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-warm-grey text-xs leading-relaxed">
            <li><strong>Zero Third-Party Monetization:</strong> Member phone numbers and purchase records are NEVER shared, rented, or cross-marketed to competitors or advertising brokers.</li>
            <li><strong>Data Portability:</strong> Merchants and members can download machine-readable JSON data exports at any time (DPDP Section 11).</li>
            <li><strong>Right to Erasure:</strong> Member personal identifiers are scrubbed and anonymised upon demand (DPDP Section 13).</li>
            <li><strong>Storage Limitation:</strong> Inactive member profiles exceeding 24 months are subject to automated storage limitation archiving (DPDP Section 8(7)).</li>
          </ul>
        </section>

        {/* Data Grievance Officer */}
        <section className="bg-[#111111] border border-gold/15 p-7 rounded-2xl space-y-4">
          <h2 className="font-poppins font-bold text-gold text-lg">Data Protection & Grievance Officer</h2>
          <p className="text-warm-grey text-sm leading-relaxed">
            In accordance with Section 8(9) of the Digital Personal Data Protection Act, 2023, data principals and merchant partners may direct any data privacy inquiries, consent revocations, or statutory grievance notices to:
          </p>
          <div className="p-4 bg-black/40 border border-gold/15 rounded-xl space-y-1 text-xs">
            <p className="font-bold text-warm-white">Data Protection Grievance Officer</p>
            <p className="text-warm-grey">Metro Cardz Technologies · Legal & Compliance Division</p>
            <p className="text-warm-grey">Email: <a href="mailto:privacy@metrocardz.in" className="text-gold hover:underline">privacy@metrocardz.in</a> | Response window: &le; 30 business days</p>
          </div>
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
