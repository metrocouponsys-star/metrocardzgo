/**
 * /check-membership
 * Ultra-Premium Digital Member Pass & Balance Enquiry Portal
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { PublicMemberView } from '../../types';
import * as api from '../../api';
import { StatusBadge } from '../../components/ui/StatusBadge';
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
  onResult: (data: PublicMemberView, creds?: { identifier: string; last4: string }) => void;
}) {
  const [searchParams] = useSearchParams();
  const merchantQuery = searchParams.get('merchant') || searchParams.get('store');
  const storeName = merchantQuery
    ? (merchantQuery.toLowerCase().includes('kanku') ? 'Kanku Jewellers' : merchantQuery)
    : null;

  const [identifier, setIdentifier] = useState('');
  const [last4, setLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
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
      onResult(view, { identifier: trimId, last4: trimLast4 });
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

        {/* Customer Membership Portal Header with Merchant Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto shadow-md text-white border-2 border-white">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
          </div>
          <div>
            {storeName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black mb-2">
                <span className="material-symbols-outlined text-[15px] text-amber-700">storefront</span>
                {storeName}
              </div>
            )}
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Customer <span className="text-amber-600">Points & Membership</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Digital Membership & Rewards Portal</p>
          </div>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
            View your points balance, benefits & active store coupons — no login required.
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3.5 py-1 text-xs font-bold text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Customer Check Points
            </span>
            <span className="text-[11px] text-slate-400 font-bold">· Powered by Metro Cardz</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-6 shadow-card border border-outline-variant/40 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            <div className="space-y-2">
              <label htmlFor="cm-identifier" className="form-label flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-accent">card_membership</span>
                Membership Code or Mobile Number
              </label>
              <div className="relative">
                <input
                  id="cm-identifier"
                  type="text"
                  className="input-field"
                  placeholder="e.g. #MC0004 or 9987379000"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoComplete="off"
                  disabled={loading}
                />
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Example: #MC0004, SAL001, 4821..., or your 10-digit mobile number
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="cm-last4" className="form-label flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-accent">lock</span>
                  Last 4 Digits of Registered Phone
                </span>
                <span className="text-[10px] text-on-surface-variant/50 font-bold uppercase">Security Check</span>
              </label>
              <input
                id="cm-last4"
                type="tel"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                className="input-field text-center font-mono text-xl tracking-[0.4em] font-extrabold text-accent"
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

            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-amber-600 shrink-0">info</span>
              <span><strong>Multiple stores?</strong> Enter your registered mobile number to access and switch between all your store memberships.</span>
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
        <div className="text-center space-y-2 text-[12px] text-on-surface-variant/60">
          <p>Scanning QR code on card directly opens this view.</p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <Link to="/login" className="text-accent hover:underline font-bold">Merchant Login</Link>
            <span className="text-outline-variant">·</span>
            <a href="/" className="text-on-surface-variant hover:underline">MetroCardz Home</a>
          </div>
        </div>

      </div>
    </div>
  );
}

function MembershipResult({
  data,
  onReset,
  onSync,
  isSyncing,
  lastSyncedAt,
  syncToast,
  onSwitchMerchant,
  switchingMemberId,
}: {
  data: PublicMemberView;
  onReset: () => void;
  onSync: (silent?: boolean) => void;
  isSyncing: boolean;
  lastSyncedAt: Date;
  syncToast: string | null;
  onSwitchMerchant: (memberId: string) => Promise<void> | void;
  switchingMemberId: string | null;
}) {
  const [dataReady, setDataReady] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'perks' | 'coupons' | 'rewards' | 'history' | 'referral'>('perks');

  const pointsVal = Number(data.loyalty_points) || 0;
  const points = useCountUp(pointsVal, 1200, dataReady);

  const merchantDesign = React.useMemo(() => {
    const loaded = loadSavedCardDesign((data as any).merchant_id || data.member_id || 'mer-001', 'store_loyalty');
    const rawDesign = (data as any)?.card_design_url;
    if (rawDesign) {
      try {
        if (typeof rawDesign === 'string' && rawDesign.trim().startsWith('{')) {
          const parsed = JSON.parse(rawDesign);
          return {
            ...loaded,
            ...parsed,
            brandName: (data.merchant_name || parsed.brandName || loaded.brandName).toUpperCase(),
            customLogoUrl: parsed.customLogoUrl || (data as any).merchant_logo || loaded.customLogoUrl,
          };
        } else if (typeof rawDesign === 'string' && rawDesign.trim().length > 0) {
          return {
            ...loaded,
            backgroundImageUrl: rawDesign,
            brandName: (data.merchant_name || loaded.brandName).toUpperCase(),
            customLogoUrl: (data as any).merchant_logo || loaded.customLogoUrl,
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
    if (data.merchant_name) {
      loaded.brandName = data.merchant_name.toUpperCase();
    }
    if ((data as any).merchant_logo && !loaded.customLogoUrl) {
      loaded.customLogoUrl = (data as any).merchant_logo;
    }
    return loaded;
  }, [data.merchant_name, (data as any).merchant_id, data.member_id, (data as any)?.card_design_url, (data as any)?.merchant_logo]);

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

  const formattedSyncTime = React.useMemo(() => {
    try {
      return lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  }, [lastSyncedAt]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-14 selection:bg-amber-500 selection:text-black relative">

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">verified</span>
          {syncToast}
        </div>
      )}

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

          {/* Multi-Store Switcher Banner */}
          {data.other_memberships && data.other_memberships.length > 0 && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-amber-600">storefront</span>
                Switch to your other store memberships:
              </p>
              <div className="space-y-1.5">
                {data.other_memberships.map(other => (
                  <button
                    key={other.member_id}
                    type="button"
                    disabled={switchingMemberId === other.member_id}
                    onClick={() => onSwitchMerchant(other.member_id)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 flex items-center justify-between transition-all group shadow-xs text-left active:scale-[0.99] disabled:opacity-60 cursor-pointer"
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
                      {switchingMemberId === other.member_id ? (
                        <>
                          <span className="w-3 h-3 rounded-full border-2 border-amber-700 border-t-transparent animate-spin" />
                          <span className="text-[10px]">Switching…</span>
                        </>
                      ) : (
                        <>
                          <span>Switch</span>
                          <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <h1 className="text-xl font-black text-slate-900">{data.merchant_name}</h1>
          <p className="text-xs text-slate-500 font-semibold">Digital Loyalty Member Pass</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">

        {/* ── Live Sync Status Bar ── */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-2.5 px-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <p className="text-[11px] font-bold text-slate-800 leading-tight">Live Pass Sync Active</p>
              <p className="text-[10px] text-slate-400 font-medium">Last synced: {formattedSyncTime}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSync(false)}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-60"
            title="Sync latest points and offer balance"
          >
            <span className={`material-symbols-outlined text-[15px] ${isSyncing ? 'animate-spin text-amber-600' : 'text-amber-700'}`}>
              sync
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Sync Pass'}</span>
          </button>
        </div>

        {/* ── 3D Interactive Merchant-Designed Member Pass ── */}
        <div className="space-y-2">
          <InteractiveFlipCard
            key={`${data.member_id}-${(data as any).merchant_id || ''}-${data.physical_card_number || data.member_code}`}
            design={merchantDesign}
            memberName={data.member_name}
            cardNumber={formatCardNumber(data.physical_card_number || data.member_code)}
            validThru={safeFormat(data.expiry_date, 'MM/yy', '12/28')}
            tier={data.membership_type_name}
            points={pointsVal}
            qrValue={`https://metrocardz.in/m/${data.member_code}`}
            interactive={true}
          />
          <p className="text-center text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5 pt-1">
            <span className="material-symbols-outlined text-[15px] text-amber-500">touch_app</span>
            Tap card to flip · View scannable Barcode & QR Code on back
          </p>
        </div>

        {/* ── Light Modern Digital Member Card ── */}
        <div className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">

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
                {safeFormat(data.expiry_date, 'dd MMM yyyy', '—')}
              </p>
            </div>
          </div>

          {/* Formatted Membership Card Number */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl p-4 text-slate-100 flex items-center justify-between shadow-md border border-slate-800">
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">credit_card</span>
                Membership Card Number
              </p>
              <p className="text-base font-mono font-black tracking-widest text-white mt-1">
                {formatCardNumber(data.physical_card_number || data.member_code)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] text-amber-400/80">contactless</span>
              <button
                type="button"
                onClick={() => copyCoupon(data.physical_card_number || data.member_code)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                title="Copy card number"
              >
                <span className="material-symbols-outlined text-[16px]">{copiedCode === (data.physical_card_number || data.member_code) ? 'done' : 'content_copy'}</span>
              </button>
            </div>
          </div>
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
                  data.offers.map((offer: any, idx: number) => {
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
                            : 'bg-white border-slate-200/90 shadow-xs hover:border-amber-400 hover:shadow-md'
                        }`}
                      >
                        {/* Offer Image Header when present */}
                        {offer.image_url && (
                          <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                            <img
                              src={offer.image_url}
                              alt={offer.title}
                              className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${isExhausted ? 'grayscale' : ''}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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
                                      : 'bg-amber-100 border-amber-300 text-amber-800 shadow-2xs'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[20px]">
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
                                <h4 className={`font-bold text-sm mt-1 leading-snug ${isExhausted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                  {offer.title}
                                </h4>
                                {offer.description && (
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{offer.description}</p>
                                )}
                                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                                  {offer.points_cost > 0 && (
                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                      {offer.points_cost} pts to redeem
                                    </span>
                                  )}
                                  {offer.loyalty_points_earn > 0 && (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
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
                                        : 'bg-amber-500 text-slate-950 border-amber-600'
                                    }`}
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
                          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-slate-400">tune</span>
                                Remaining Benefit Quota
                              </span>
                              <span className={`font-bold ${isExhausted ? 'text-slate-400' : 'text-amber-800'}`}>
                                {isExhausted ? '0 uses remaining' : `${remainingVal} of ${initialVal} uses remaining`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
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
                  })
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
                          <p className="font-bold text-slate-900 capitalize">{t.description || t.transaction_type?.replace('_', ' ')}</p>
                          {t.created_at && <p className="text-[10px] text-slate-400 mt-0.5">{safeFormat(t.created_at, 'dd MMM yyyy, HH:mm')}</p>}
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
                          {r.redeemed_at && <p className="text-[10px] text-amber-700 mt-0.5">{safeFormat(r.redeemed_at, 'dd MMM yyyy, HH:mm')}</p>}
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
  const [credentials, setCredentials] = useState<{ identifier: string; last4: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [switchingMemberId, setSwitchingMemberId] = useState<string | null>(null);

  const handleResult = (view: PublicMemberView, creds?: { identifier: string; last4: string }) => {
    setLoading(true);
    if (creds) setCredentials(creds);
    setTimeout(() => {
      setData(view);
      setLastSyncedAt(new Date());
      setLoading(false);
    }, 200);
  };

  const handleReset = () => {
    setData(null);
    setCredentials(null);
  };

  const handleSwitchMerchant = async (memberId: string) => {
    setSwitchingMemberId(memberId);
    try {
      const switchedView = await api.getPublicMemberView(memberId);
      if (switchedView) {
        setData(switchedView);
        setLastSyncedAt(new Date());
        setSyncToast(`Switched to ${switchedView.merchant_name}! Pass updated.`);
        setTimeout(() => setSyncToast(null), 3000);
      }
    } catch (err: any) {
      console.error('[CheckMembership] Failed to switch merchant:', err);
    } finally {
      setSwitchingMemberId(null);
    }
  };

  const syncMemberData = React.useCallback(async (silent = false) => {
    if (!data) return;
    if (!silent) setIsSyncing(true);

    try {
      let updatedView: PublicMemberView | null = null;
      if (credentials) {
        updatedView = await api.lookupMembership(credentials.identifier, credentials.last4);
      } else if (data.member_id) {
        updatedView = await api.getPublicMemberView(data.member_id);
      }

      if (updatedView) {
        setData(updatedView);
        setLastSyncedAt(new Date());
        if (!silent) {
          setSyncToast('Pass updated with latest points & perks!');
          setTimeout(() => setSyncToast(null), 3000);
        }
      }
    } catch (err) {
      console.warn('[CheckMembership] sync error:', err);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [data, credentials]);

  // Real-time synchronization hooks
  useEffect(() => {
    if (!data) return;

    // 1. BroadcastChannel (cross-window/cross-tab)
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('metrocardz_sync_channel');
        bc.onmessage = (event) => {
          const msg = event.data;
          if (!msg?.member_id || msg.member_id === data.member_id) {
            syncMemberData(true);
          }
        };
      } catch {}
    }

    // 2. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'metrocardz_last_sync_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (!parsed.member_id || parsed.member_id === data.member_id) {
            syncMemberData(true);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Custom event
    const handleCustom = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail?.member_id || detail.member_id === data.member_id) {
        syncMemberData(true);
      }
    };
    window.addEventListener('metrocardz_sync', handleCustom);

    // 4. Focus & visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncMemberData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // 5. Periodic auto-poll every 8 seconds while page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncMemberData(true);
      }
    }, 8000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('metrocardz_sync', handleCustom);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      clearInterval(interval);
    };
  }, [data?.member_id, syncMemberData]);

  if (loading) return <LookupSkeleton />;
  if (data) {
    return (
      <MembershipResult
        data={data}
        onReset={handleReset}
        onSync={syncMemberData}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
        syncToast={syncToast}
        onSwitchMerchant={handleSwitchMerchant}
        switchingMemberId={switchingMemberId}
      />
    );
  }
  return <LookupForm onResult={handleResult} />;
}
