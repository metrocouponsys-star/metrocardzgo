'use client';

import { useState, useCallback } from 'react';
import { LandingNavbar } from '@/views/landing/components/LandingNavbar';
import { LandingFooter } from '@/views/landing/components/LandingFooter';

export default function ROICalculatorPage() {
  const [newCustomers, setNewCustomers] = useState(30);
  const [avgSpend, setAvgSpend] = useState(800);
  const [repeatRate, setRepeatRate] = useState(40);
  const [retentionLift, setRetentionLift] = useState(25);

  const monthlyNewRevenue = newCustomers * avgSpend;
  const repeatCustomers = Math.round(newCustomers * (repeatRate / 100));
  const additionalVisits = Math.round(repeatCustomers * (retentionLift / 100));
  const additionalRevenue = additionalVisits * avgSpend;
  const totalMonthly = monthlyNewRevenue + additionalRevenue;
  const totalAnnual = totalMonthly * 12;
  const roi = Math.round(((additionalRevenue * 12) / 3600) * 100); // assume ₹3600/yr plan

  return (
    <div className="landing-root bg-[#0d0d0d] min-h-screen text-warm-white flex flex-col justify-between">
      <LandingNavbar />

      <main className="pt-24 pb-16 flex-1 max-w-6xl mx-auto px-6 w-full">
        {/* Hero */}
        <section className="text-center space-y-4 mb-16">
          <span className="text-gold text-xs font-bold uppercase tracking-widest bg-gold/10 px-3 py-1.5 rounded-full border border-gold/20">
            ROI Calculator
          </span>
          <h1 className="text-4xl md:text-6xl font-poppins font-black tracking-tight">
            Calculate Your <span className="text-gold">Revenue Lift</span>
          </h1>
          <p className="text-warm-grey text-base md:text-lg max-w-2xl mx-auto">
            See exactly how much additional revenue a loyalty programme adds to your business — before you spend a rupee.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sliders */}
          <div className="space-y-8">
            <div className="bg-[#111111] border border-gold/10 p-6 rounded-2xl space-y-6">
              <h2 className="font-poppins font-bold text-warm-white text-lg">Your Business Profile</h2>

              {/* New Customers/Month */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-warm-grey text-sm font-medium">New customers / month</label>
                  <span className="text-gold font-poppins font-black text-lg">{newCustomers}</span>
                </div>
                <input
                  type="range" min={5} max={500} step={5}
                  value={newCustomers}
                  onChange={e => setNewCustomers(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #C9A227 0%, #C9A227 ${(newCustomers - 5) / (500 - 5) * 100}%, #2a2a2a ${(newCustomers - 5) / (500 - 5) * 100}%, #2a2a2a 100%)` }}
                />
                <div className="flex justify-between text-warm-grey/40 text-xs"><span>5</span><span>500</span></div>
              </div>

              {/* Avg Spend */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-warm-grey text-sm font-medium">Average customer spend (₹)</label>
                  <span className="text-gold font-poppins font-black text-lg">₹{avgSpend.toLocaleString()}</span>
                </div>
                <input
                  type="range" min={100} max={10000} step={100}
                  value={avgSpend}
                  onChange={e => setAvgSpend(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #C9A227 0%, #C9A227 ${(avgSpend - 100) / (10000 - 100) * 100}%, #2a2a2a ${(avgSpend - 100) / (10000 - 100) * 100}%, #2a2a2a 100%)` }}
                />
                <div className="flex justify-between text-warm-grey/40 text-xs"><span>₹100</span><span>₹10,000</span></div>
              </div>

              {/* Repeat Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-warm-grey text-sm font-medium">Estimated repeat customer rate (%)</label>
                  <span className="text-gold font-poppins font-black text-lg">{repeatRate}%</span>
                </div>
                <input
                  type="range" min={5} max={80} step={5}
                  value={repeatRate}
                  onChange={e => setRepeatRate(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #C9A227 0%, #C9A227 ${(repeatRate - 5) / (80 - 5) * 100}%, #2a2a2a ${(repeatRate - 5) / (80 - 5) * 100}%, #2a2a2a 100%)` }}
                />
                <div className="flex justify-between text-warm-grey/40 text-xs"><span>5%</span><span>80%</span></div>
              </div>

              {/* Retention Lift */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-warm-grey text-sm font-medium">Expected retention lift with loyalty (%)</label>
                  <span className="text-gold font-poppins font-black text-lg">+{retentionLift}%</span>
                </div>
                <input
                  type="range" min={5} max={60} step={5}
                  value={retentionLift}
                  onChange={e => setRetentionLift(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #C9A227 0%, #C9A227 ${(retentionLift - 5) / (60 - 5) * 100}%, #2a2a2a ${(retentionLift - 5) / (60 - 5) * 100}%, #2a2a2a 100%)` }}
                />
                <div className="flex justify-between text-warm-grey/40 text-xs"><span>+5%</span><span>+60%</span></div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-5">
            {/* Key Result */}
            <div className="bg-gradient-to-br from-gold/15 to-gold/5 border border-gold/30 p-6 rounded-2xl text-center space-y-2">
              <p className="text-gold text-xs uppercase tracking-widest font-bold">Projected Additional Revenue</p>
              <p className="text-5xl font-poppins font-black text-warm-white">₹{additionalRevenue.toLocaleString()}</p>
              <p className="text-warm-grey text-sm">per month from loyalty-driven repeat visits</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111111] border border-gold/10 p-4 rounded-xl text-center space-y-1">
                <p className="text-gold text-xs uppercase tracking-widest">Monthly Total</p>
                <p className="text-2xl font-poppins font-black text-warm-white">₹{totalMonthly.toLocaleString()}</p>
                <p className="text-warm-grey/50 text-xs">new + repeat revenue</p>
              </div>
              <div className="bg-[#111111] border border-gold/10 p-4 rounded-xl text-center space-y-1">
                <p className="text-gold text-xs uppercase tracking-widest">Annual Total</p>
                <p className="text-2xl font-poppins font-black text-warm-white">₹{(totalAnnual / 100000).toFixed(1)}L</p>
                <p className="text-warm-grey/50 text-xs">projected revenue</p>
              </div>
              <div className="bg-[#111111] border border-gold/10 p-4 rounded-xl text-center space-y-1">
                <p className="text-gold text-xs uppercase tracking-widest">Repeat Customers</p>
                <p className="text-2xl font-poppins font-black text-warm-white">{repeatCustomers}</p>
                <p className="text-warm-grey/50 text-xs">per month (estimated)</p>
              </div>
              <div className="bg-[#111111] border border-gold/10 p-4 rounded-xl text-center space-y-1">
                <p className="text-gold text-xs uppercase tracking-widest">ROI</p>
                <p className="text-2xl font-poppins font-black text-warm-white">{roi}x</p>
                <p className="text-warm-grey/50 text-xs">on Metro Cardz annual plan</p>
              </div>
            </div>

            <div className="bg-[#111111] border border-gold/10 p-5 rounded-xl space-y-3">
              <p className="text-warm-grey text-xs leading-relaxed">
                <span className="text-gold font-bold">Assumption:</span> Retention lift figures are based on industry averages (Harvard Business Review: a 5% increase in customer retention produces 25% to 95% more profit). Your actual results will vary by category and execution.
              </p>
              <a href="/login" className="btn-primary w-full text-center block">
                Start Free — Verify Your Own Numbers
              </a>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
