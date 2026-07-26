/**
 * /check-membership
 * Ultra-Premium Digital Member Pass & Balance Enquiry Portal
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PublicMemberView } from '../../types';
import * as api from '../../api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';

const OFFER_ICONS: Record<string, string> = {
  percent_off: 'percent',
  free_service: 'spa',
  wallet_points: 'account_balance_wallet',
  referral: 'people',
  birthday: 'cake',
  points_redemption: 'stars',
  visit_milestone: 'workspace_premium',
};

function useCountUp(target: number, duration = 1200, enabled = true) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    if (!enabled || target === 0) { setCurrent(0); return; }
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(ease * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);
  return current;
}

function LookupSkeleton() {
  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 animate-pulse">
        <div className="h-44 rounded-3xl bg-white/5 border border-white/10" />
        <div className="h-28 rounded-2xl bg-white/5 border border-white/10" />
        <div className="h-36 rounded-2xl bg-white/5 border border-white/10" />
      </div>
    </div>
  );
}

function LookupForm({
  onResult,
}: {
  onResult: (data: PublicMemberView) => void;
}) {
  const [identifier, setIdentifier] = useState('');
  const [last4, setLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimId = identifier.trim();
    const trimLast4 = last4.trim();

    if (!trimId) {
      setError('Please enter your membership number or mobile number.');
      return;
    }
    if (!/^\d{4}$/.test(trimLast4)) {
      setError('Please enter exactly 4 digits of your registered mobile number.');
      return;
    }

    setLoading(true);
    try {
      const view = await api.lookupMembership(trimId, trimLast4);
      onResult(view);
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (msg.toLowerCase().includes('too many')) {
        setError('Too many attempts. Please try again in an hour.');
      } else {
        setError('No matching membership found. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Dynamic ambient background glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">
        
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-transparent p-0.5 mx-auto shadow-2xl backdrop-blur-xl border border-amber-500/30">
            <div className="w-full h-full rounded-[22px] bg-[#0F1420] flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-400 text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                badge
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-200/90 bg-clip-text text-transparent">
            Check Your Membership
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            Instant balance enquiry & digital pass view — no login required.
          </p>
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Live Customer Portal
          </span>
        </div>

        {/* Premium Form Box */}
        <div className="bg-[#0F1420]/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/10 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            <div className="space-y-2">
              <label htmlFor="cm-identifier" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-400">card_membership</span>
                Membership Code or Mobile Number
              </label>
              <div className="relative">
                <input
                  id="cm-identifier"
                  type="text"
                  className="w-full bg-[#161B28] border border-white/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-2xl px-4 py-3.5 text-white placeholder:text-slate-500 text-sm font-medium transition-all outline-none"
                  placeholder="e.g. #MC0004 or 9987379000"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoComplete="off"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="cm-last4" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-400">lock</span>
                  Last 4 Digits of Registered Phone
                </span>
                <span className="text-[10px] text-slate-400 font-normal uppercase">Security Gate</span>
              </label>
              <input
                id="cm-last4"
                type="tel"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                className="w-full bg-[#161B28] border border-white/15 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-2xl px-4 py-3.5 text-center font-mono text-xl tracking-[0.4em] font-bold text-amber-300 placeholder:text-slate-600 transition-all outline-none"
                placeholder="0 0 0 0"
                value={last4}
                onChange={e => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                autoComplete="off"
                disabled={loading}
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Prevents unauthorized lookup by verifying ownership of the registered phone number.
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 animate-shake">
                <span className="material-symbols-outlined text-rose-400 text-[18px] shrink-0 mt-0.5">error</span>
                <p className="text-xs text-rose-200 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Verifying Details…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">search</span>
                  <span>View Member Pass</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center space-y-2 text-xs text-slate-400">
          <p className="opacity-80">Have a physical card? Scan the QR code on your card.</p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <Link to="/login" className="text-amber-400 hover:underline font-semibold">Merchant Portal</Link>
            <span className="text-slate-600">·</span>
            <a href="/" className="text-slate-300 hover:underline font-medium">MetroCardz Home</a>
          </div>
        </div>

      </div>
    </div>
  );
}

