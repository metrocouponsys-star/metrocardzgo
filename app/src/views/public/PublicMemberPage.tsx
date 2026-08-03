import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PublicMemberView } from '../../types';
import * as api from '../../api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
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

// ── Animated number counter ────────────────────────────────────────────────
function useCountUp(target: number, duration = 1000, enabled = true) {
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

// ── Premium Skeleton Loader (White & Blue Theme) ───────────────────────────
function PublicSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Skeleton Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
              <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-200 animate-pulse" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Skeleton Hero Card */}
        <div className="h-48 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 animate-pulse p-6 text-white space-y-4" />
        {/* Skeleton Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
        {/* Skeleton Progress */}
        <div className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        {/* Skeleton Transactions */}
        <div className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

export default function PublicMemberPage() {
  const { token, id } = useParams<{ token?: string; id?: string }>();
  const passToken = token || id || '';

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // Tab & Modal Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'rewards' | 'wallet' | 'more'>('home');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Feedback form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Wallet
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletUrl, setWalletUrl] = useState<string | null>(null);

  const points = useCountUp(data?.loyalty_points ?? 0, 1200, dataReady);

  useEffect(() => {
    if (!passToken) return;
    api.getPublicMemberView(passToken).then(d => {
      if (!d) setNotFound(true);
      else {
        setData(d);
        setTimeout(() => setDataReady(true), 100);
      }
      setLoading(false);
    });
  }, [passToken]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !data) return;
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback(data.member_id, rating, comment);
      setFeedbackSubmitted(true);
    } catch {
      alert('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) return <PublicSkeleton />;

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 rounded-3xl bg-rose-50 flex items-center justify-center mb-5 border border-rose-200">
          <span className="material-symbols-outlined text-rose-600 text-[44px]">credit_card_off</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Card Not Recognized</h1>
        <p className="text-sm text-slate-500 max-w-xs font-medium">
          This membership card could not be found. Please scan your card QR code again or contact {data?.merchant_name || 'the store'}.
        </p>
      </div>
    );
  }

  const isActive = data.status === 'active';
  const isExpired = data.status === 'expired';

  // Tier progress logic
  const pointsVal = Number(data.loyalty_points) || 0;
  const nextTierTarget = pointsVal < 1000 ? 1000 : pointsVal < 3000 ? 3000 : 5000;
  const nextTierName = pointsVal < 1000 ? 'Silver Tier' : pointsVal < 3000 ? 'Platinum Tier' : 'VIP Diamond Tier';
  const pointsAway = Math.max(0, nextTierTarget - pointsVal);
  const progressPercent = Math.min(100, Math.round((pointsVal / nextTierTarget) * 100));

  // Mock / Real recent activity items
  const recentActivity = [
    { id: 1, title: `${data.merchant_name} Visit`, type: 'earn', pts: '+120 pts', date: '01 Aug 2026', icon: 'storefront', color: 'text-emerald-600 bg-emerald-50' },
    { id: 2, title: 'Bonus Reward Earned', type: 'earn', pts: '+80 pts', date: '30 Jul 2026', icon: 'stars', color: 'text-blue-600 bg-blue-50' },
    { id: 3, title: 'Offer Redemption', type: 'redeem', pts: '-200 pts', date: '29 Jul 2026', icon: 'local_mall', color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28 selection:bg-blue-600 selection:text-white font-sans">

      {/* ── 1. Top Bar Header (White & Blue Premium Theme) ── */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/80 px-4 py-3.5 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Member Initials Avatar */}
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md ring-2 ring-blue-500/20">
                {data.member_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            {/* Member Greeting */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 tracking-tight">Welcome back,</p>
              <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
                {data.member_name}
              </h1>
            </div>
          </div>

          {/* Right Action: Store verified pill / Notification bell */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[14px] text-blue-600">verified</span>
              {data.merchant_name}
            </span>
            <button
              onClick={() => setShowQrModal(true)}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 flex items-center justify-center transition-colors border border-slate-200/60"
              title="Show QR Code"
            >
              <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. Main Container ── */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-5">

        {/* Expired warning banner */}
        {isExpired && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-rose-600 text-[22px] shrink-0 mt-0.5">warning</span>
            <div>
              <p className="font-black text-rose-900 text-sm">Membership Expired</p>
              <p className="text-xs text-rose-700 font-medium mt-0.5 leading-relaxed">
                Visit {data.merchant_name} to renew your membership and unlock your perks.
              </p>
            </div>
          </div>
        )}

        {/* ── 3. Main Hero Points Card & Digital Pass Widget (Directly matching image layout!) ── */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-700/40 relative overflow-hidden space-y-4">
          
          {/* Ambient Background Glows */}
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Merchant Brand Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
            <div className="flex items-center gap-2">
              {data.merchant_logo ? (
                <img src={data.merchant_logo} alt="Store Logo" className="w-6 h-6 rounded-lg object-cover bg-white p-0.5" />
              ) : (
                <span className="material-symbols-outlined text-amber-400 text-[18px]">storefront</span>
              )}
              <span className="text-xs font-black tracking-wide text-blue-100">{data.merchant_name}</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full text-amber-300 border border-amber-300/20">
              Official Member Pass
            </span>
          </div>

          {/* Hero Content: Points Column + Digital Card Widget */}
          <div className="flex items-center justify-between gap-3 relative z-10">
            
            {/* Left Column: Total Points & Action */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">Total Points</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight tabular-nums text-white">
                    {dataReady ? points.toLocaleString() : pointsVal.toLocaleString()}
                  </span>
                  <span className="text-xl text-amber-400 font-bold">🪙</span>
                </div>
                <p className="text-xs text-blue-200/90 font-medium mt-1">Keep earning, keep winning!</p>
              </div>

              <button
                onClick={() => setShowRewardsModal(true)}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">stars</span>
                <span>View Rewards</span>
              </button>
            </div>

            {/* Right Column: Mini Digital Card Widget (Matching image!) */}
            <div
              onClick={() => setShowQrModal(true)}
              className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 rounded-2xl p-3.5 shadow-2xl border border-amber-300/60 w-36 sm:w-44 h-36 sm:h-40 flex flex-col justify-between relative shrink-0 cursor-pointer group hover:scale-[1.03] transition-transform"
            >
              {/* Card Header: QR Icon Button */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-950/70">METRO PASS</span>
                <div className="w-8 h-8 rounded-lg bg-slate-950/10 border border-slate-950/20 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                </div>
              </div>

              {/* Card Middle: Tier Badge */}
              <div>
                <p className="text-sm font-black tracking-tight uppercase leading-none">
                  {data.membership_type_name}
                </p>
                <p className="text-[10px] font-bold text-slate-950/70 uppercase">MEMBER</p>
              </div>

              {/* Card Footer: Member ID */}
              <div className="pt-2 border-t border-slate-950/10 flex items-center justify-between text-[9px] font-mono font-bold">
                <span>ID: #{data.member_code}</span>
                <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── 4. Quick Actions Grid (Matching 3-Button Row in Image) ── */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setShowRewardsModal(true)}
            className="bg-white hover:bg-blue-50/60 border border-slate-200/80 rounded-2xl p-3.5 text-center space-y-2 shadow-sm transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 mx-auto flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[22px]">card_giftcard</span>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-tight">Redeem Rewards</p>
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="bg-white hover:bg-blue-50/60 border border-slate-200/80 rounded-2xl p-3.5 text-center space-y-2 shadow-sm transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[22px]">history</span>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-tight">Transaction History</p>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('perks-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white hover:bg-blue-50/60 border border-slate-200/80 rounded-2xl p-3.5 text-center space-y-2 shadow-sm transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-600 mx-auto flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-[22px]">local_offer</span>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-tight">Store Offers</p>
          </button>
        </div>

        {/* ── 5. "Your Progress" Section (Matching Image!) ── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900">Your Progress</h2>
            <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">See All</span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-xs text-slate-600 font-medium">
                {pointsAway > 0 ? (
                  <>You're <span className="font-extrabold text-blue-700">{pointsAway} points</span> away from</>
                ) : (
                  <>You've unlocked</>
                )}
              </p>
              <p className="text-sm font-black text-amber-600 flex items-center gap-1 mt-0.5">
                {nextTierName}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/70">
              <div
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
              <span>{pointsVal.toLocaleString()} pts</span>
              <span>{nextTierTarget.toLocaleString()} pts</span>
            </div>
          </div>
        </div>

        {/* ── 6. "Recent Transactions" Section (Matching Image!) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900">Recent Transactions</h2>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="text-xs font-bold text-blue-600 cursor-pointer hover:underline"
            >
              See All
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {recentActivity.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] font-semibold text-slate-400 capitalize">{item.type === 'earn' ? 'Earned' : 'Redeemed'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-xs font-extrabold ${item.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.pts}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 7. Special Bonus / Promotional Banner (Matching Image!) ── */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 border border-amber-400/30 shadow-lg flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
              🎁 Special Bonus!
            </span>
            <h3 className="text-xs font-bold text-blue-100 leading-snug">
              Earn double points on every weekend purchase.
            </h3>
          </div>
          <button
            onClick={() => setShowRewardsModal(true)}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shrink-0 shadow-md transition-all active:scale-95 relative z-10"
          >
            Learn More
          </button>
        </div>

        {/* ── 8. Google Wallet Integration Button ── */}
        {!isExpired && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-2">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-blue-600">account_balance_wallet</span>
              Keep Pass in Google Wallet
            </p>
            {walletUrl ? (
              <a href={walletUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button variant="filled" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs" icon="add_to_wallet">
                  Save to Google Wallet
                </Button>
              </a>
            ) : (
              <Button
                variant="filled"
                loading={walletLoading}
                icon="add_to_wallet"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                onClick={async () => {
                  if (!passToken) return;
                  setWalletLoading(true);
                  try {
                    const res = await api.getPublicWalletPassUrl(passToken);
                    setWalletUrl(res.save_url);
                    window.open(res.save_url, '_blank', 'noopener,noreferrer');
                  } catch {
                    alert('Failed to generate Google Wallet pass. Please try again later.');
                  } finally {
                    setWalletLoading(false);
                  }
                }}
              >
                {walletLoading ? 'Generating Pass…' : 'Add to Google Wallet'}
              </Button>
            )}
          </div>
        )}

        {/* ── 9. Store Perks & Offers Section ── */}
        <div id="perks-section" className="space-y-3">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-blue-600">workspace_premium</span>
            Tier Perks & Member Benefits
          </h2>

          {data.offers.length > 0 ? (
            <div className="space-y-3">
              {data.offers.map((offer: any) => (
                <div key={offer.id} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {OFFER_ICONS[offer.offer_type] || 'star'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-xs">{offer.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs font-medium border border-slate-200">
              No active tier offers currently available.
            </div>
          )}
        </div>

        {/* ── 10. Store Feedback Rating Section ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600">rate_review</span>
            Share Your Experience at {data.merchant_name}
          </h3>

          {feedbackSubmitted ? (
            <div className="text-center py-4 space-y-2 bg-emerald-50 rounded-xl border border-emerald-200 p-4">
              <span className="material-symbols-outlined text-emerald-600 text-[32px]">check_circle</span>
              <p className="font-bold text-emerald-900 text-xs">Thank you for your feedback!</p>
              <p className="text-[11px] text-emerald-700">Your response has been saved.</p>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-amber-400 hover:scale-110 active:scale-95 transition-transform p-1"
                  >
                    <span
                      className="material-symbols-outlined text-[32px]"
                      style={{ fontVariationSettings: `'FILL' ${(hoverRating || rating) >= star ? 1 : 0}` }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Write a review or comment..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none font-medium"
              />
              <Button
                type="submit"
                variant="filled"
                loading={submittingFeedback}
                disabled={rating === 0}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Submit Feedback
              </Button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center py-4 space-y-1">
          {data.merchant_phone && (
            <p className="text-xs text-slate-500">
              Helpline: <a href={`tel:${data.merchant_phone}`} className="text-blue-600 font-bold hover:underline">{data.merchant_phone}</a>
            </p>
          )}
          <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px]">bolt</span>
            Powered by Metro Cardz Digital Loyalty
          </p>
        </div>
      </main>

      {/* ── 11. Sticky Mobile App Navigation Bar (Directly Matching Reference Image!) ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto flex items-center justify-around relative">
          
          {/* Tab 1: Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : undefined }}>home</span>
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* Tab 2: Rewards */}
          <button
            onClick={() => { setActiveTab('rewards'); setShowRewardsModal(true); }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'rewards' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">card_giftcard</span>
            <span className="text-[10px] font-bold">Rewards</span>
          </button>

          {/* Center Floating Action Button (FAB): Scan QR (Directly matching image!) */}
          <button
            onClick={() => setShowQrModal(true)}
            className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex flex-col items-center justify-center shadow-xl border-4 border-white active:scale-95 transition-transform"
            title="Scan Card QR"
          >
            <span className="material-symbols-outlined text-[26px]">qr_code_2</span>
            <span className="text-[8px] font-black uppercase tracking-tight -mt-0.5">Scan</span>
          </button>

          {/* Tab 3: Wallet */}
          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'wallet' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            <span className="text-[10px] font-bold">Wallet</span>
          </button>

          {/* Tab 4: More */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'more' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            <span className="text-[10px] font-bold">More</span>
          </button>

        </div>
      </nav>

      {/* ── 12. Full-Screen QR Code Modal ── */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 relative animate-scale-up">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="space-y-1 pt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-0.5 rounded-full">
                POS Counter QR Code
              </span>
              <h3 className="text-xl font-black text-slate-900">{data.member_name}</h3>
              <p className="text-xs font-mono font-bold text-amber-600">ID: #{data.member_code}</p>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-md inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=METROCARDZ:${data.member_code}`}
                alt="Member QR Code"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Show this QR code at {data.merchant_name} POS counter to instantly earn or redeem points.
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── 13. Rewards Catalog Sheet Modal ── */}
      {showRewardsModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[24px]">card_giftcard</span>
                <h3 className="text-base font-black text-slate-900">Rewards Catalog</h3>
              </div>
              <button
                onClick={() => setShowRewardsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {data.rewards && data.rewards.length > 0 ? (
              <div className="space-y-3">
                {data.rewards.map((reward: any) => (
                  <div key={reward.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{reward.name}</p>
                      {reward.description && <p className="text-[11px] text-slate-500 mt-0.5">{reward.description}</p>}
                      <p className="text-xs font-bold text-amber-600 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">stars</span>
                        {reward.points_cost} points
                      </p>
                    </div>
                    <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-xl shrink-0">
                      Claim at Counter
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs font-medium space-y-2">
                <span className="material-symbols-outlined text-[36px] block opacity-40">stars</span>
                <p>Show your pass at the counter to redeem your points for custom store rewards!</p>
              </div>
            )}

            <button
              onClick={() => setShowRewardsModal(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── 14. Full Transaction History Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[24px]">history</span>
                <h3 className="text-base font-black text-slate-900">Transaction History</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              {recentActivity.map(item => (
                <div key={item.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[10px] font-medium text-slate-400">{item.date}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-extrabold ${item.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.pts}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
