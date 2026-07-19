import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PublicMemberView } from '../../types';
import * as api from '../../api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';

const OFFER_ICONS: Record<string, string> = {
  percent_off: 'percent', free_service: 'spa', wallet_points: 'account_balance_wallet',
  referral: 'people', birthday: 'cake',
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
    <div className="min-h-screen bg-[#f0f3ff]">
      {/* Header skeleton */}
      <div className="h-40 bg-[#00236f] relative overflow-hidden">
        <div className="absolute inset-0 skeleton opacity-20" />
        <div className="flex flex-col items-center justify-center h-full gap-3 relative z-10">
          <div className="w-16 h-16 rounded-2xl skeleton" />
          <div className="w-32 h-5 rounded-full skeleton" />
          <div className="w-20 h-3 rounded-full skeleton opacity-60" />
        </div>
      </div>
      {/* Card skeleton */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#e7eefe] space-y-4">
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
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-[#e7eefe] flex items-start gap-3" style={{ animationDelay: `${i * 80}ms` }}>
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

  // Feedback states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Google Wallet states
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletUrl, setWalletUrl] = useState<string | null>(null);

  // Animated loyalty points
  const points = useCountUp(data?.loyalty_points ?? 0, 1200, dataReady);

  useEffect(() => {
    if (!token) return;
    api.getPublicMemberView(token).then(d => {
      if (!d) setNotFound(true);
      else {
        setData(d);
        // Small delay so the page renders first, then animations fire
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
      <div className="min-h-screen bg-[#f0f3ff] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center mb-5 border border-red-100">
          <span className="material-symbols-outlined text-red-400 text-[44px]">credit_card_off</span>
        </div>
        <h1 className="text-headline-md font-headline-md text-on-surface mb-2">Card Not Recognized</h1>
        <p className="text-body-md text-on-surface-variant max-w-xs">
          This membership card could not be found. Please check the QR code and try again.
        </p>
      </div>
    );
  }

  const isActive = data.status === 'active';
  const isExpired = data.status === 'expired';

  return (
    <div className="min-h-screen bg-[#f0f3ff]">

      {/* ── Hero Header ─── */}
      <header className="hero-shimmer px-4 pt-8 pb-16 text-white text-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-4 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 animate-slide-up">
          {/* Merchant logo placeholder */}
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
            <span className="material-symbols-outlined text-red-500 text-[22px] shrink-0">warning</span>
            <div>
              <p className="font-bold text-red-800">Membership Expired</p>
              <p className="text-sm text-red-600 mt-0.5">
                Visit {data.merchant_name} to renew your membership and restore your benefits.
              </p>
            </div>
          </div>
        )}

        {/* ── Member identity card ─── */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#e7eefe] overflow-hidden animate-slide-up card-hover-glow">
          {/* Gradient accent bar */}
          <div className="h-1.5 hero-shimmer" />
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-[#00236f] flex items-center justify-center text-white font-bold text-xl shrink-0">
                {data.member_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{data.member_name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00236f] text-white">
                    {data.membership_type_name}
                  </span>
                  {/* Live status with pulse dot for active */}
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
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
              {/* Loyalty Points — animated */}
              <div className="bg-[#f0f3ff] rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Loyalty Points</p>
                <p className="text-2xl font-bold text-[#00236f] tabular-nums">
                  {dataReady ? points.toLocaleString() : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">pts</p>
              </div>
              {/* Expiry */}
              <div className={`rounded-xl p-4 text-center ${isExpired ? 'bg-red-50' : 'bg-[#f0f3ff]'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {isExpired ? 'Expired On' : 'Valid Until'}
                </p>
                <p className={`text-lg font-bold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                  {format(new Date(data.expiry_date), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Google Wallet CTA */}
            {!isExpired && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                {walletUrl ? (
                  <a
                    href={walletUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_wallet</span>
                    Add to Google Wallet
                  </a>
                ) : (
                  <button
                    disabled={walletLoading}
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
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {walletLoading
                      ? <span className="material-symbols-outlined animate-spin-slow text-[18px]">progress_activity</span>
                      : <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>add_to_wallet</span>
                    }
                    {walletLoading ? 'Generating…' : 'Add to Google Wallet'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Offers / Benefits ─── */}
        {data.offers.length > 0 && !isExpired && (
          <div className="animate-slide-up" style={{ animationDelay: '80ms' }}>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#00236f]">workspace_premium</span>
              Your Benefits
            </h3>
            <div className="space-y-3 stagger-children">
              {data.offers.map((offer: any, idx: number) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-2xl p-4 flex items-start gap-4 border border-[#e7eefe] shadow-sm animate-slide-up card-hover-glow"
                  style={{ animationDelay: `${idx * 60 + 120}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#e7eefe] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#00236f] text-[20px]">
                      {OFFER_ICONS[offer.offer_type] || 'star'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{offer.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>
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

        {/* ── Feedback Section ─── */}
        <div
          className="bg-white rounded-2xl border border-[#e7eefe] shadow-sm overflow-hidden animate-slide-up"
          style={{ animationDelay: '160ms' }}
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#00236f]">rate_review</span>
              Share Your Feedback
            </h3>
          </div>
          <div className="p-5">
            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-emerald-500 text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <p className="font-bold text-gray-900">Thank you for your feedback!</p>
                <p className="text-sm text-gray-500">Your response helps us improve.</p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <p className="text-sm text-gray-500">Rate your experience at {data.merchant_name}:</p>
                {/* Star Rating */}
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
                  className="w-full p-3 bg-[#f0f3ff] border border-[#e7eefe] rounded-xl text-sm outline-none focus:border-[#00236f] focus:ring-2 focus:ring-[#00236f]/10 transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingFeedback || rating === 0}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingFeedback && <span className="material-symbols-outlined animate-spin-slow text-[16px]">progress_activity</span>}
                  Submit Feedback
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Footer ─── */}
        <div className="text-center py-4 space-y-1 animate-fade-in" style={{ animationDelay: '240ms' }}>
          {data.merchant_phone && (
            <p className="text-sm text-gray-500">
              Questions? Call{' '}
              <a href={`tel:${data.merchant_phone}`} className="text-[#00236f] font-semibold hover:underline">
                {data.merchant_phone}
              </a>
            </p>
          )}
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px]">bolt</span>
            Powered by Metro Cardz
          </p>
        </div>
      </div>
    </div>
  );
}