function MembershipResult({
  data,
  onReset,
}: {
  data: PublicMemberView;
  onReset: () => void;
}) {
  const [dataReady, setDataReady] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const pointsVal = Number(data.loyalty_points) || 0;
  const points = useCountUp(pointsVal, 1200, dataReady);

  useEffect(() => {
    const t = setTimeout(() => setDataReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  const isExpired = data.status === 'expired';

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white pb-14 selection:bg-amber-500 selection:text-black">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-b from-[#131927] via-[#0F1422] to-[#07090E] pt-8 pb-14 px-4 text-center border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-md mx-auto relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1 text-xs text-amber-300 font-semibold mb-1">
            <span className="material-symbols-outlined text-[16px] text-amber-400">verified</span>
            {data.merchant_name}
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">{data.merchant_name}</h1>
          <p className="text-xs text-slate-400 font-medium">Digital Loyalty Membership Pass</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 -mt-8 space-y-5 relative z-20">

        {/* ── Luxury Metallic Digital Pass Card ── */}
        <div className="rounded-3xl p-6 bg-gradient-to-br from-[#161C2E] via-[#0F1424] to-[#0A0D18] border border-amber-500/30 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Card texture lines */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Card Top Row */}
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                {data.member_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight">{data.member_name}</h2>
                <p className="text-xs font-mono font-semibold text-amber-400 mt-0.5">{data.member_code}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 border border-amber-400/30 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {data.membership_type_name}
              </span>
            </div>
          </div>

          {/* Card Middle: Loyalty Points Banner */}
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 rounded-2xl p-4 border border-amber-400/30 flex items-center justify-between shadow-inner">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-300/80">Loyalty Balance</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black text-white tabular-nums tracking-tight">
                  {dataReady ? points.toLocaleString() : pointsVal.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-amber-400 uppercase">Points</span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-md">
              <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
          </div>

          {/* Card Bottom Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] uppercase font-bold text-slate-400">Member Status</p>
              <p className="text-xs font-extrabold text-emerald-400 mt-0.5 capitalize flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {data.status || 'Active'}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] uppercase font-bold text-slate-400">{isExpired ? 'Expired On' : 'Valid Until'}</p>
              <p className="text-xs font-extrabold text-slate-200 mt-0.5">
                {format(new Date(data.expiry_date), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* ── Active Store Coupons & Discount Vouchers ── */}
        {data.coupons && data.coupons.length > 0 && !isExpired && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-400">confirmation_number</span>
              Store Coupons & Promo Vouchers ({data.coupons.length})
            </h3>

            <div className="space-y-3">
              {data.coupons.map((coupon: any) => (
                <div key={coupon.id} className="bg-[#0F1422] rounded-2xl p-4 border border-amber-500/20 shadow-lg space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono font-black text-amber-300 text-base tracking-widest bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30 inline-block">
                        {coupon.code}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-400">
                        {coupon.discount_type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                    <span>Min Purchase: ₹{coupon.min_purchase || 0}</span>
                    <button
                      onClick={() => copyCoupon(coupon.code)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-colors border border-amber-500/30"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedCode === coupon.code ? 'check' : 'content_copy'}
                      </span>
                      {copiedCode === coupon.code ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Tier Benefits ── */}
        {data.offers && data.offers.length > 0 && !isExpired && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-indigo-400">workspace_premium</span>
              Tier Membership Perks ({data.offers.length})
            </h3>

            <div className="space-y-3">
              {data.offers.map((offer: any, idx: number) => (
                <div key={offer.id || idx} className="bg-[#0F1422] rounded-2xl p-4 flex items-start gap-3.5 border border-white/10 shadow-lg">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300">
                    <span className="material-symbols-outlined text-[20px]">
                      {OFFER_ICONS[offer.offer_type] || 'star'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{offer.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reward Catalog ── */}
        {data.rewards && data.rewards.length > 0 && !isExpired && (
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-400">card_giftcard</span>
              Rewards & Gift Catalog ({data.rewards.length})
            </h3>

            <div className="space-y-3">
              {data.rewards.map((reward: any) => (
                <div key={reward.id} className="bg-[#0F1422] rounded-2xl p-4 border border-white/10 shadow-lg flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{reward.name}</h4>
                    {reward.description && <p className="text-xs text-slate-400 mt-0.5">{reward.description}</p>}
                    <p className="text-xs font-bold text-amber-400 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">stars</span>
                      {reward.points_cost} points required
                    </p>
                  </div>
                  <span className="text-[11px] px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold shrink-0">
                    Claim at Store
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Invite & WhatsApp Share ── */}
        {data.referral_code && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 shadow-xl text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">Your Referral Invite Code</span>
              <span className="font-mono font-black text-lg bg-black/20 px-3 py-1 rounded-xl tracking-widest">{data.referral_code}</span>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Invite friends to join {data.merchant_name}. Earn bonus loyalty points on your next purchase!
            </p>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join ${data.merchant_name} loyalty program using my invite code ${data.referral_code}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-emerald-950 hover:bg-emerald-50 w-full py-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Share Invite Code on WhatsApp
            </a>
          </div>
        )}

        {/* ── How to Redeem Guide ── */}
        <div className="bg-[#0F1422] rounded-3xl p-5 border border-white/10 space-y-2 text-xs text-slate-300">
          <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber-400 text-[16px]">help_outline</span>
            How to Redeem
          </h4>
          <ul className="space-y-1.5 text-slate-400 list-disc pl-4 leading-relaxed">
            <li><strong className="text-slate-200">Coupons & Promos:</strong> Mention or show coupon code at store POS checkout.</li>
            <li><strong className="text-slate-200">Points & Rewards:</strong> State your Mobile Number or Member Code at checkout counter.</li>
          </ul>
        </div>

        {/* Reset Action */}
        <button
          onClick={onReset}
          className="w-full py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          Check Another Membership
        </button>

      </div>
    </div>
  );
}

export default function CheckMembershipPage() {
  const [data, setData] = useState<PublicMemberView | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResult = (view: PublicMemberView) => {
    setLoading(true);
    setTimeout(() => {
      setData(view);
      setLoading(false);
    }, 250);
  };

  const handleReset = () => {
    setData(null);
  };

  if (loading) return <LookupSkeleton />;
  if (data) return <MembershipResult data={data} onReset={handleReset} />;
  return <LookupForm onResult={handleResult} />;
}
