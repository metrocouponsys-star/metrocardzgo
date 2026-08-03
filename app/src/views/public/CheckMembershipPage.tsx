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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 animate-pulse">
        <div className="h-44 rounded-3xl bg-white border border-slate-200 shadow-sm" />
        <div className="h-28 rounded-2xl bg-white border border-slate-200 shadow-sm" />
        <div className="h-36 rounded-2xl bg-white border border-slate-200 shadow-sm" />
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-amber-500 selection:text-black">

      <div className="w-full max-w-md space-y-6 relative z-10 animate-fade-in">

        {/* MetroCardz Platform Brand Header */}
        <div className="text-center space-y-3">
          <img
            src="/logo.png"
            alt="Metro Cardz"
            className="w-16 h-16 object-contain mx-auto shadow-md rounded-2xl bg-white p-1"
          />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Metro <span className="text-amber-600">Cardz</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Digital Membership & Rewards Portal</p>
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
            View your points balance, benefits & active store coupons — no login required.
          </p>
          <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3.5 py-1 text-xs font-bold text-amber-800">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Balance & Rewards Enquiry
          </span>
        </div>

        {/* Crisp Light Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            <div className="space-y-2">
              <label htmlFor="cm-identifier" className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-600">card_membership</span>
                Membership Code or Mobile Number
              </label>
              <div className="relative">
                <input
                  id="cm-identifier"
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 text-sm font-bold transition-all outline-none"
                  placeholder="e.g. #MC0004 or 9987379000"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoComplete="off"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="cm-last4" className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-amber-600">lock</span>
                  Last 4 Digits of Registered Phone
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Security Check</span>
              </label>
              <input
                id="cm-last4"
                type="tel"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl px-4 py-3.5 text-center font-mono text-xl tracking-[0.4em] font-black text-amber-700 placeholder:text-slate-300 transition-all outline-none"
                placeholder="0 0 0 0"
                value={last4}
                onChange={e => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                autoComplete="off"
                disabled={loading}
              />
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Must match the last 4 digits of the member's registered phone number.
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">error</span>
                <div className="space-y-1">
                  <p className="text-xs text-rose-800 font-bold leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs tracking-wide shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>Verifying Details…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">search</span>
                  <span>View My Pass & Benefits</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center space-y-2 text-xs text-slate-400 font-medium">
          <p>Scanning QR code on card directly opens this view.</p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <Link to="/login" className="text-amber-700 hover:underline font-bold">Merchant Login</Link>
            <span className="text-slate-300">·</span>
            <a href="/" className="text-slate-600 hover:underline font-medium">MetroCardz Home</a>
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
  const [activeTab, setActiveTab] = useState<'perks' | 'coupons' | 'rewards' | 'history' | 'referral'>('perks');

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-14 selection:bg-amber-500 selection:text-black">

      {/* Top Banner Header with Particular Merchant Logo */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 text-center shadow-sm">
        <div className="max-w-md mx-auto space-y-2">
          {data.merchant_logo ? (
            <img
              src={data.merchant_logo}
              alt={data.merchant_name}
              className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-sm border border-slate-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-center mx-auto text-amber-600 font-black text-xl shadow-sm">
              {data.merchant_name ? data.merchant_name.slice(0, 2).toUpperCase() : 'MG'}
            </div>
          )}
          <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-0.5 text-xs text-amber-900 font-bold">
            <span className="material-symbols-outlined text-[16px] text-amber-600">verified</span>
            {data.merchant_name}
          </span>
          <h1 className="text-xl font-black text-slate-900">{data.merchant_name}</h1>
          <p className="text-xs text-slate-500 font-semibold">Digital Loyalty Member Pass</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">

        {/* ── Light Modern Digital Member Card ── */}
        <div className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">

          {/* Card Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-md">
                {data.member_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{data.member_name}</h2>
                <p className="text-xs font-mono font-bold text-amber-700">#{data.member_code}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 border border-amber-300 text-amber-900">
              {data.membership_type_name}
            </span>
          </div>

          {/* Hero Loyalty Points Card */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 rounded-2xl p-5 text-slate-950 shadow-md flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-950/75">Loyalty Points Balance</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-4xl font-black tabular-nums tracking-tight">
                  {dataReady ? points.toLocaleString() : pointsVal.toLocaleString()}
                </span>
                <span className="text-xs font-black uppercase text-slate-950/80">pts</span>
              </div>
            </div>

            <div className="w-12 h-12 rounded-xl bg-slate-950/10 border border-slate-950/15 flex items-center justify-center text-slate-950 shadow-sm">
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
          </div>

          {/* Card Footer Details */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Visits</p>
              <p className="text-xs font-black text-slate-900 mt-0.5">
                {data.total_visits || 0} visits
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400">{isExpired ? 'Expired On' : 'Valid Until'}</p>
              <p className="text-xs font-black text-slate-900 mt-0.5">
                {format(new Date(data.expiry_date), 'dd MMM yyyy')}
              </p>
            </div>
          </div>

          {data.physical_card_number && (
            <div className="bg-slate-900 rounded-xl p-3 text-slate-100 flex items-center justify-between text-xs font-mono font-bold tracking-widest shadow-inner">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="material-symbols-outlined text-[16px]">credit_card</span>
                Card Number
              </span>
              <span className="text-white">{data.physical_card_number}</span>
            </div>
          )}
        </div>

        {/* ── Tabbed View Container ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">

          {/* Tab Navigation Header */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-3 pt-2 gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('perks')}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1 shrink-0 ${activeTab === 'perks' ? 'text-amber-700 border-amber-500 bg-white rounded-t-xl shadow-sm' : 'text-slate-500 border-transparent hover:text-slate-900'
                }`}
            >
              <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
              Perks ({data.offers?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1 shrink-0 ${activeTab === 'coupons' ? 'text-amber-700 border-amber-500 bg-white rounded-t-xl shadow-sm' : 'text-slate-500 border-transparent hover:text-slate-900'
                }`}
            >
              <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
              Coupons ({data.coupons?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1 shrink-0 ${activeTab === 'rewards' ? 'text-amber-700 border-amber-500 bg-white rounded-t-xl shadow-sm' : 'text-slate-500 border-transparent hover:text-slate-900'
                }`}
            >
              <span className="material-symbols-outlined text-[14px]">card_giftcard</span>
              Rewards ({data.rewards?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1 shrink-0 ${activeTab === 'history' ? 'text-amber-700 border-amber-500 bg-white rounded-t-xl shadow-sm' : 'text-slate-500 border-transparent hover:text-slate-900'
                }`}
            >
              <span className="material-symbols-outlined text-[14px]">history</span>
              History
            </button>

            {data.referral_code && (
              <button
                onClick={() => setActiveTab('referral')}
                className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1 shrink-0 ${activeTab === 'referral' ? 'text-amber-700 border-amber-500 bg-white rounded-t-xl shadow-sm' : 'text-slate-500 border-transparent hover:text-slate-900'
                  }`}
              >
                <span className="material-symbols-outlined text-[14px]">share</span>
                Invite Code
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">

            {/* TAB: PERKS */}
            {activeTab === 'perks' && (
              <div className="space-y-3">
                {(!data.offers || data.offers.length === 0) ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No active tier perks configured right now.</p>
                ) : (
                  data.offers.map((offer: any, idx: number) => (
                    <div key={offer.id || idx} className="bg-slate-50 rounded-2xl p-3.5 flex items-start gap-3 border border-slate-200">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800">
                        <span className="material-symbols-outlined text-[18px]">
                          {OFFER_ICONS[offer.offer_type] || 'star'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{offer.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{offer.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: COUPONS */}
            {activeTab === 'coupons' && (
              <div className="space-y-3">
                {(!data.coupons || data.coupons.length === 0) ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No active store coupons right now.</p>
                ) : (
                  data.coupons.map((coupon: any) => (
                    <div key={coupon.id} className="bg-amber-50/40 rounded-2xl p-4 border-2 border-dashed border-amber-300 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono font-black text-amber-900 text-xs tracking-widest bg-amber-200/60 px-2.5 py-1 rounded-lg border border-amber-300">
                          {coupon.code}
                        </span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          {coupon.discount_type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-amber-200/60">
                        <span className="font-semibold">Min purchase: ₹{coupon.min_purchase || 0}</span>
                        <button
                          onClick={() => copyCoupon(coupon.code)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {copiedCode === coupon.code ? 'check' : 'content_copy'}
                          </span>
                          {copiedCode === coupon.code ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: REWARDS */}
            {activeTab === 'rewards' && (
              <div className="space-y-3">
                {(!data.rewards || data.rewards.length === 0) ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No catalog rewards available right now.</p>
                ) : (
                  data.rewards.map((reward: any) => {
                    const canAfford = pointsVal >= reward.points_cost;
                    return (
                      <div key={reward.id} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{reward.name}</h4>
                          {reward.description && <p className="text-[11px] text-slate-500 mt-0.5">{reward.description}</p>}
                          <p className="text-[11px] font-bold text-amber-700 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">stars</span>
                            {reward.points_cost} pts required
                          </p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold shrink-0 ${canAfford ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'}`}>
                          {canAfford ? 'Claim at Store' : 'Needs More Pts'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {((!data.loyalty_history || data.loyalty_history.length === 0) && (!data.redemptions || data.redemptions.length === 0)) ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">No transaction or redemption history recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {data.loyalty_history?.map((t: any) => (
                      <div key={t.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 capitalize">{t.description || t.transaction_type.replace('_', ' ')}</p>
                          {t.created_at && <p className="text-[10px] text-slate-400 mt-0.5">{format(new Date(t.created_at), 'dd MMM yyyy, HH:mm')}</p>}
                        </div>
                        <span className={`font-mono font-black text-xs ${t.points >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.points >= 0 ? `+${t.points}` : t.points} pts
                        </span>
                      </div>
                    ))}
                    {data.redemptions?.map((r: any) => (
                      <div key={r.id} className="bg-amber-50/50 rounded-2xl p-3 border border-amber-200 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-amber-900">{r.offer_title}</p>
                          {r.redeemed_at && <p className="text-[10px] text-amber-700 mt-0.5">{format(new Date(r.redeemed_at), 'dd MMM yyyy, HH:mm')}</p>}
                        </div>
                        <span className="font-bold text-amber-800 text-[11px] bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                          Redeemed
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: REFERRAL */}
            {activeTab === 'referral' && data.referral_code && (
              <div className="bg-emerald-600 rounded-2xl p-4 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">Invite Code</span>
                  <span className="font-mono font-black text-sm bg-black/20 px-2.5 py-0.5 rounded-lg tracking-widest">{data.referral_code}</span>
                </div>
                <p className="text-[11px] text-emerald-100 leading-relaxed font-medium">
                  Share your invite code with friends to earn bonus loyalty points on your next store visit!
                </p>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join ${data.merchant_name} loyalty program using my invite code ${data.referral_code}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-emerald-950 hover:bg-emerald-50 w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">share</span>
                  Share on WhatsApp
                </a>
              </div>
            )}

          </div>

        </div>

        {/* Reset Action */}
        <button
          onClick={onReset}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
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
