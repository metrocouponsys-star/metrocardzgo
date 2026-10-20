import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PublicMemberView } from '../../types';
import * as api from '../../api';
import { safeFormat } from '../../lib/dateUtils';
import { InteractiveFlipCard } from '../../components/cards/InteractiveFlipCard';
import { loadSavedCardDesign } from '../../types/cardDesign';

function formatCardNumber(num?: string | null): string {
  if (!num) return '•••• •••• •••• ••••';
  const clean = num.replace(/[#\s]/g, '').trim();
  if (clean.length === 16) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)} ${clean.slice(12, 16)}`;
  }
  if (clean.length >= 8) {
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  }
  return clean;
}

// ── Offer icons ───────────────────────────────────────────────────────────
const OFFER_ICONS: Record<string, string> = {
  percent_off: 'percent',
  flat_off: 'sell',
  buy_1_get_1: 'card_giftcard',
  free_service: 'spa',
  wallet_points: 'account_balance_wallet',
  cashback: 'account_balance_wallet',
  referral: 'people',
  birthday: 'cake',
  birthday_anniversary: 'cake',
  points_redemption: 'stars',
  visit_milestone: 'workspace_premium',
};

const OFFER_BADGES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  percent_off: { label: 'DISCOUNT', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  flat_off: { label: 'FLAT OFF', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  buy_1_get_1: { label: 'BOGO', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  free_service: { label: 'FREE REWARD', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  wallet_points: { label: 'CASHBACK', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  cashback: { label: 'CASHBACK', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  referral: { label: 'REFERRAL', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  birthday: { label: 'BIRTHDAY', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  birthday_anniversary: { label: 'ANNIVERSARY', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  points_redemption: { label: 'POINTS PASS', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  visit_milestone: { label: 'MILESTONE', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
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

  const merchantDesign = React.useMemo(() => {
    const loaded = loadSavedCardDesign(data?.merchant_id || data?.id || 'mer-001', 'store_loyalty');
    const rawDesign = (data as any)?.card_design_url;
    if (rawDesign) {
      try {
        if (typeof rawDesign === 'string' && rawDesign.trim().startsWith('{')) {
          const parsed = JSON.parse(rawDesign);
          return {
            ...loaded,
            ...parsed,
            brandName: (data.merchant_name || parsed.brandName || loaded.brandName).toUpperCase(),
            customLogoUrl: parsed.customLogoUrl || data.merchant_logo_url || loaded.customLogoUrl,
          };
        } else if (typeof rawDesign === 'string' && rawDesign.trim().length > 0) {
          return {
            ...loaded,
            backgroundImageUrl: rawDesign,
            brandName: (data.merchant_name || loaded.brandName).toUpperCase(),
            customLogoUrl: data.merchant_logo_url || loaded.customLogoUrl,
          };
        }
      } catch {
        return {
          ...loaded,
          backgroundImageUrl: rawDesign,
          brandName: (data.merchant_name || loaded.brandName).toUpperCase(),
        };
      }
    }
    if (data?.merchant_name) {
      loaded.brandName = data.merchant_name.toUpperCase();
    }
    if (data?.merchant_logo_url && !loaded.customLogoUrl) {
      loaded.customLogoUrl = data.merchant_logo_url;
    }
    return loaded;
  }, [data?.merchant_name, data?.merchant_id, data?.id, (data as any)?.card_design_url, data?.merchant_logo_url]);

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

        {/* ── Multi-Store Switcher Banner ── */}
        {data.other_memberships && data.other_memberships.length > 0 && (
          <div className="p-3 bg-white border border-slate-200 rounded-2xl text-left space-y-2 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-amber-600">storefront</span>
              Switch to your other store memberships:
            </p>
            <div className="space-y-1.5">
              {data.other_memberships.map((other: any) => (
                <a
                  key={other.member_id}
                  href={`/check-membership`}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-400 flex items-center justify-between transition-all group shadow-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-700">{other.merchant_name}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className="font-semibold">{other.membership_type_name}</span>
                      <span>·</span>
                      {other.physical_card_number && (
                        <>
                          <span className="font-mono text-slate-700">{formatCardNumber(other.physical_card_number)}</span>
                          <span>·</span>
                        </>
                      )}
                      <span className="text-amber-700 font-bold">★ {other.loyalty_points} pts</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-700 font-bold text-xs shrink-0 bg-amber-100/70 group-hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors">
                    <span>View Pass</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

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

        {/* ── 3D Interactive Flippable Physical Card Pass ── */}
        <div className="space-y-2">
          <InteractiveFlipCard
            key={`${data.member_id}-${data.merchant_id || ''}-${data.physical_card_number || data.member_code}`}
            design={merchantDesign}
            memberName={data.member_name}
            cardNumber={formatCardNumber(data.physical_card_number || data.member_code)}
            validThru={safeFormat(data.expiry_date, 'MM/yy', '12/28')}
            tier={tierData?.tier_name || data.membership_type_name}
            points={data.loyalty_points}
            qrValue={`https://metrocardz.in/m/${data.member_code}`}
            interactive={true}
          />
          <p className="text-center text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5 pt-1">
            <span className="material-symbols-outlined text-[15px] text-amber-500">touch_app</span>
            Tap card to flip 3D · View scannable Barcode & QR Code
          </p>
        </div>

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
                  {safeFormat(data.expiry_date, 'MMM yyyy', '—')}
                </p>
              </div>
            </div>

            {/* Formatted Membership Card Number */}
            <div className="bg-slate-950 rounded-xl p-3.5 text-slate-100 flex items-center justify-between text-xs font-mono font-bold tracking-widest shadow-inner border border-slate-800 mb-4">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="material-symbols-outlined text-[16px]">credit_card</span>
                Card Number
              </span>
              <span className="text-white tracking-widest font-mono text-xs sm:text-sm">
                {data.physical_card_number || `MC-CARD-${data.member_code}`}
              </span>
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
                const hasQty = offer.remaining_qty !== null && offer.remaining_qty !== undefined;
                const remainingVal = hasQty ? Number(offer.remaining_qty) : null;
                const initialVal = offer.initial_qty !== null && offer.initial_qty !== undefined
                  ? Number(offer.initial_qty)
                  : (remainingVal !== null ? Math.max(remainingVal, 1) : null);
                const isExhausted = hasQty && (remainingVal !== null && remainingVal <= 0);
                const percentLeft = (hasQty && initialVal && initialVal > 0 && remainingVal !== null)
                  ? Math.min(100, Math.max(0, (remainingVal / initialVal) * 100))
                  : null;
                const badge = OFFER_BADGES[offer.offer_type] || { label: 'OFFER', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };

                return (
                  <div
                    key={offer.id || idx}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isExhausted
                        ? 'bg-slate-100/70 border-slate-200 opacity-70'
                        : `${clr.bg} ${clr.border} shadow-xs`
                    }`}
                  >
                    {/* Offer Image Header when present */}
                    {offer.image_url && (
                      <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={offer.image_url}
                          alt={offer.title}
                          className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${isExhausted ? 'grayscale' : ''}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                        <div className="absolute top-2.5 right-2.5">
                          <span className={`text-[9px] uppercase font-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </div>
                        {hasQty && (
                          <div className="absolute bottom-2.5 left-2.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md text-white ${isExhausted ? 'bg-slate-900/70' : 'bg-amber-600/90'}`}>
                              {isExhausted ? 'Redeemed' : `${remainingVal}/${initialVal} left`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {!offer.image_url && (
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                isExhausted
                                  ? 'bg-slate-200 border-slate-300 text-slate-500'
                                  : 'bg-white border-outline-variant/30 text-amber-800 shadow-2xs'
                              }`}
                            >
                              <span className={`material-symbols-outlined text-[20px] ${isExhausted ? 'text-slate-500' : clr.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                {OFFER_ICONS[offer.offer_type] || 'star'}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {!offer.image_url && (
                                <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                  {badge.label}
                                </span>
                              )}
                              {isExhausted && (
                                <span className="text-[9px] uppercase font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">cancel</span>
                                  Fully Redeemed
                                </span>
                              )}
                            </div>
                            <p className={`font-bold text-[14px] mt-1 leading-snug ${isExhausted ? 'text-slate-500 line-through' : 'text-on-surface'}`}>
                              {offer.title}
                            </p>
                            {offer.description && (
                              <p className="text-[12px] text-on-surface-variant mt-0.5 leading-relaxed">{offer.description}</p>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                              {offer.points_cost > 0 && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                  {offer.points_cost} pts to redeem
                                </span>
                              )}
                              {offer.loyalty_points_earn > 0 && (
                                <span className="text-[10px] font-bold text-secondary bg-secondary/[0.08] px-2 py-0.5 rounded-md border border-secondary/20 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[11px]">add_circle</span>
                                  +{offer.loyalty_points_earn} pts earn
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quota Badge (mirrors merchant dashboard: 4/10 left) */}
                        {!offer.image_url && (
                          hasQty ? (
                            <div className="shrink-0 text-right">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full shadow-2xs border ${
                                  isExhausted
                                    ? 'bg-slate-200 text-slate-600 border-slate-300'
                                    : 'bg-primary text-on-primary border-primary-dark'
                                }`}
                                style={!isExhausted ? { background: '#D97706', color: '#FFFFFF', borderColor: '#B45309' } : undefined}
                              >
                                <span className="material-symbols-outlined text-[13px]">confirmation_number</span>
                                {remainingVal}/{initialVal} left
                              </span>
                            </div>
                          ) : (
                            <div className="shrink-0 text-right">
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="material-symbols-outlined text-[13px]">all_inclusive</span>
                                Unlimited
                              </span>
                            </div>
                          )
                        )}
                      </div>

                    {/* Visual Progress Bar (remaining vs initial quantity) */}
                    {hasQty && initialVal !== null && initialVal > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-black/[0.06] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-on-surface-variant font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-on-surface-variant/70">tune</span>
                            Remaining Benefit Quota
                          </span>
                          <span className={`font-bold ${isExhausted ? 'text-slate-400' : 'text-amber-800'}`}>
                            {isExhausted ? '0 uses remaining' : `${remainingVal} of ${initialVal} uses remaining`}
                          </span>
                        </div>
                        <div className="w-full bg-black/[0.06] h-2 rounded-full overflow-hidden border border-black/[0.04] p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              isExhausted
                                ? 'bg-slate-300'
                                : percentLeft !== null && percentLeft > 50
                                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                : percentLeft !== null && percentLeft > 25
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-rose-400 to-rose-500'
                            }`}
                            style={{ width: `${percentLeft ?? 0}%` }}
                          />
                        </div>
                      </div>
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
