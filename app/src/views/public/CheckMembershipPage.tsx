/**
 * /check-membership
 *
 * Customer-facing read-only membership lookup. Customers can view their
 * points balance, active offers, and expiry date by entering their
 * membership number + last 4 digits of their registered mobile number —
 * no login, no OTP, no password required.
 *
 * Security: membership numbers are sequential (SAL001, SAL002...) and
 * guessable — unlike the opaque public_token used by QR codes. The
 * last-4-digit verification gate + a strict 10/hour/IP rate limit on
 * the backend prevent enumeration attacks.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PublicMemberView } from '../../types';
import * as api from '../../api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { format } from 'date-fns';

// ── Icon map (same as PublicMemberPage) ─────────────────────────────────────
const OFFER_ICONS: Record<string, string> = {
  percent_off: 'percent',
  free_service: 'spa',
  wallet_points: 'account_balance_wallet',
  referral: 'people',
  birthday: 'cake',
  points_redemption: 'stars',
  visit_milestone: 'workspace_premium',
};

// ── Animated count-up (reused pattern from PublicMemberPage) ─────────────────
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

// ── Skeleton shown while the API call is in-flight ──────────────────────────
function LookupSkeleton() {
  return (
    <div className="min-h-screen bg-surface-container-low">
      <div className="h-40 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 skeleton opacity-20" />
        <div className="flex flex-col items-center justify-center h-full gap-3 relative z-10">
          <div className="w-16 h-16 rounded-2xl skeleton" />
          <div className="w-36 h-5 rounded-full skeleton" />
          <div className="w-20 h-3 rounded-full skeleton opacity-60" />
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* View-only badge skeleton */}
        <div className="flex justify-center">
          <div className="w-44 h-7 rounded-full skeleton" />
        </div>
        {/* Member card skeleton */}
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-outline-variant/30 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl skeleton shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 rounded skeleton" />
              <div className="h-3 w-1/2 rounded skeleton" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-xl skeleton" />
            <div className="h-20 rounded-xl skeleton" />
          </div>
        </div>
        {/* Offers skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-28 rounded skeleton" />
          {[0, 1].map(i => (
            <div key={i} className="bg-surface rounded-2xl p-4 shadow-sm border border-outline-variant/20 flex items-start gap-3" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-11 h-11 rounded-xl skeleton shrink-0" />
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

// ── Lookup form (shown before a successful lookup) ───────────────────────────
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
      // Surface the server's message when helpful (e.g. rate-limit) or fall
      // back to a generic but safe message to avoid leaking info.
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
    <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6 animate-fade-in">

        {/* Hero icon + title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-on-primary-container text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface">Check Your Membership</h1>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            View your points balance and benefits — no login needed.
          </p>
          {/* View-only indicator */}
          <span className="inline-flex items-center gap-1.5 bg-surface border border-outline-variant/40 rounded-full px-3.5 py-1.5 text-xs font-semibold text-on-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-[15px]">visibility</span>
            View Only · Balance Enquiry
          </span>
        </div>

        {/* Form card */}
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-outline-variant/30 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <div className="space-y-1.5">
              <label htmlFor="cm-identifier" className="text-sm font-semibold text-on-surface">
                Membership Number or Mobile Number
              </label>
              <input
                id="cm-identifier"
                type="text"
                className="input-field"
                placeholder="e.g. SAL001 or 9876500000"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cm-last4" className="text-sm font-semibold text-on-surface">
                Last 4 Digits of Your Registered Mobile Number
              </label>
              <input
                id="cm-last4"
                type="tel"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                className="input-field tracking-[0.3em] text-center font-mono text-lg"
                placeholder="· · · ·"
                value={last4}
                onChange={e => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                autoComplete="off"
                disabled={loading}
              />
              <p className="text-xs text-on-surface-variant leading-relaxed">
                This 4-digit check keeps your membership details private from anyone who might guess your membership number.
              </p>
            </div>

            {error && (
              <div className="bg-error-container border border-error/20 rounded-xl p-3 flex items-start gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-on-error-container text-[18px] shrink-0 mt-0.5">error</span>
                <p className="text-sm text-on-error-container">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="filled"
              loading={loading}
              className="w-full py-3"
              icon={loading ? undefined : 'search'}
            >
              {loading ? 'Looking up…' : 'View My Details'}
            </Button>
          </form>
        </div>

        {/* Footer links */}
        <div className="text-center space-y-2">
          <p className="text-xs text-on-surface-variant/70">
            Prefer to scan? Use the <strong>QR code</strong> on your membership card.
          </p>
          <p className="text-xs text-on-surface-variant/50">
            <Link to="/login" className="text-primary hover:underline font-medium">Merchant login</Link>
            {' · '}
            <a href="/" className="text-primary hover:underline font-medium">Metro Cardz home</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Result view (shown after a successful lookup) ────────────────────────────
function MembershipResult({
  data,
  onReset,
}: {
  data: PublicMemberView;
  onReset: () => void;
}) {
  const [dataReady, setDataReady] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletUrl, setWalletUrl] = useState<string | null>(null);

  const pointsVal = Number(data.loyalty_points) || 0;
  const points = useCountUp(pointsVal, 1200, dataReady);

  useEffect(() => {
    const t = setTimeout(() => setDataReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  const isExpired = data.status === 'expired';

  return (
    <div className="min-h-screen bg-surface-container-low">

      {/* ── Hero header ── */}
      <header className="hero-shimmer px-4 pt-8 pb-16 text-on-primary text-center relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-4 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20">
            <span className="material-symbols-outlined text-on-primary text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{data.merchant_name}</h1>
          <p className="text-sm opacity-70 mt-0.5">Loyalty Membership</p>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="max-w-md mx-auto px-4 -mt-10 pb-8 space-y-4">

        {/* View-only badge */}
        <div className="flex justify-center animate-slide-up">
          <span className="inline-flex items-center gap-1.5 bg-surface border border-outline-variant/40 shadow-md rounded-full px-4 py-1.5 text-xs font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px]">visibility</span>
            View Only · Balance Enquiry · No changes possible
          </span>
        </div>

        {/* Expired banner */}
        {isExpired && (
          <div className="bg-error-container border border-error/20 rounded-2xl p-4 flex items-start gap-3 animate-slide-up">
            <span className="material-symbols-outlined text-on-error-container text-[22px] shrink-0">warning</span>
            <div>
              <p className="font-bold text-on-error-container">Membership Expired</p>
              <p className="text-sm text-on-error-container/80 mt-0.5">
                Visit {data.merchant_name} to renew your membership and restore your benefits.
              </p>
            </div>
          </div>
        )}

        {/* ── Member identity card ── */}
        <div className="bg-surface rounded-2xl shadow-lg border border-outline-variant/30 overflow-hidden animate-slide-up card-hover-glow">
          <div className="h-1.5 hero-shimmer" />
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5">
              {/* Avatar initials */}
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-bold text-xl shrink-0">
                {data.member_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-on-surface truncate">{data.member_name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary text-on-primary">
                    {data.membership_type_name}
                  </span>
                  <StatusBadge status={data.status} />
                </div>
                <p className="text-xs text-on-surface-variant font-mono font-semibold mt-1">{data.member_code}</p>
              </div>
            </div>

            {/* Stats grid — High-contrast Loyalty Points */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-center text-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-90">Loyalty Points</p>
                <p className="text-3xl font-extrabold tabular-nums tracking-tight">
                  {dataReady ? points.toLocaleString() : pointsVal.toLocaleString()}
                </p>
                <p className="text-xs font-semibold opacity-90 mt-0.5">pts</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${isExpired ? 'bg-error-container' : 'bg-surface-container'}`}>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                  {isExpired ? 'Expired On' : 'Valid Until'}
                </p>
                <p className={`text-lg font-bold ${isExpired ? 'text-on-error-container' : 'text-on-surface'}`}>
                  {format(new Date(data.expiry_date), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            {/* Total visits */}
            {(data.total_visits ?? 0) > 0 && (
              <div className="mt-3 pt-3 border-t border-outline-variant/20 text-center">
                <p className="text-sm text-on-surface-variant">
                  <span className="font-bold text-on-surface">{data.total_visits}</span> total {data.total_visits === 1 ? 'visit' : 'visits'} · Member since {format(new Date(data.expiry_date), 'yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Active Tier Benefits ── */}
        {data.offers && data.offers.length > 0 && !isExpired && (
          <div className="animate-slide-up space-y-3" style={{ animationDelay: '80ms' }}>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">workspace_premium</span>
              Your Tier Benefits ({data.offers.length})
            </h3>
            <div className="space-y-3">
              {data.offers.map((offer: any, idx: number) => (
                <div
                  key={offer.id || idx}
                  className="bg-surface rounded-2xl p-4 flex items-start gap-4 border border-outline-variant/20 shadow-sm animate-slide-up"
                  style={{ animationDelay: `${idx * 60 + 120}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-primary-container text-[20px]">
                      {OFFER_ICONS[offer.offer_type] || 'star'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface text-sm">{offer.title}</p>
                    <p className="text-sm text-on-surface-variant mt-0.5 leading-relaxed">{offer.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Store Coupons & Promos ── */}
        {data.coupons && data.coupons.length > 0 && !isExpired && (
          <div className="animate-slide-up space-y-3" style={{ animationDelay: '100ms' }}>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-secondary">confirmation_number</span>
              Active Store Coupons & Promos ({data.coupons.length})
            </h3>
            <div className="space-y-3">
              {data.coupons.map((coupon: any) => (
                <div key={coupon.id} className="bg-surface rounded-2xl p-4 border border-secondary-container/40 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-secondary text-base tracking-widest bg-secondary-container/30 px-3 py-1 rounded-xl border border-secondary/20">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          alert(`Coupon Code "${coupon.code}" copied! Show this code at checkout.`);
                        }}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span> Copy Code
                      </button>
                    </div>
                    <span className="text-sm font-bold text-on-surface">
                      {coupon.discount_type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-on-surface-variant gap-2 pt-1 border-t border-outline-variant/20">
                    <span>Min purchase: ₹{coupon.min_purchase || 0}</span>
                    {coupon.active_days && (
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <span className="material-symbols-outlined text-[12px]">repeat</span> Active: {coupon.active_days}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rewards Catalog ── */}
        {data.rewards && data.rewards.length > 0 && !isExpired && (
          <div className="animate-slide-up space-y-3" style={{ animationDelay: '120ms' }}>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-600">card_giftcard</span>
              Reward Catalog ({data.rewards.length})
            </h3>
            <div className="space-y-3">
              {data.rewards.map((reward: any) => (
                <div key={reward.id} className="bg-surface rounded-2xl p-4 border border-outline-variant/20 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-on-surface text-sm">{reward.name}</h4>
                    {reward.description && <p className="text-xs text-on-surface-variant mt-0.5">{reward.description}</p>}
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

        {/* ── Active Lucky Draws Section ── */}
        {data.open_lucky_draws && data.open_lucky_draws.length > 0 && (
          <div className="bg-surface rounded-2xl border border-amber-200/60 shadow-sm overflow-hidden animate-slide-up bg-gradient-to-br from-amber-50/50 to-orange-50/30 space-y-3 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/40">
              <h3 className="font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                Active Lucky Draws
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">Enter to Win</span>
            </div>
            <div className="space-y-3">
              {data.open_lucky_draws.map((draw: any) => (
                <div key={draw.id} className="bg-white p-4 rounded-xl border border-amber-200/40 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-on-surface">{draw.name}</h4>
                    <p className="text-sm text-amber-800 font-medium">Prize: {draw.prize}</p>
                    {draw.draw_date && <p className="text-xs text-on-surface-variant mt-0.5">Draw Date: {draw.draw_date}</p>}
                  </div>
                  <div>
                    {draw.already_entered ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span> Entered
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1.5 rounded-lg">
                        {draw.min_points > 0 ? `${draw.min_points} pts needed` : `${draw.min_visits} visits needed`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Invite Code & WhatsApp Share ── */}
        {data.referral_code && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-md space-y-2 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider opacity-90">Your Invite Code</span>
              <span className="font-mono font-bold text-lg bg-black/20 px-3 py-1 rounded-lg tracking-widest">{data.referral_code}</span>
            </div>
            <p className="text-xs opacity-90">Share with friends to earn bonus loyalty points on your next visit!</p>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join ${data.merchant_name} membership using my invite code ${data.referral_code}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-amber-700 hover:bg-amber-50 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
              Share on WhatsApp
            </a>
          </div>
        )}

        {/* ── How to Redeem Info Guide ── */}
        {!isExpired && (
          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/30 space-y-2 animate-slide-up" style={{ animationDelay: '140ms' }}>
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[16px]">help_outline</span>
              How to Redeem Offers & Rewards
            </h4>
            <ul className="text-xs text-on-surface-variant space-y-1.5 list-disc pl-4 leading-relaxed">
              <li><strong>Coupons:</strong> Mention code at POS checkout to get instant discounts.</li>
              <li><strong>Loyalty Points & Rewards:</strong> Show your member Code / Mobile Number at store counter. The cashier will apply your points & rewards instantly.</li>
              <li><strong>WhatsApp Alerts:</strong> Exclusive offers are sent directly to your registered WhatsApp number.</li>
            </ul>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <Button variant="outlined" onClick={onReset} className="w-full py-3" icon="search">
            Check Another Membership
          </Button>
        </div>

        {/* ── Footer ── */}
        <div className="text-center py-4 space-y-1 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {data.merchant_phone && (
            <p className="text-sm text-on-surface-variant">
              Questions? Call{' '}
              <a href={`tel:${data.merchant_phone}`} className="text-primary font-semibold hover:underline">
                {data.merchant_phone}
              </a>
            </p>
          )}
          <p className="text-xs text-on-surface-variant/60 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[12px]">bolt</span>
            Powered by Metro Cardz
          </p>
          <p className="text-xs text-on-surface-variant/40 mt-1">
            To redeem offers or manage your membership, visit{' '}
            <span className="font-medium">{data.merchant_name}</span> in person.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page root ────────────────────────────────────────────────────────────────
export default function CheckMembershipPage() {
  const [data, setData] = useState<PublicMemberView | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResult = (view: PublicMemberView) => {
    // Show skeleton while the result is being rendered in
    setLoading(true);
    setTimeout(() => {
      setData(view);
      setLoading(false);
    }, 300); // brief skeleton flash so the transition feels intentional
  };

  const handleReset = () => {
    setData(null);
  };

  if (loading) return <LookupSkeleton />;
  if (data) return <MembershipResult data={data} onReset={handleReset} />;
  return <LookupForm onResult={handleResult} />;
}
