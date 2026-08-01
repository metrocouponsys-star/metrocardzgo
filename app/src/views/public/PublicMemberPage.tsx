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

// ── Premium Skeleton Loader ────────────────────────────────────────────────
function PublicSkeleton() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="h-40 bg-[#B8941F] relative overflow-hidden">
        <div className="absolute inset-0 skeleton opacity-20" />
        <div className="flex flex-col items-center justify-center h-full gap-3 relative z-10">
          <div className="w-16 h-16 rounded-2xl skeleton" />
          <div className="w-32 h-5 rounded-full skeleton" />
          <div className="w-20 h-3 rounded-full skeleton opacity-60" />
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#F3F4F6] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded skeleton" />
              <div className="h-3 w-1/2 rounded skeleton" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-xl skeleton" />
            <div className="h-20 rounded-xl skeleton" />
          </div>
          <div className="h-11 rounded-xl skeleton" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-28 rounded skeleton" />
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5E7EB]/20 flex items-start gap-3" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-10 h-10 rounded-lg skeleton shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded skeleton" />
                <div className="h-3 w-full rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PublicMemberPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dataReady, setDataReady] = useState(false);

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
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center mb-5 border border-red-200">
          <span className="material-symbols-outlined text-red-700 text-[44px]">credit_card_off</span>
        </div>
        <h1 className="text-xl font-headline-md text-[#111111] mb-2">Card Not Recognized</h1>
        <p className="text-sm text-[#6B7280] max-w-xs">
          This membership card could not be found. Please check the QR code and try again.
        </p>
      </div>
    );
  }

  const isActive = data.status === 'active';
  const isExpired = data.status === 'expired';

  return (
    <div className="min-h-screen bg-[#F9FAFB]">

      {/* ── Hero Header ─── */}
      <header className="hero-shimmer px-4 pt-8 pb-16 text-white text-center relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-4 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 card-shine backdrop-blur-sm border border-white/20">
            <span className="material-symbols-outlined text-white text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{data.merchant_name}</h1>
          <p className="text-sm opacity-70 mt-0.5">Loyalty Membership</p>
        </div>
      </header>

      {/* ── Card content — pulled up over the header ─── */}
      <div className="max-w-md mx-auto px-4 -mt-10 pb-8 space-y-4">

        {/* Expired banner */}
        {isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-slide-up">
            <span className="material-symbols-outlined text-red-700 text-[22px] shrink-0">warning</span>
            <div>
              <p className="font-bold text-red-700">Membership Expired</p>
              <p className="text-sm text-red-700/80 mt-0.5">
                Visit {data.merchant_name} to renew your membership and restore your benefits.
              </p>
            </div>
          </div>
        )}

        {/* ── Member identity card ─── */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#F3F4F6] overflow-hidden animate-slide-up card-hover-glow">
          <div className="h-1.5 hero-shimmer" />
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-[#B8941F] flex items-center justify-center text-white font-bold text-xl shrink-0">
                {data.member_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-[#111111] truncate">{data.member_name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#B8941F] text-white">
                    {data.membership_type_name}
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[#6B7280]">
                      <span className="w-2 h-2 rounded-full bg-[#6B7280] pulse-dot" />
                      Active
                    </span>
                  ) : (
                    <StatusBadge status={data.status} />
                  )}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F5EDD0] rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Loyalty Points</p>
                <p className="text-2xl font-bold text-[#7A5C12] tabular-nums">
                  {dataReady ? points.toLocaleString() : '—'}
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">pts</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${isExpired ? 'bg-red-50' : 'bg-[#F3F4F6]'}`}>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                  {isExpired ? 'Expired On' : 'Valid Until'}
                </p>
                <p className={`text-lg font-bold ${isExpired ? 'text-red-700' : 'text-[#111111]'}`}>
                  {format(new Date(data.expiry_date), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Google Wallet CTA */}
            {!isExpired && (
              <div className="mt-4 pt-4 border-t border-[#E5E7EB]/20">
                {walletUrl ? (
                  <a href={walletUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full">
                    <Button variant="filled" className="w-full py-3" icon="add_to_wallet">
                      Add to Google Wallet
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="filled"
                    loading={walletLoading}
                    icon="add_to_wallet"
                    className="w-full py-3"
                    onClick={async () => {
                      if (!token) return;
                      setWalletLoading(true);
                      try {
                        const res = await api.getPublicWalletPassUrl(token);
                        setWalletUrl(res.save_url);
                        window.open(res.save_url, '_blank', 'noopener,noreferrer');
                      } catch {
                        alert('Failed to generate Google Wallet pass. Please try again later.');
                      } finally {
                        setWalletLoading(false);
                      }
                    }}
                  >
                    {walletLoading ? 'Generating…' : 'Add to Google Wallet'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Offers / Benefits ─── */}
        {data.offers.length > 0 && !isExpired && (
          <div className="animate-slide-up" style={{ animationDelay: '80ms' }}>
            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#B8941F]">workspace_premium</span>
              Your Tier Benefits
            </h3>
            <div className="space-y-3 stagger-children">
              {data.offers.map((offer: any, idx: number) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-2xl p-4 flex items-start gap-4 border border-[#E5E7EB]/20 shadow-sm animate-slide-up card-hover-glow"
                  style={{ animationDelay: `${idx * 60 + 120}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#F5EDD0] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#7A5C12] text-[20px]">
                      {OFFER_ICONS[offer.offer_type] || 'star'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#111111] text-sm">{offer.title}</p>
                    <p className="text-sm text-[#6B7280] mt-0.5 leading-relaxed">{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Coupons & Discount Vouchers ─── */}
        {data.coupons && data.coupons.length > 0 && !isExpired && (
          <div className="animate-slide-up space-y-3" style={{ animationDelay: '100ms' }}>
            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#6B7280]">confirmation_number</span>
              Coupons & Discount Vouchers
            </h3>
            <div className="space-y-3">
              {data.coupons.map((coupon: any) => (
                <div key={coupon.id} className="bg-white rounded-2xl p-4 border border-[#6B7280]-container/40 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#6B7280] text-base tracking-widest bg-[#F3F4F6]/30 px-3 py-1 rounded-xl border border-[#6B7280]/20">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          alert(`Code "${coupon.code}" copied! Show this code at POS checkout.`);
                        }}
                        className="text-xs text-[#B8941F] font-bold hover:underline flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span> Copy Code
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#111111]">
                      {coupon.discount_type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-[#6B7280] gap-2 pt-1 border-t border-[#E5E7EB]/20">
                    <span>Min purchase: ₹{coupon.min_purchase || 0}</span>
                    {coupon.active_days && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#B8941F]">
                        <span className="material-symbols-outlined text-[12px]">repeat</span> Active: {coupon.active_days}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rewards Catalog & Gift Vouchers ─── */}
        {data.rewards && data.rewards.length > 0 && !isExpired && (
          <div className="animate-slide-up space-y-3" style={{ animationDelay: '120ms' }}>
            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-600">card_giftcard</span>
              Rewards & Gift Vouchers Catalog
            </h3>
            <div className="space-y-3">
              {data.rewards.map((reward: any) => (
                <div key={reward.id} className="bg-white rounded-2xl p-4 border border-[#E5E7EB]/20 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#111111] text-sm">{reward.name}</h4>
                    {reward.description && <p className="text-xs text-[#6B7280] mt-0.5">{reward.description}</p>}
                    <p className="text-xs font-bold text-amber-700 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">stars</span>
                      {reward.points_cost} points required
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 font-bold block">
                      Claim at Counter
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── How to Redeem Info Guide ─── */}
        {!isExpired && (
          <div className="bg-[#F3F4F6] rounded-2xl p-4 border border-[#F3F4F6] space-y-2 animate-slide-up" style={{ animationDelay: '140ms' }}>
            <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#B8941F] text-[16px]">help_outline</span>
              How to Redeem Offers & Rewards
            </h4>
            <ul className="text-xs text-[#6B7280] space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Coupon Codes:</strong> Copy code or mention it at checkout to get instant discounts.</li>
              <li><strong>Loyalty Points & Rewards:</strong> Show your member QR / Mobile Number at store counter. The cashier will apply your points & vouchers instantly.</li>
              <li><strong>WhatsApp Alerts:</strong> Exclusive offers & vouchers are sent directly to your registered WhatsApp number.</li>
            </ul>
          </div>
        )}

        {/* ── Referral Box ─── */}
        {data.referral_code && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-md space-y-2 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider opacity-90">Your Invite Code</span>
              <span className="font-mono font-bold text-lg bg-black/20 px-3 py-1 rounded-lg tracking-widest">{data.referral_code}</span>
            </div>
            <p className="text-xs opacity-90">Share with friends to earn bonus loyalty points on your next visit!</p>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join ${data.merchant_name} membership using my invite code ${data.referral_code}: ${window.location.origin}/m/${data.public_token}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-amber-700 hover:bg-amber-50 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              Share on WhatsApp
            </a>
          </div>
        )}

        {/* ── Open Lucky Draws Section ─── */}
        {(data as any).open_lucky_draws && (data as any).open_lucky_draws.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200/60 shadow-sm overflow-hidden animate-slide-up bg-gradient-to-br from-amber-50/50 to-orange-50/30">
            <div className="px-5 py-4 border-b border-amber-200/40 flex items-center justify-between">
              <h3 className="font-bold text-[#111111] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                Active Lucky Draws
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Enter to Win</span>
            </div>
            <div className="p-4 space-y-3">
              {(data as any).open_lucky_draws.map((draw: any) => (
                <div key={draw.id} className="bg-white p-4 rounded-xl border border-amber-200/40 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-[#111111]">{draw.name}</h4>
                    <p className="text-sm text-amber-800 font-medium">Prize: {draw.prize}</p>
                    {draw.draw_date && <p className="text-xs text-[#6B7280] mt-0.5">Draw Date: {draw.draw_date}</p>}
                  </div>
                  <div>
                    {draw.already_entered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span> Entered
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
                        className="btn-primary text-xs px-3.5 py-1.5 font-bold shadow-sm"
                      >
                        Enter Draw
                      </button>
                    ) : (
                      <span className="text-xs text-[#6B7280] bg-[#F3F4F6] px-2.5 py-1.5 rounded-lg">
                        {draw.min_points > 0 ? `${draw.min_points} pts needed` : `${draw.min_visits} visits needed`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Feedback Section ─── */}
        <div
          className="bg-white rounded-2xl border border-[#E5E7EB]/20 shadow-sm overflow-hidden animate-slide-up"
          style={{ animationDelay: '160ms' }}
        >
          <div className="px-5 py-4 border-b border-[#E5E7EB]/20">
            <h3 className="font-bold text-[#111111] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#B8941F]">rate_review</span>
              Share Your Feedback
            </h3>
          </div>
          <div className="p-5">
            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-[#6B7280] text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <p className="font-bold text-[#111111]">Thank you for your feedback!</p>
                <p className="text-sm text-[#6B7280]">Your response helps us improve.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <p className="text-sm text-[#6B7280]">Rate your experience at {data.merchant_name}:</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-amber-400 hover:scale-125 active:scale-110 transition-transform p-1"
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
                  className="input-field resize-none h-auto py-3"
                />
                <Button
                  type="submit"
                  variant="filled"
                  loading={submittingFeedback}
                  disabled={rating === 0}
                  className="w-full py-3"
                >
                  Submit Feedback
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* ── Footer ─── */}
        <div className="text-center py-4 space-y-1 animate-fade-in" style={{ animationDelay: '240ms' }}>
          {data.merchant_phone && (
            <p className="text-sm text-[#6B7280]">
              Questions? Call{' '}
              <a href={`tel:${data.merchant_phone}`} className="text-[#B8941F] font-semibold hover:underline">
                {data.merchant_phone}
              </a>
            </p>
          )}
          <p className="text-xs text-[#6B7280]/60 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px]">bolt</span>
            Powered by Metro Cardz • <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("🔒 Data Privacy & Rights Policy:\n\n1. Metro Cardz collects your name & phone number solely to manage store loyalty points and issue rewards.\n2. Your personal data is encrypted and strictly isolated. We never sell or share customer PII.\n3. Under India DPDP Act 2023 guidelines, you have the right to request deletion or anonymization of your data at any time via store management."); }} className="underline hover:text-[#B8941F]">Privacy & Data Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}


