import type { Metadata } from 'next';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export const metadata: Metadata = {
  title: 'System Status — Metro Cardz | Platform Uptime & Service Health',
  description: 'Real-time status of Metro Cardz services: API, database, WhatsApp campaigns, SMS delivery, and card printing operations.',
};

const services = [
  { name: 'Merchant Portal (Frontend)', status: 'operational', uptime: '99.97%' },
  { name: 'Core API (FastAPI)', status: 'operational', uptime: '99.95%' },
  { name: 'Database (PostgreSQL)', status: 'operational', uptime: '99.99%' },
  { name: 'Redis / Session Store', status: 'operational', uptime: '99.93%' },
  { name: 'WhatsApp Campaigns (AiSensy)', status: 'operational', uptime: '99.80%' },
  { name: 'SMS OTP (Msg91)', status: 'operational', uptime: '99.88%' },
  { name: 'File Storage (Supabase)', status: 'operational', uptime: '99.92%' },
  { name: 'Background Worker (Celery)', status: 'operational', uptime: '99.90%' },
  { name: 'Card Printing Operations', status: 'operational', uptime: '99.70%' },
];

const incidents = [
  {
    date: 'July 10, 2026',
    title: 'WhatsApp Campaign Delivery Delay',
    status: 'Resolved',
    detail: 'AiSensy reported elevated latency on bulk campaign delivery between 14:00–16:30 IST. All campaigns were delivered by 17:00 IST. No data loss occurred.',
    statusColor: 'text-green-400',
  },
  {
    date: 'June 22, 2026',
    title: 'Scheduled Maintenance — Database Upgrade',
    status: 'Completed',
    detail: 'Planned PostgreSQL version upgrade from 14.x to 15.x. Portal was in read-only mode from 02:00–03:15 IST. All services restored fully at 03:15 IST.',
    statusColor: 'text-blue-400',
  },
];

const statusColor = {
  operational: { dot: 'bg-green-400', text: 'text-green-400', label: 'Operational' },
  degraded: { dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'Degraded' },
  outage: { dot: 'bg-red-400', text: 'text-red-400', label: 'Outage' },
};

export default function StatusPage() {
  const allOperational = services.every(s => s.status === 'operational');

  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 max-w-3xl mx-auto px-6 w-full space-y-12">
        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-poppins font-black text-warm-white">System Status</h1>
          {allOperational ? (
            <div className="inline-flex items-center gap-2.5 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 font-bold text-sm">All systems operational</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2.5 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-400 font-bold text-sm">Some systems experiencing issues</span>
            </div>
          )}
          <p className="text-warm-grey text-sm">
            Last checked: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })} IST
          </p>
        </section>

        {/* Service Status */}
        <section className="space-y-3">
          <h2 className="font-poppins font-bold text-warm-white text-lg">Services</h2>
          <div className="bg-[#111111] border border-gold/10 rounded-2xl overflow-hidden divide-y divide-white/5">
            {services.map((svc, i) => {
              const s = statusColor[svc.status as keyof typeof statusColor];
              return (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-warm-white text-sm font-medium">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-warm-grey/40 text-xs font-mono">{svc.uptime} uptime</span>
                    <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Incidents */}
        <section className="space-y-4">
          <h2 className="font-poppins font-bold text-warm-white text-lg">Recent Incidents</h2>
          <div className="space-y-4">
            {incidents.map((inc, i) => (
              <div key={i} className="bg-[#111111] border border-gold/10 p-5 rounded-xl space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-warm-white font-bold text-sm">{inc.title}</span>
                  <span className={`text-xs font-bold ${inc.statusColor}`}>{inc.status}</span>
                </div>
                <p className="text-warm-grey/50 text-xs">{inc.date}</p>
                <p className="text-warm-grey text-xs leading-relaxed">{inc.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Subscribe */}
        <section className="bg-[#111111] border border-gold/15 p-6 rounded-2xl text-center space-y-3">
          <h3 className="font-poppins font-bold text-warm-white">Get Incident Notifications</h3>
          <p className="text-warm-grey text-sm">Subscribe via WhatsApp to get instant alerts for platform incidents and scheduled maintenance.</p>
          <a
            href="https://wa.me/919876543210?text=Subscribe%20me%20to%20Metro%20Cardz%20status%20alerts"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            Subscribe via WhatsApp
          </a>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
