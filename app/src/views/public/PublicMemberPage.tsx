import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PublicMemberView } from '../../types';
import * as api from '../../api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';

// ── Tier configuration ─────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { color: string; bg: string; icon: string; glow: string; gradient: string }> = {
  bronze: {
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: '🥉',
    glow: 'shadow-amber-200/50',
    gradient: 'from-amber-600 via-amber-500 to-amber-700',
  },
  silver: {
    color: 'text-slate-600',
    bg: 'bg-slate-50 border-slate-200',
    icon: '🥈',
    glow: 'shadow-slate-300/60',
    gradient: 'from-slate-500 via-slate-400 to-slate-600',
  },
  gold: {
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
    icon: '🥇',
    glow: 'shadow-yellow-300/70',
    gradient: 'from-yellow-500 via-yellow-400 to-amber-500',
  },
  platinum: {
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    icon: '💎',
    glow: 'shadow-purple-300/70',
    gradient: 'from-purple-600 via-violet-500 to-purple-700',
  },
};

const OFFER_ICONS: Record<string, string> = {
  percent_off: 'percent',
  free_service: 'spa',
  wallet_points: 'account_balance_wallet',
  referral: 'people',
  birthday: 'cake',
  points_redemption: 'stars',
  visit_milestone: 'workspace_premium',
};

const CATEGORY_IMGS: Record<string, string> = {
  'food': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'water': 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400&q=80',
  'gaming': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80',
  'resort': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
  'entertainment': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80',
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

// ── Skeleton ──────────────────────────────────────────────────────────────
function PublicSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      <div className="h-56 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      </div>
      <div className="max-w-md mx-auto px-4 -mt-10 pb-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-5 animate-pulse h-28" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
  );
}

