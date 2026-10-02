import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PublicMemberView } from '../../types';
import * as api from '../../api';
import { format } from 'date-fns';

// ── Offer icons ───────────────────────────────────────────────────────────
const OFFER_ICONS: Record<string, string> = {
  percent_off: 'percent',
  free_service: 'spa',
  wallet_points: 'account_balance_wallet',
  referral: 'people',
  birthday: 'cake',
  points_redemption: 'stars',
  visit_milestone: 'workspace_premium',
};

const OFFER_COLORS = [
  { bg: 'bg-accent/[0.08]', icon: 'text-accent', border: 'border-accent/10' },
  { bg: 'bg-secondary/[0.08]', icon: 'text-secondary', border: 'border-secondary/10' },
  { bg: 'bg-tertiary/[0.08]', icon: 'text-tertiary', border: 'border-tertiary/10' },
  { bg: 'bg-purple-500/[0.08]', icon: 'text-purple-600', border: 'border-purple-500/10' },
  { bg: 'bg-pink-500/[0.08]', icon: 'text-pink-600', border: 'border-pink-500/10' },
];

// ── Tier config ─────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { gradient: string; badge: string; progress: string }> = {
  bronze:   { gradient: 'from-amber-500 to-amber-600',   badge: 'bg-amber-50 text-amber-700 border-amber-200',   progress: '#F59E0B' },
  silver:   { gradient: 'from-slate-400 to-slate-500',   badge: 'bg-slate-50 text-slate-600 border-slate-200',   progress: '#94A3B8' },
  gold:     { gradient: 'from-yellow-400 to-amber-500',  badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', progress: '#EAB308' },
  platinum: { gradient: 'from-purple-500 to-violet-600', badge: 'bg-purple-50 text-purple-700 border-purple-200', progress: '#8B5CF6' },
};

// ── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, enabled = true) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    if (!enabled || target === 0) { setCurrent(0); return; }
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCurrent(Math.round(ease * target));
      if (p < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);
  return current;
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function GoSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="h-40 bg-gradient-to-br from-accent/[0.06] to-surface" />
      <div className="max-w-md mx-auto px-4 -mt-8 pb-10 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-outline-variant/30 shadow-card" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function PublicMemberPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [tierData, setTierData] = useState<any>(null);
  const [streakData, setStreakData] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [walletLoading, setWalletLoading] = useState(false);
  const [walletUrl, setWalletUrl] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [drawEntering, setDrawEntering] = useState<string | null>(null);

  const points = useCountUp(data?.loyalty_points ?? 0, 1200, dataReady);

  useEffect(() => {
    if (!token) return;
    api.getPublicMemberView(token).then(d => {
      if (!d) { setNotFound(true); }
      else {
        setData(d);
        const mid = d.member_id;
        if (mid) {
          fetch(`/api/v1/tiers/member/${mid}`).then(r => r.ok ? r.json() : null).then(t => setTierData(t)).catch(() => {});
          fetch(`/api/v1/tiers/member/${mid}/streak`).then(r => r.ok ? r.json() : null).then(s => setStreakData(s)).catch(() => {});
          fetch(`/api/v1/challenges/member/${mid}`).then(r => r.ok ? r.json() : null).then(c => setChallenges(c || [])).catch(() => {});
        }
        setTimeout(() => setDataReady(true), 100);
      }
      setLoading(false);
    });
  }, [token]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !data) return;
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback(data.member_id, rating, comment);
      setFeedbackSubmitted(true);
    } catch {
      // Silent fail — don't alert() in 2024
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const enterDraw = async (drawId: string) => {
    setDrawEntering(drawId);
    try {
      await api.publicEnterLuckyDraw(drawId, token || '');
      setData((prev: any) => ({
        ...prev,
        open_lucky_draws: prev.open_lucky_draws?.map((d: any) =>
          d.id === drawId ? { ...d, already_entered: true } : d
        ),
      }));
    } catch {
      // silent
    } finally {
      setDrawEntering(null);
    }
  };

  if (loading) return <GoSkeleton />;

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-surface">
        <div className="w-16 h-16 rounded-2xl bg-error-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-error text-[32px]">credit_card_off</span>
        </div>
        <h1 className="text-xl font-bold text-on-surface font-display mb-2">Card Not Found</h1>
        <p className="text-on-surface-variant max-w-xs text-[14px]">
          This membership card could not be found. Please check the QR code and try again.
        </p>
        <p className="mt-4 text-[12px] text-on-surface-variant/50">⚡ Powered by Metro Cardz</p>
      </div>
    );
  }

  const isActive = data.status === 'active';
  const isExpired = data.status === 'expired';
  const tierSlug = tierData?.tier_slug || 'bronze';
  const tierCfg = TIER_CONFIG[tierSlug] || TIER_CONFIG.bronze;
  const currentStreak = streakData?.current_streak || 0;
  const ptsToNext = tierData?.next_tier_points_needed;
  const totalForNext = ptsToNext != null ? (data.loyalty_points + ptsToNext) : null;

  const hasOffers = data.offers?.length > 0;
  const hasRewards = data.rewards?.length > 0;
  const hasChallenges = challenges.length > 0;
  const hasDraws = (data as any).open_lucky_draws?.length > 0;
  const hasScratchCards = (data as any).scratch_cards?.length > 0;
  const hasCoupons = data.coupons?.length > 0;
  const isBirthday = data.is_birthday_month;
  const isAnniversary = data.is_anniversary_month;

  // Avatar letters
  const initials = data.member_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'M';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">

      {/* ── Sticky Header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-outline-variant/30 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-[13px] shrink-0">
          {data.merchant_logo_url ? (
            <img src={data.merchant_logo_url} alt={data.merchant_name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            data.merchant_name?.charAt(0) || 'M'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-on-surface text-[14px] truncate font-display">{data.merchant_name}</p>
          <p className="text-[11px] text-on-surface-variant">Loyalty Membership</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
          isActive ? 'bg-secondary/[0.08] text-secondary border-secondary/20' :
          isExpired ? 'bg-error-container text-error border-error/20' :
          'bg-surface-container text-on-surface-variant border-outline-variant/40'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-secondary animate-pulse' : isExpired ? 'bg-error' : 'bg-outline'}`} />
          {isActive ? 'Active' : isExpired ? 'Expired' : data.status}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4 pb-12">

        {/* ── Celebration banners ─────────────────────────────────────── */}
        {isBirthday && (
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
            <span className="text-3xl">🎂</span>
            <div>
              <p className="font-bold text-rose-700 text-[14px]">Happy Birthday, {data.member_name?.split(' ')[0]}! 🎉</p>
              <p className="text-[12px] text-rose-600/80">Special birthday offers are waiting for you below.</p>
            </div>
          </div>
        )}
        {isAnniversary && !isBirthday && (
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
            <span className="text-3xl">🎊</span>
            <div>
              <p className="font-bold text-purple-700 text-[14px]">Happy Membership Anniversary!</p>
              <p className="text-[12px] text-purple-600/80">Thank you for being a loyal member.</p>
            </div>
          </div>
        )}

        {/* ── Expired Warning ─────────────────────────────────────────── */}
        {isExpired && (
          <div className="bg-error-container rounded-2xl p-4 flex items-start gap-3 border border-error/15">
            <span className="material-symbols-outlined text-error text-[22px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div>
              <p className="font-bold text-on-error-container text-[14px]">Membership Expired</p>
              <p className="text-[12px] text-on-error-container/80 mt-0.5">
                Visit {data.merchant_name} to renew your membership and restore your benefits.
              </p>
            </div>
          </div>
        )}

        {/* ── Digital Member Card ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-card border border-outline-variant/30 overflow-hidden">
          {/* Tier color accent strip */}
          <div className={`h-1.5 bg-gradient-to-r ${tierCfg.gradient}`} />

          <div className="p-5">
            {/* Member info row */}
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tierCfg.gradient} flex items-center justify-center text-white font-extrabold text-[18px] shrink-0`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-extrabold text-on-surface font-display truncate">{data.member_name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {data.membership_type_name && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tierCfg.badge}`}>
                      {data.membership_type_name}
                    </span>
                  )}
                  {tierData?.tier_name && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tierCfg.badge}`}>
                      {tierData.tier_name} Tier
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Member Code</p>
                <p className="font-mono font-bold text-[14px] text-on-surface">#{data.member_code}</p>
              </div>
            </div>

            {/* Points — HERO metric */}
            <div className="bg-gradient-to-br from-accent/[0.06] to-accent/[0.02] rounded-xl p-4 mb-4 border border-accent/10">
              <p className="text-[11px] font-bold text-accent/70 uppercase tracking-widest mb-1">Loyalty Points Balance</p>
              <div className="flex items-end gap-2">
                <span className="text-[42px] font-extrabold text-accent tabular-nums font-display leading-none">
                  {dataReady ? points.toLocaleString() : '—'}
                </span>
                <span className="text-[14px] text-accent/60 font-semibold pb-1.5">pts</span>
              </div>
              {currentStreak >= 2 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[16px]">🔥</span>
                  <span className="text-[12px] font-bold text-tertiary">{currentStreak}-week visit streak! Keep it up.</span>
                </div>
              )}

              {/* Tier progress */}
              {ptsToNext != null && totalForNext != null && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-on-surface-variant">
                    <span className="font-semibold">{data.loyalty_points.toLocaleString()} pts</span>
                    <span>{ptsToNext} more to next tier</span>
                  </div>
                  <div className="h-2 bg-outline-variant/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (data.loyalty_points / totalForNext) * 100)}%`, background: tierCfg.progress }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-container-low rounded-xl p-3 text-center">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wide mb-1">Total Visits</p>
                <p className="text-[22px] font-extrabold text-on-surface font-display">{data.total_visits || 0}</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${isExpired ? 'bg-error-container/30' : 'bg-surface-container-low'}`}>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wide mb-1">Valid Till</p>
                <p className={`text-[15px] font-extrabold font-display ${isExpired ? 'text-error' : 'text-on-surface'}`}>
                  {data.expiry_date ? format(new Date(data.expiry_date), 'MMM yyyy') : '—'}
                </p>
              </div>
            </div>

            {/* Google Wallet */}
            {!isExpired && (
              <div className="border-t border-outline-variant/20 pt-4">
                {walletUrl ? (
                  <a href={walletUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <button className="w-full py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 bg-[#4285F4] hover:bg-[#1a73e8] text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">add_to_wallet</span>
                      Open in Google Wallet
                    </button>
                  </a>
                ) : (
                  <button
                    onClick={async () => {
                      if (!token) return;
                      setWalletLoading(true);
                      try {
                        const res = await api.getPublicWalletPassUrl(token);
                        setWalletUrl(res.save_url);
                        window.open(res.save_url, '_blank', 'noopener,noreferrer');
                      } catch {
                        // silent
                      } finally {
                        setWalletLoading(false);
                      }
                    }}
                    disabled={walletLoading}
                    className="w-full py-3 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 bg-[#4285F4] hover:bg-[#1a73e8] text-white transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {walletLoading ? 'progress_activity' : 'add_to_wallet'}
                    </span>
                    {walletLoading ? 'Generating pass…' : 'Add to Google Wallet'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Show at Counter CTA ─────────────────────────────────────── */}
        {isActive && (
          <div className="bg-gradient-to-br from-accent/[0.08] to-accent/[0.03] border border-accent/15 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-accent text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-on-surface text-[13px]">How to redeem your benefits?</p>
              <p className="text-[12px] text-on-surface-variant mt-0.5">Show this page or give your phone number at the counter. Staff will apply your offers instantly.</p>
            </div>
          </div>
        )}

        {/* ── Scratch Cards ────────────────────────────────────────────── */}
        {hasScratchCards && !isExpired && (
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>featured_seasonal_and_gifts</span>
              <h3 className="font-bold text-on-surface text-[14px]">Scratch Cards</h3>
              <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent text-white">
                {(data as any).scratch_cards.filter((c: any) => !c.is_revealed).length} New
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {(data as any).scratch_cards.slice(0, 4).map((card: any) => (
                <ScratchCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        )}

        {/* ── Active Offers / Benefits ─────────────────────────────────── */}
        {hasOffers && !isExpired && (
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_offer</span>
              <h3 className="font-bold text-on-surface text-[14px]">Your Benefits ({data.offers.length})</h3>
            </div>
            <div className="p-4 space-y-3">
              {data.offers.map((offer: any, idx: number) => {
                const clr = OFFER_COLORS[idx % OFFER_COLORS.length];
                return (
                  <div key={offer.id} className={`flex items-start gap-3 p-3 rounded-xl border ${clr.bg} ${clr.border}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${clr.bg}`}>
                      <span className={`material-symbols-outlined text-[20px] ${clr.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {OFFER_ICONS[offer.offer_type] || 'star'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface text-[13px]">{offer.title}</p>
                      {offer.description && <p className="text-[12px] text-on-surface-variant mt-0.5 leading-relaxed">{offer.description}</p>}
                      {offer.loyalty_points_earn && (
                        <p className="text-[11px] font-bold text-secondary mt-1">+{offer.loyalty_points_earn} pts per redemption</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Coupon Codes ─────────────────────────────────────────────── */}
        {hasCoupons && !isExpired && (
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
              <h3 className="font-bold text-on-surface text-[14px]">Coupon Codes</h3>
            </div>
            <div className="p-4 space-y-3">
              {data.coupons.map((coupon: any) => (
                <div key={coupon.id} className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-extrabold text-[15px] text-on-surface tracking-widest bg-white px-2.5 py-1 rounded-lg border border-outline-variant/40">
                      {coupon.code}
                    </span>
                    <span className="font-bold text-accent text-[14px]">
                      {coupon.discount_type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-on-surface-variant">Min. purchase ₹{coupon.min_purchase || 0}</span>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className={`flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                        copiedCode === coupon.code
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-accent/[0.08] text-accent hover:bg-accent/15'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedCode === coupon.code ? 'check' : 'content_copy'}
                      </span>
                      {copiedCode === coupon.code ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rewards Catalog ──────────────────────────────────────────── */}
        {hasRewards && !isExpired && (
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1", color: '#F59E0B' }}>stars</span>
              <h3 className="font-bold text-on-surface text-[14px]">Redeem with Points</h3>
              <span className="ml-auto text-[11px] text-on-surface-variant">{points.toLocaleString()} pts available</span>
            </div>
            <div className="p-4 space-y-3">
              {data.rewards.map((reward: any) => {
                const canClaim = data.loyalty_points >= reward.points_cost;
                return (
                  <div key={reward.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                    canClaim ? 'bg-secondary/[0.04] border-secondary/15' : 'bg-surface-container-low border-outline-variant/30'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface text-[13px]">{reward.name}</p>
                      {reward.description && <p className="text-[12px] text-on-surface-variant">{reward.description}</p>}
                      <p className={`text-[12px] font-bold mt-1 ${canClaim ? 'text-secondary' : 'text-on-surface-variant'}`}>
                        ⭐ {reward.points_cost} pts required
                        {canClaim && <span className="ml-1 text-secondary"> · You qualify!</span>}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl shrink-0 ${
                      canClaim
                        ? 'bg-secondary text-white'
                        : 'bg-surface-container text-on-surface-variant border border-outline-variant/40'
                    }`}>
                      {canClaim ? 'Claim Now' : 'Locked'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Challenges ───────────────────────────────────────────────── */}
        {hasChallenges && !isExpired && (
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              <h3 className="font-bold text-on-surface text-[14px]">Active Challenges</h3>
            </div>
            <div className="p-4 space-y-3">
              {challenges.map((ch: any) => (
                <div key={ch.challenge_id} className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-on-surface text-[13px]">{ch.challenge_title}</p>
                    {ch.is_completed ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">✓ Done</span>
                    ) : (
                      <span className="text-[11px] font-bold text-on-surface-variant">{ch.current_value}/{ch.target_value}</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (ch.current_value / ch.target_value) * 100)}%`,
                        background: ch.is_completed ? '#00D4AA' : '#FF6B35',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Lucky Draws ──────────────────────────────────────────────── */}
        {hasDraws && !isExpired && (
          <div className="bg-white rounded-2xl shadow-card border border-outline-variant/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
              <span className="text-[18px]">🎰</span>
              <h3 className="font-bold text-on-surface text-[14px]">Lucky Draws</h3>
            </div>
            <div className="p-4 space-y-3">
              {(data as any).open_lucky_draws.map((draw: any) => (
                <div key={draw.id} className="bg-gradient-to-r from-tertiary/[0.05] to-amber-50/50 rounded-xl p-4 border border-tertiary/10 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-[13px]">{draw.name}</p>
                    <p className="text-[12px] font-semibold text-tertiary mt-0.5">🏆 {draw.prize}</p>
                    {draw.draw_date && <p className="text-[11px] text-on-surface-variant mt-1">Draw date: {draw.draw_date}</p>}
                  </div>
                  <div className="shrink-0">
                    {draw.already_entered ? (
                      <span className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-secondary/10 text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Entered
                      </span>
                    ) : draw.eligible ? (
                      <button
                        onClick={() => enterDraw(draw.id)}
                        disabled={drawEntering === draw.id}
                        className="text-[12px] font-bold text-white bg-gradient-to-r from-tertiary to-amber-500 px-3 py-1.5 rounded-xl disabled:opacity-50"
                      >
                        {drawEntering === draw.id ? 'Entering…' : 'Enter Now'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-on-surface-variant/60 bg-surface-container px-2.5 py-1.5 rounded-xl">
                        {draw.min_points > 0 ? `${draw.min_points} pts needed` : `${draw.min_visits} visits needed`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Referral ─────────────────────────────────────────────────── */}
        {data.referral_code && (
          <div className="bg-gradient-to-br from-accent/[0.07] to-accent/[0.02] rounded-2xl p-4 border border-accent/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                <p className="font-bold text-on-surface text-[14px]">Invite Friends & Earn</p>
              </div>
              <span className="font-mono font-extrabold text-[15px] text-accent bg-accent/[0.08] px-3 py-1 rounded-lg border border-accent/15 tracking-widest">
                {data.referral_code}
              </span>
            </div>
            <p className="text-[12px] text-on-surface-variant">
              Both you and your friend earn bonus loyalty points when they join using your code!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => copyCode(data.referral_code)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-accent border border-accent/20 bg-white hover:bg-accent/[0.05] transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                {copiedCode === data.referral_code ? 'Copied!' : 'Copy Code'}
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join ${data.merchant_name} loyalty program! Use my code ${data.referral_code}: ${window.location.origin}/m/${data.public_token}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white bg-[#25D366] hover:bg-[#1da852] transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* ── Feedback ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-card border border-outline-variant/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1", color: '#EAB308' }}>star</span>
            <h3 className="font-bold text-on-surface text-[14px]">Rate Your Experience</h3>
            {!feedbackSubmitted && (
              <span className="ml-auto text-[11px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">+10 pts</span>
            )}
          </div>
          <div className="p-4">
            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <div className="text-4xl">🙏</div>
                <p className="font-bold text-on-surface">Thank you for your feedback!</p>
                <p className="text-[13px] text-on-surface-variant">Your response helps us improve.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="hover:scale-125 active:scale-110 transition-transform p-1"
                      style={{ color: '#EAB308' }}
                    >
                      <span
                        className="material-symbols-outlined text-[36px]"
                        style={{ fontVariationSettings: `'FILL' ${(hoverRating || rating) >= star ? 1 : 0}` }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Tell us what you loved or how we can improve…"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-container-low text-on-surface placeholder-on-surface-variant/50 border border-outline-variant/50 rounded-xl px-4 py-3 text-[13px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 resize-none"
                />
                <button
                  type="submit"
                  disabled={rating === 0 || submittingFeedback}
                  className="w-full py-3 rounded-xl font-bold text-[13px] btn-primary flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {submittingFeedback && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                  {submittingFeedback ? 'Submitting…' : 'Submit Feedback (+10 pts)'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="text-center py-4 space-y-1.5">
          {data.merchant_phone && (
            <p className="text-[13px] text-on-surface-variant">
              Questions?{' '}
              <a href={`tel:${data.merchant_phone}`} className="text-accent font-semibold hover:underline">
                Call {data.merchant_phone}
              </a>
            </p>
          )}
          <p className="text-[11px] text-on-surface-variant/40 flex items-center justify-center gap-1">
            ⚡ Powered by <span className="font-semibold">Metro Cardz</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Scratch Card ─────────────────────────────────────────────────────────────
function ScratchCard({ card }: { card: any }) {
  const [revealed, setRevealed] = useState(card.is_revealed);
  const [revealing, setRevealing] = useState(false);

  const handleReveal = async () => {
    if (revealed || revealing) return;
    setRevealing(true);
    try {
      await api.revealScratchCard(card.id);
      setRevealed(true);
    } catch {
      // silent
    } finally {
      setRevealing(false);
    }
  };

  return (
    <div
      onClick={handleReveal}
      className={`relative overflow-hidden rounded-2xl border-2 p-4 text-center cursor-pointer select-none transition-all duration-500 ${
        revealed
          ? 'border-tertiary/30 bg-gradient-to-br from-tertiary/[0.06] to-amber-50/60'
          : 'border-dashed border-outline-variant hover:border-accent/40 bg-surface-container-low'
      }`}
      style={{ minHeight: 90 }}
    >
      {!revealed ? (
        <div className="space-y-1.5">
          <div className="text-3xl">🎴</div>
          <p className="text-[12px] font-bold text-on-surface-variant">
            {revealing ? 'Revealing…' : 'Tap to Reveal!'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="text-3xl">🎉</div>
          <p className="text-[12px] font-bold text-tertiary">
            {card.reward_type === 'points' ? `+${card.reward_value} Points!` : card.reward_value}
          </p>
          <p className="text-[10px] text-on-surface-variant">Added to account</p>
        </div>
      )}
    </div>
  );
}