// ── Tier Badge ─────────────────────────────────────────────────────────────
function TierBadge({ tier, nextPts }: { tier: string; nextPts?: number }) {
  const cfg = TIER_CONFIG[tier?.toLowerCase()] || TIER_CONFIG.bronze;
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color}`}>
      <span>{cfg.icon}</span>
      <span>{tier || 'Bronze'} Member</span>
      {nextPts != null && nextPts > 0 && (
        <span className="opacity-60 font-normal">· {nextPts} pts to next</span>
      )}
    </div>
  );
}

// ── Streak Badge ───────────────────────────────────────────────────────────
function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold animate-pulse">
      🔥 {streak}-week streak!
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = '#6366f1' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / (max || 1)) * 100);
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ── Scratch Card Component ─────────────────────────────────────────────────
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
      alert('Failed to reveal scratch card');
    } finally {
      setRevealing(false);
    }
  };

  return (
    <div
      onClick={handleReveal}
      className={`relative overflow-hidden rounded-2xl border-2 p-5 text-center cursor-pointer select-none transition-all duration-500
        ${revealed
          ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50'
          : 'border-dashed border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 hover:border-yellow-300'
        }`}
      style={{ minHeight: 100 }}
    >
      {!revealed ? (
        <div className="space-y-2">
          <div className="text-4xl">🎴</div>
          <p className="text-sm font-bold text-gray-600">
            {revealing ? 'Revealing...' : 'Tap to Scratch & Win!'}
          </p>
          <p className="text-xs text-gray-400">Your reward is hidden inside</p>
        </div>
      ) : (
        <div className="space-y-2 animate-bounce-in">
          <div className="text-4xl">🎉</div>
          <p className="text-sm font-bold text-amber-700">
            {card.reward_type === 'points' ? `+${card.reward_value} Bonus Points!` : card.reward_value}
          </p>
          <p className="text-xs text-amber-500">Credited to your account</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function PublicMemberPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [tierData, setTierData] = useState<any>(null);
  const [streakData, setStreakData] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'offers' | 'rewards' | 'challenges' | 'draws'>('offers');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [walletLoading, setWalletLoading] = useState(false);
  const [walletUrl, setWalletUrl] = useState<string | null>(null);

  const points = useCountUp(data?.loyalty_points ?? 0, 1200, dataReady);

  useEffect(() => {
    if (!token) return;
    api.getPublicMemberView(token).then(d => {
      if (!d) setNotFound(true);
      else {
        setData(d);
        // Load tier + streak in parallel
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-white mb-2">Card Not Recognized</h1>
        <p className="text-white/60 max-w-xs">
          This membership card could not be found. Please check the QR code and try again.
        </p>
      </div>
    );
  }

  const isActive = data.status === 'active';
  const isExpired = data.status === 'expired';
  const tierSlug = tierData?.tier_slug || 'bronze';
  const tierCfg = TIER_CONFIG[tierSlug] || TIER_CONFIG.bronze;
  const currentStreak = streakData?.current_streak || 0;

  // Points progress to next tier
  const ptsToNext = tierData?.next_tier_points_needed;
  const totalForNext = ptsToNext != null ? (data.loyalty_points + ptsToNext) : null;

  const hasOffers = data.offers?.length > 0;
  const hasRewards = data.rewards?.length > 0;
  const hasChallenges = challenges.length > 0;
  const hasDraws = (data as any).open_lucky_draws?.length > 0;
  const hasScratchCards = (data as any).scratch_cards?.length > 0;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #1a1a2e 100%)' }}>

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden px-4 pt-10 pb-24 text-white text-center">
        {/* animated blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #ffd700, transparent)' }} />
        <div className="absolute -bottom-8 -left-16 w-56 h-56 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />

        {/* Merchant logo placeholder */}
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold shadow-2xl border border-white/20"
            style={{ background: `linear-gradient(135deg, ${tierCfg.gradient.includes('yellow') ? '#f59e0b, #d97706' : '#6366f1, #8b5cf6'})` }}>
            {data.merchant_name?.charAt(0) || 'M'}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{data.merchant_name}</h1>
          <p className="text-white/60 text-sm mt-1">Digital Membership</p>

          {/* Tier + Streak badges */}
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            <TierBadge tier={tierData?.tier_name || 'Bronze'} nextPts={ptsToNext} />
            {currentStreak >= 2 && <StreakBadge streak={currentStreak} />}
          </div>
        </div>
      </header>

      {/* ── Content pulled up over header ──────────────────────────────────── */}
      <div className="max-w-md mx-auto px-4 -mt-16 pb-10 space-y-4">

        {/* Expired banner */}
        {isExpired && (
          <div className="bg-red-500/20 backdrop-blur border border-red-400/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-300">Membership Expired</p>
              <p className="text-sm text-red-300/80 mt-0.5">
                Visit {data.merchant_name} to renew your membership and restore your benefits.
              </p>
            </div>
          </div>
        )}

        {/* ── Glassmorphism Member Card ────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          }}>
          {/* Tier accent bar */}
          <div className={`h-1.5 bg-gradient-to-r ${tierCfg.gradient}`} />

          <div className="p-5">
            {/* Member info */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 text-white"
                style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))`, border: '1px solid rgba(255,255,255,0.2)' }}>
                {data.member_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{data.member_name}</h2>
                <p className="text-white/50 text-sm">{data.member_code}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-white/90">
                    {data.membership_type_name}
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      Active
                    </span>
                  ) : (
                    <StatusBadge status={data.status} />
                  )}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="text-xs text-white/50 mb-1">Points</p>
                <p className="text-xl font-extrabold text-white tabular-nums">{dataReady ? points.toLocaleString() : '—'}</p>
                <p className="text-xs text-white/40">pts</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 text-center">
                <p className="text-xs text-white/50 mb-1">Visits</p>
                <p className="text-xl font-extrabold text-white tabular-nums">{data.total_visits || 0}</p>
                <p className="text-xs text-white/40">total</p>
              </div>
              <div className={`rounded-2xl p-3 text-center ${isExpired ? 'bg-red-500/20' : 'bg-white/10'}`}>
                <p className="text-xs text-white/50 mb-1">{isExpired ? 'Expired' : 'Valid'}</p>
                <p className={`text-sm font-bold ${isExpired ? 'text-red-300' : 'text-white'}`}>
                  {format(new Date(data.expiry_date), 'MMM yy')}
                </p>
                <p className="text-xs text-white/40">till</p>
              </div>
            </div>

            {/* Points to next tier progress */}
            {ptsToNext != null && totalForNext != null && (
              <div className="mb-4 space-y-1.5">
                <div className="flex justify-between text-xs text-white/50">
                  <span>{data.loyalty_points} pts</span>
                  <span>{totalForNext} pts to next tier</span>
                </div>
                <ProgressBar value={data.loyalty_points} max={totalForNext} color="#fbbf24" />
              </div>
            )}

            {/* Google Wallet CTA */}
            {!isExpired && (
              <div className="pt-3 border-t border-white/10">
                {walletUrl ? (
                  <a href={walletUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <button className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #4285f4, #1a73e8)', color: 'white' }}>
                      <span className="material-symbols-outlined text-[18px]">add_to_wallet</span>
                      Add to Google Wallet
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
                        alert('Google Wallet pass not available. Please try again later.');
                      } finally {
                        setWalletLoading(false);
                      }
                    }}
                    disabled={walletLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #4285f4, #1a73e8)', color: 'white' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_to_wallet</span>
                    {walletLoading ? 'Generating…' : 'Add to Google Wallet'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Scratch Cards section ──────────────────────────────────────────── */}
        {hasScratchCards && !isExpired && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10">
              <span className="text-xl">🎴</span>
              <h3 className="font-bold text-white text-sm">Scratch Cards</h3>
              <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
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

        {/* ── Tab Navigation ──────────────────────────────────────────────── */}
        {(hasOffers || hasRewards || hasChallenges || hasDraws) && !isExpired && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {hasOffers && (
                <button
                  onClick={() => setActiveTab('offers')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all
                    ${activeTab === 'offers' ? 'bg-white text-slate-900' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}
                >
                  🎁 Benefits ({data.offers.length})
                </button>
              )}
              {hasRewards && (
                <button
                  onClick={() => setActiveTab('rewards')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all
                    ${activeTab === 'rewards' ? 'bg-white text-slate-900' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}
                >
                  ⭐ Rewards
                </button>
              )}
              {hasChallenges && (
                <button
                  onClick={() => setActiveTab('challenges')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all
                    ${activeTab === 'challenges' ? 'bg-white text-slate-900' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}
                >
                  🎯 Challenges
                </button>
              )}
              {hasDraws && (
                <button
                  onClick={() => setActiveTab('draws')}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all
                    ${activeTab === 'draws' ? 'bg-white text-slate-900' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}
                >
                  🎰 Lucky Draws
                </button>
              )}
            </div>

            {/* ── Offers Tab ─────────────────────────────────────────────── */}
            {activeTab === 'offers' && hasOffers && (
              <div className="space-y-3">
                {/* Coupons first */}
                {data.coupons?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider px-1">🎫 Coupon Codes</h4>
                    {data.coupons.map((coupon: any) => (
                      <div key={coupon.id} className="rounded-2xl p-4"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono font-bold text-yellow-300 text-base tracking-widest bg-yellow-300/10 px-3 py-1 rounded-xl border border-yellow-300/20">
                            {coupon.code}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {coupon.discount_type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/40">Min ₹{coupon.min_purchase || 0}</span>
                          <button
                            onClick={() => { navigator.clipboard.writeText(coupon.code); }}
                            className="text-xs font-bold text-yellow-300 flex items-center gap-1 bg-yellow-300/10 px-3 py-1 rounded-lg hover:bg-yellow-300/20 transition"
                          >
                            <span className="material-symbols-outlined text-[14px]">content_copy</span> Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Offer benefits */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider px-1">✨ Your Benefits</h4>
                  {data.offers.map((offer: any, idx: number) => (
                    <div
                      key={offer.id}
                      className="flex items-start gap-4 rounded-2xl p-4 transition hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl"
                        style={{ background: 'rgba(255,255,255,0.12)' }}>
                        <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {OFFER_ICONS[offer.offer_type] || 'star'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm">{offer.title}</p>
                        <p className="text-sm text-white/50 mt-0.5 leading-relaxed">{offer.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Rewards Tab ────────────────────────────────────────────── */}
            {activeTab === 'rewards' && hasRewards && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider px-1">🛍️ Redeem with Points</h4>
                {data.rewards.map((reward: any) => (
                  <div key={reward.id} className="rounded-2xl p-4 flex items-center justify-between gap-3"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm">{reward.name}</h4>
                      {reward.description && <p className="text-xs text-white/50 mt-0.5">{reward.description}</p>}
                      <p className="text-xs font-bold text-yellow-400 mt-1 flex items-center gap-1">
                        ⭐ {reward.points_cost} pts required
                        {data.loyalty_points >= reward.points_cost && (
                          <span className="text-emerald-400 ml-1">✓ You qualify!</span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className={`text-xs px-3 py-1.5 rounded-xl font-bold block text-center
                        ${data.loyalty_points >= reward.points_cost
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-white/10 text-white/40 border border-white/10'
                        }`}>
                        Claim at Counter
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Challenges Tab ─────────────────────────────────────────── */}
            {activeTab === 'challenges' && hasChallenges && (
              <div className="space-y-3">
                {challenges.map((ch: any) => (
                  <div key={ch.challenge_id} className="rounded-2xl p-4 space-y-3"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{ch.challenge_title}</h4>
                        <p className="text-xs text-white/50 mt-0.5">
                          {ch.current_value}/{ch.target_value} completed
                        </p>
                      </div>
                      {ch.is_completed ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">✓ Done</span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-300 font-bold">
                          {Math.round(ch.progress_pct)}%
                        </span>
                      )}
                    </div>
                    <ProgressBar value={ch.current_value} max={ch.target_value} color={ch.is_completed ? '#10b981' : '#f59e0b'} />
                  </div>
                ))}
              </div>
            )}

            {/* ── Lucky Draws Tab ────────────────────────────────────────── */}
            {activeTab === 'draws' && hasDraws && (
              <div className="space-y-3">
                {(data as any).open_lucky_draws.map((draw: any) => (
                  <div key={draw.id} className="rounded-2xl p-4"
                    style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white">{draw.name}</h4>
                        <p className="text-sm text-yellow-300 font-medium mt-0.5">🏆 Prize: {draw.prize}</p>
                        {draw.draw_date && <p className="text-xs text-white/40 mt-1">Draw: {draw.draw_date}</p>}
                      </div>
                      <div className="shrink-0">
                        {draw.already_entered ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1.5 rounded-full">
                            ✓ Entered
                          </span>
                        ) : draw.eligible ? (
                          <button
                            onClick={async () => {
                              try {
                                await api.publicEnterLuckyDraw(draw.id, token || '');
                                alert('🎉 Successfully entered the Lucky Draw!');
                                window.location.reload();
                              } catch (e: any) {
                                alert(e.message || 'Failed to enter draw');
                              }
                            }}
                            className="text-xs font-bold text-white px-4 py-1.5 rounded-full"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                          >
                            Enter Now
                          </button>
                        ) : (
                          <span className="text-xs text-white/30 bg-white/5 px-2.5 py-1.5 rounded-lg">
                            {draw.min_points > 0 ? `${draw.min_points} pts needed` : `${draw.min_visits} visits needed`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Referral Box ─────────────────────────────────────────────────── */}
        {data.referral_code && (
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.15))', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-yellow-300">👥 Invite Friends</span>
              <span className="font-mono font-bold text-lg text-yellow-300 bg-yellow-300/10 px-3 py-1 rounded-lg tracking-widest border border-yellow-300/20">
                {data.referral_code}
              </span>
            </div>
            <p className="text-xs text-white/60">Both you and your friend earn bonus loyalty points when they join!</p>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join ${data.merchant_name} membership using my invite code ${data.referral_code}: ${window.location.origin}/m/${data.public_token}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition"
              style={{ background: '#25D366', color: 'white' }}
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Share on WhatsApp
            </a>
          </div>
        )}

        {/* ── How to Redeem ─────────────────────────────────────────────── */}
        {!isExpired && (
          <div className="rounded-2xl p-4 space-y-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">help_outline</span>
              How to Redeem
            </h4>
            <ul className="text-xs text-white/40 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong className="text-white/60">Coupon Codes:</strong> Copy code or mention at checkout for instant discount.</li>
              <li><strong className="text-white/60">Points & Rewards:</strong> Show your QR / Phone Number at counter. Staff will apply instantly.</li>
              <li><strong className="text-white/60">WhatsApp Alerts:</strong> Exclusive offers sent directly to your registered WhatsApp.</li>
            </ul>
          </div>
        )}

        {/* ── Feedback ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <h3 className="font-bold text-white text-sm">Rate Your Experience</h3>
            {!feedbackSubmitted && <span className="ml-auto text-xs text-yellow-300 font-semibold">+10 pts for review</span>}
          </div>
          <div className="p-4">
            {feedbackSubmitted ? (
              <div className="text-center py-4 space-y-2">
                <div className="text-4xl">🙏</div>
                <p className="font-bold text-white">Thank you!</p>
                <p className="text-sm text-white/50">Your feedback helps us improve.</p>
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
                      className="text-yellow-400 hover:scale-125 active:scale-110 transition-transform p-1"
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
                  placeholder="Tell us what you liked or how we can improve..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 resize-none"
                />
                <button
                  type="submit"
                  disabled={rating === 0 || submittingFeedback}
                  className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 transition"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}
                >
                  {submittingFeedback ? 'Submitting…' : 'Submit Feedback (+10 pts)'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="text-center py-4 space-y-1">
          {data.merchant_phone && (
            <p className="text-sm text-white/40">
              Questions? Call{' '}
              <a href={`tel:${data.merchant_phone}`} className="text-white/70 font-semibold hover:text-white">
                {data.merchant_phone}
              </a>
            </p>
          )}
          <p className="text-xs text-white/20 flex items-center justify-center gap-1">
            ⚡ Powered by Metro Cardz
          </p>
        </div>
      </div>
    </div>
  );
}
